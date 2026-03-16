import { NextResponse } from "next/server";
import { fetchGastosDeGmail, isGmailConnected } from "@/lib/gmail";
import { getGastos, getComercios } from "@/lib/storage";

export async function POST() {
  try {
    const connected = await isGmailConnected();
    if (!connected) {
      return NextResponse.json({ needsAuth: true }, { status: 401 });
    }

    const [gmailGastos, existentes, comercios] = await Promise.all([
      fetchGastosDeGmail(),
      getGastos(),
      getComercios(),
    ]);

    // Deduplicate by gmailId
    const gmailIdsExistentes = new Set(
      existentes.filter((g) => g.gmailId).map((g) => g.gmailId)
    );

    // Build a quick lookup for suggested categories (from previous categorizations)
    const categoriaPorComercio = new Map(
      comercios.map((c) => [c.comercio.toUpperCase(), c.categoria])
    );

    const pendientes = gmailGastos
      .filter((g) => !gmailIdsExistentes.has(g.gmailId))
      .map((g) => ({
        ...g,
        categoriaSugerida: categoriaPorComercio.get(g.comercio) ?? "",
      }));

    return NextResponse.json({ pendientes, total: gmailGastos.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
