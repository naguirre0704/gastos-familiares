import { NextRequest, NextResponse } from "next/server";
import { appendGasto, upsertComercio } from "@/lib/storage";
import { v4 as uuid } from "uuid";

interface GastoImport {
  gmailId: string;
  fecha: string;
  hora: string;
  monto: number;
  comercio: string;
  categoria: string;
}

export async function POST(req: NextRequest) {
  try {
    const { gastos }: { gastos: GastoImport[] } = await req.json();
    if (!Array.isArray(gastos) || gastos.length === 0) {
      return NextResponse.json({ error: "Sin gastos para importar" }, { status: 400 });
    }

    for (const g of gastos) {
      await appendGasto({
        id: uuid(),
        fecha: g.fecha,
        hora: g.hora,
        monto: g.monto,
        comercio: g.comercio,
        categoria: g.categoria,
        cuenta: "Banco de Chile",
        gmailId: g.gmailId,
        creadoPor: "gmail",
        notas: "",
      });

      if (g.categoria) {
        await upsertComercio(g.comercio, g.categoria, g.fecha);
      }
    }

    return NextResponse.json({ imported: gastos.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
