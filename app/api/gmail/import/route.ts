import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendGasto, upsertComercio, appendImportacion } from "@/lib/storage";
import { apiError } from "@/lib/api";
import { v4 as uuid } from "uuid";

const GastoImportSchema = z.object({
  gmailId:    z.string().min(1).max(200),
  fecha:      z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  hora:       z.string().max(10),
  monto:      z.number().int().positive(),
  comercio:   z.string().min(1).max(200),
  categoria:  z.string().max(100).default(""),
  comentario: z.string().max(500).optional(),
  tipo:       z.enum(["compra", "transferencia"]).optional(),
});

const BodySchema = z.object({
  gastos:    z.array(GastoImportSchema).min(1).max(500), // VULN-17: max 500 items
  desdeDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { gastos, desdeDate } = BodySchema.parse(await req.json());

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
    return apiError(error);
  }
}
