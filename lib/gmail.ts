import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";

const TOKEN_FILE = path.join(process.cwd(), "data", "gmail-tokens.json");
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

// ── OAuth client ─────────────────────────────────────────────────────────────

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXTAUTH_URL}/api/gmail/callback`
  );
}

export function getAuthUrl() {
  const auth = getOAuth2Client();
  return auth.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

// ── Token storage ─────────────────────────────────────────────────────────────

export async function saveTokens(tokens: Record<string, unknown>) {
  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

export async function loadTokens(): Promise<Record<string, unknown> | null> {
  try {
    const content = await fs.readFile(TOKEN_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function isGmailConnected(): Promise<boolean> {
  const tokens = await loadTokens();
  return tokens !== null;
}

export async function getAuthenticatedClient() {
  const tokens = await loadTokens();
  if (!tokens) return null;

  const auth = getOAuth2Client();
  auth.setCredentials(tokens);

  // Persist refreshed tokens automatically
  auth.on("tokens", async (newTokens) => {
    const current = (await loadTokens()) ?? {};
    await saveTokens({ ...current, ...newTokens });
  });

  return auth;
}

// ── Email body extractor ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPlainText(payload: any): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  // For multipart, prefer text/plain over text/html
  if (payload.parts) {
    // First pass: look for text/plain
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
    }
    // Second pass: recurse into nested parts
    for (const part of payload.parts) {
      const body = extractPlainText(part);
      if (body) return body;
    }
  }

  // Fallback: decode body.data if present (might be HTML)
  if (payload.body?.data) {
    const raw = Buffer.from(payload.body.data, "base64url").toString("utf-8");
    // Strip HTML tags if needed
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  return "";
}

// ── Banco de Chile "Cargo en Cuenta" parser ───────────────────────────────────

export interface GastoParseado {
  gmailId: string;
  fecha: string;  // DD/MM/YYYY
  hora: string;   // HH:MM
  monto: number;
  comercio: string;
  comentario?: string;
  tipo?: "compra" | "transferencia";
}

function parseMonto(text: string): number | null {
  // Patterns: "compra por $3.100", "Monto del Cargo: $25.990", "Monto: $ 1.234.567", "$25.990"
  const patterns = [
    /compra por\s*\$\s*([\d.]+)/i,
    /monto[^:]*:\s*\$\s*([\d.]+)/i,
    /cargo[^:$]*:\s*\$\s*([\d.]+)/i,
    /\$\s*([\d.]+)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      // Remove thousand-separator dots (Chilean format)
      const clean = m[1].replace(/\./g, "");
      const n = parseInt(clean, 10);
      if (!isNaN(n) && n > 0) return n;
    }
  }
  return null;
}

function parseComercioParts(text: string): string | null {
  const patterns = [
    // "en FRUTAS CARLOS DIA el 15/03/2026" — Banco de Chile inline format
    /\ben ([A-Z0-9][^\n]+?) el \d{2}\/\d{2}\/\d{4}/,
    /Comercio[:\s]+(.+)/i,
    /Establecimiento[:\s]+(.+)/i,
    /Nombre del[^:]+:[:\s]+(.+)/i,
    /realizado en[:\s]+(.+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      return m[1].trim().split(/\r?\n/)[0].trim();
    }
  }
  return null;
}

function parseFecha(text: string): { fecha: string; hora: string } | null {
  // Match DD/MM/YYYY
  const fechaRe = /(\d{2}\/\d{2}\/\d{4})/;
  const horaRe = /(\d{2}:\d{2})/;

  const fechaM = text.match(fechaRe);
  const horaM = text.match(horaRe);

  if (!fechaM) return null;
  return {
    fecha: fechaM[1],
    hora: horaM ? horaM[1] : "00:00",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEmail(id: string, payload: any): GastoParseado | null {
  const body = extractPlainText(payload);
  if (!body) return null;

  const monto = parseMonto(body);
  if (!monto) return null;

  const comercio = parseComercioParts(body);
  if (!comercio) return null;

  const fechaHora = parseFecha(body);
  if (!fechaHora) return null;

  return {
    gmailId: id,
    fecha: fechaHora.fecha,
    hora: fechaHora.hora,
    monto,
    comercio: comercio.toUpperCase(),
  };
}

// ── Banco de Chile "Transferencia a terceros" parser ──────────────────────────

const MESES_ES: Record<string, string> = {
  enero: "01", febrero: "02", marzo: "03", abril: "04",
  mayo: "05", junio: "06", julio: "07", agosto: "08",
  septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12",
};

function parseSpanishDate(text: string): { fecha: string; hora: string } | null {
  // "viernes 13 de marzo de 2026 09:00"
  const m = text.match(/(\d{1,2}) de (\w+) de (\d{4})\s+(\d{2}:\d{2})/i);
  if (!m) return null;
  const mes = MESES_ES[m[2].toLowerCase()];
  if (!mes) return null;
  return { fecha: `${m[1].padStart(2, "0")}/${mes}/${m[3]}`, hora: m[4] };
}

function parseTransferencia(id: string, payload: unknown): GastoParseado | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = extractPlainText(payload as any);
  if (!body) return null;

  // Destination name: "Nombre y Apellido     Camila Bravo"
  // Stop at multi-space, digit (Rut) or newline to avoid capturing subsequent table fields
  const nombreM = body.match(
    /Nombre y Apellido\s+([A-Za-záéíóúüñÁÉÍÓÚÜÑ]+(?: [A-Za-záéíóúüñÁÉÍÓÚÜÑ]+)*)/i
  );
  if (!nombreM) return null;
  const destino = nombreM[1].trim();

  // Amount — reuse parseMonto (matches "Monto   $10.000")
  const monto = parseMonto(body);
  if (!monto) return null;

  // Date — Spanish format
  const fechaHora = parseSpanishDate(body);
  if (!fechaHora) return null;

  // Optional message between "Mensaje" section and "Fecha y Hora:"
  const mensajeM = body.match(/Mensaje\s*[\r\n]+([\s\S]*?)(?=Fecha y Hora:|Transacci[oó]n)/i);
  const comentario = mensajeM ? mensajeM[1].trim() : "";

  return {
    gmailId: id,
    fecha: fechaHora.fecha,
    hora: fechaHora.hora,
    monto,
    comercio: destino.toUpperCase(),
    comentario: comentario || undefined,
    tipo: "transferencia",
  };
}

// ── Main fetcher ──────────────────────────────────────────────────────────────

export async function fetchGastosDeGmail(): Promise<GastoParseado[]> {
  const auth = await getAuthenticatedClient();
  if (!auth) throw new Error("Gmail no conectado");

  const gmail = google.gmail({ version: "v1", auth });

  // Banco de Chile purchase notifications in 2026
  const query = `from:enviodigital@bancochile.cl after:2025/12/31`;

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 500,
  });

  // Also fetch transfer notifications
  const transferenciaRes = await gmail.users.messages.list({
    userId: "me",
    q: `from:serviciodetransferencias@bancochile.cl after:2025/12/31`,
    maxResults: 500,
  });

  const messages = listRes.data.messages ?? [];
  const transMessages = transferenciaRes.data.messages ?? [];
  const gastos: GastoParseado[] = [];

  // Parse purchase notifications
  for (const msg of messages) {
    if (!msg.id) continue;
    try {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });
      const parsed = parseEmail(msg.id, detail.data.payload);
      if (parsed) gastos.push({ ...parsed, tipo: "compra" });
    } catch {
      // Skip unreadable messages
    }
  }

  // Parse transfer notifications
  for (const msg of transMessages) {
    if (!msg.id) continue;
    try {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });
      const parsed = parseTransferencia(msg.id, detail.data.payload);
      if (parsed) gastos.push(parsed);
    } catch {
      // Skip unreadable messages
    }
  }

  // Sort oldest first
  gastos.sort((a, b) => {
    const toDate = (g: GastoParseado) => {
      const [d, mo, y] = g.fecha.split("/");
      return new Date(`${y}-${mo}-${d}T${g.hora}`).getTime();
    };
    return toDate(a) - toDate(b);
  });

  return gastos;
}
