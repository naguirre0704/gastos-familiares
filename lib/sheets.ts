import { google } from "googleapis";
import { Gasto, Comercio, Categoria } from "@/types";

const SHEET_NAME = "Gastos Familiares App";

const CATEGORIAS_INICIALES: Omit<Categoria, "activa">[] = [
  { nombre: "Supermercado", emoji: "🛒", color: "#10B981", presupuestoMensual: 500000 },
  { nombre: "Bencina", emoji: "⛽", color: "#F59E0B", presupuestoMensual: 150000 },
  { nombre: "Restaurante", emoji: "🍽️", color: "#EF4444", presupuestoMensual: 200000 },
  { nombre: "Farmacia", emoji: "💊", color: "#8B5CF6", presupuestoMensual: 80000 },
  { nombre: "Entretenimiento", emoji: "🎬", color: "#3B82F6", presupuestoMensual: 100000 },
  { nombre: "Ropa", emoji: "👕", color: "#EC4899", presupuestoMensual: 100000 },
  { nombre: "Educación", emoji: "📚", color: "#06B6D4", presupuestoMensual: 150000 },
  { nombre: "Transporte", emoji: "🚗", color: "#84CC16", presupuestoMensual: 80000 },
  { nombre: "Hogar", emoji: "🏠", color: "#F97316", presupuestoMensual: 100000 },
  { nombre: "Otros", emoji: "📦", color: "#6B7280", presupuestoMensual: 200000 },
];

function getSheetsClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth });
}

export async function getOrCreateSheet(accessToken: string): Promise<string> {
  const sheetsClient = getSheetsClient(accessToken);
  const drive = google.drive({
    version: "v3",
    auth: (() => {
      const a = new google.auth.OAuth2();
      a.setCredentials({ access_token: accessToken });
      return a;
    })(),
  });

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (sheetId) return sheetId;

  // Search for existing sheet
  const list = await drive.files.list({
    q: `name='${SHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: "files(id, name)",
  });

  if (list.data.files && list.data.files.length > 0) {
    return list.data.files[0].id!;
  }

  // Create new sheet
  const spreadsheet = await sheetsClient.spreadsheets.create({
    requestBody: {
      properties: { title: SHEET_NAME },
      sheets: [
        { properties: { title: "gastos" } },
        { properties: { title: "comercios" } },
        { properties: { title: "categorias" } },
        { properties: { title: "presupuestos" } },
      ],
    },
  });

  const id = spreadsheet.data.spreadsheetId!;

  // Add headers
  await sheetsClient.spreadsheets.values.batchUpdate({
    spreadsheetId: id,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        {
          range: "gastos!A1:J1",
          values: [["id", "fecha", "hora", "monto", "comercio", "categoria", "cuenta", "gmailId", "creadoPor", "notas"]],
        },
        {
          range: "comercios!A1:D1",
          values: [["comercio", "categoria", "vecesUsado", "ultimaVez"]],
        },
        {
          range: "categorias!A1:E1",
          values: [["nombre", "emoji", "color", "presupuestoMensual", "activa"]],
        },
        {
          range: "presupuestos!A1:C1",
          values: [["mes", "categoria", "presupuesto"]],
        },
      ],
    },
  });

  // Seed categories
  const catRows = CATEGORIAS_INICIALES.map((c) => [
    c.nombre, c.emoji, c.color, c.presupuestoMensual, "true",
  ]);
  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: id,
    range: "categorias!A2",
    valueInputOption: "RAW",
    requestBody: { values: catRows },
  });

  return id;
}

// ─── GASTOS ──────────────────────────────────────────────────────────────────

export async function getGastos(accessToken: string, sheetId: string): Promise<Gasto[]> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "gastos!A2:J",
  });
  const rows = res.data.values || [];
  return rows.map((r) => ({
    id: r[0] || "",
    fecha: r[1] || "",
    hora: r[2] || "",
    monto: parseInt(r[3] || "0", 10),
    comercio: r[4] || "",
    categoria: r[5] || "",
    cuenta: r[6] || "",
    gmailId: r[7] || "",
    creadoPor: r[8] || "",
    notas: r[9] || "",
  }));
}

export async function appendGasto(
  accessToken: string,
  sheetId: string,
  gasto: Gasto
): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "gastos!A2",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        gasto.id, gasto.fecha, gasto.hora, gasto.monto, gasto.comercio,
        gasto.categoria, gasto.cuenta, gasto.gmailId, gasto.creadoPor, gasto.notas,
      ]],
    },
  });
}

export async function updateGastoCategoria(
  accessToken: string,
  sheetId: string,
  gastoId: string,
  nuevaCategoria: string
): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "gastos!A2:J",
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === gastoId);
  if (rowIndex === -1) return;
  const sheetRow = rowIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `gastos!F${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[nuevaCategoria]] },
  });
}

// ─── COMERCIOS ───────────────────────────────────────────────────────────────

export async function getComercios(accessToken: string, sheetId: string): Promise<Comercio[]> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "comercios!A2:D",
  });
  const rows = res.data.values || [];
  return rows.map((r) => ({
    comercio: r[0] || "",
    categoria: r[1] || "",
    vecesUsado: parseInt(r[2] || "0", 10),
    ultimaVez: r[3] || "",
  }));
}

export async function upsertComercio(
  accessToken: string,
  sheetId: string,
  comercio: string,
  categoria: string,
  fecha: string
): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "comercios!A2:D",
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === comercio);

  if (rowIndex === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "comercios!A2",
      valueInputOption: "RAW",
      requestBody: { values: [[comercio, categoria, 1, fecha]] },
    });
  } else {
    const sheetRow = rowIndex + 2;
    const vecesUsado = parseInt(rows[rowIndex][2] || "0", 10) + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `comercios!B${sheetRow}:D${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [[categoria, vecesUsado, fecha]] },
    });
  }
}

// ─── CATEGORIAS ──────────────────────────────────────────────────────────────

export async function getCategorias(accessToken: string, sheetId: string): Promise<Categoria[]> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "categorias!A2:E",
  });
  const rows = res.data.values || [];
  return rows.map((r) => ({
    nombre: r[0] || "",
    emoji: r[1] || "",
    color: r[2] || "#6B7280",
    presupuestoMensual: parseInt(r[3] || "0", 10),
    activa: r[4] === "true",
  }));
}

export async function updateCategoria(
  accessToken: string,
  sheetId: string,
  nombre: string,
  presupuesto: number
): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "categorias!A2:E",
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === nombre);
  if (rowIndex === -1) return;
  const sheetRow = rowIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `categorias!D${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[presupuesto]] },
  });
}

// ─── PRESUPUESTOS ─────────────────────────────────────────────────────────────

export async function getPresupuestos(
  accessToken: string,
  sheetId: string
): Promise<import("@/types").Presupuesto[]> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "presupuestos!A2:C",
  });
  const rows = res.data.values || [];
  return rows.map((r) => ({
    mes: r[0] || "",
    categoria: r[1] || "",
    presupuesto: parseInt(r[2] || "0", 10),
  }));
}

export async function upsertPresupuesto(
  accessToken: string,
  sheetId: string,
  mes: string,
  categoria: string,
  presupuesto: number
): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "presupuestos!A2:C",
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === mes && r[1] === categoria);

  if (rowIndex === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "presupuestos!A2",
      valueInputOption: "RAW",
      requestBody: { values: [[mes, categoria, presupuesto]] },
    });
  } else {
    const sheetRow = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `presupuestos!C${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [[presupuesto]] },
    });
  }
}
