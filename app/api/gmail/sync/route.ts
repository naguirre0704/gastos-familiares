import { NextResponse } from "next/server";
import { fetchGastosDeGmail, isGmailConnected } from "@/lib/gmail";
import { getGastos, getComercios, getUltimaImportacion } from "@/lib/storage";
import { apiError } from "@/lib/api";

const GMAIL_DATE_RE = /^\d{4}\/\d{2}\/\d{2}$/;
const FALLBACK_DATE = "2025/12/31";

function toGmailDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function safeGmailDate(raw: string): string {
  // Validate format before interpolating into Gmail query (VULN-13)
  return GMAIL_DATE_RE.test(raw) ? raw : FALLBACK_DATE;
}

export async function GET() {
  try {
    const connected = await isGmailConnected();
    return NextResponse.json({ connected });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST() {
  try {
    const connected = await isGmailConnected();
    if (!connected) {
      return NextResponse.json({ needsAuth: true }, { status: 401 });
    }

    const ultima = await getUltimaImportacion();
    const afterDate = safeGmailDate(ultima ? toGmailDate(ultima.timestamp) : FALLBACK_DATE);

    const [gmailGastos, existentes, comercios] = await Promise.all([
      fetchGastosDeGmail(afterDate),
      getGastos(),
      getComercios(),
    ]);

    const gmailIdsExistentes = new Set(
      existentes.filter((g) => g.gmailId).map((g) => g.gmailId)
    );

    const categoriaPorComercio = new Map(
      comercios.map((c) => [c.comercio.toUpperCase(), c.categoria])
    );

    const pendientes = gmailGastos
      .filter((g) => !gmailIdsExistentes.has(g.gmailId))
      .map((g) => ({
        ...g,
        categoriaSugerida: categoriaPorComercio.get(g.comercio.toUpperCase()) ?? "",
      }));

    return NextResponse.json({ pendientes, total: gmailGastos.length, desdeDate: afterDate });
  } catch (error) {
    return apiError(error);
  }
}
