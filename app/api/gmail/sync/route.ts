import { NextResponse } from "next/server";
import { fetchGastosDeGmail, isGmailConnected } from "@/lib/gmail";
import { getGastos, getComercios, getUltimaImportacion } from "@/lib/storage";

function toGmailDate(iso: string): string {
  // ISO -> "YYYY/MM/DD" for Gmail after: filter
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export async function GET() {
  const connected = await isGmailConnected();
  return NextResponse.json({ connected });
}

export async function POST() {
  try {
    const connected = await isGmailConnected();
    if (!connected) {
      return NextResponse.json({ needsAuth: true }, { status: 401 });
    }

    const ultima = await getUltimaImportacion();
    const afterDate = ultima ? toGmailDate(ultima.timestamp) : "2025/12/31";

    const [gmailGastos, existentes, comercios] = await Promise.all([
      fetchGastosDeGmail(afterDate),
      getGastos(),
      getComercios(),
    ]);

    // Deduplicate by gmailId
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
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
