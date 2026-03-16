import { NextRequest, NextResponse } from "next/server";
import { appendGasto, upsertComercio, appendImportacion } from "@/lib/storage";
import { v4 as uuid } from "uuid";

interface GastoImport {
  gmailId: string;
  fecha: string;
  hora: string;
  monto: number;
  comercio: string;
  categoria: string;
  comentario?: string;
  tipo?: "compra" | "transferencia";
}

export async function POST(req: NextRequest) {
  try {
    const { gastos, desdeDate }: { gastos: GastoImport[]; desdeDate?: string } = await req.json();
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
        comentario: g.comentario || undefined,
        tipo: g.tipo || undefined,
      });

      if (g.categoria) {
        await upsertComercio(g.comercio, g.categoria, g.fecha);
      }
    }

    await appendImportacion({
      id: uuid(),
      timestamp: new Date().toISOString(),
      cantidad: gastos.length,
      desdeDate: desdeDate ?? "2025/12/31",
    });

    return NextResponse.json({ imported: gastos.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
