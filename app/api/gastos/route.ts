import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGastos, appendGasto, patchGasto, upsertComercio } from "@/lib/storage";
import { apiError } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

const PostSchema = z.object({
  fecha:           z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  hora:            z.string().max(10),
  monto:           z.number().int().positive(),
  comercio:        z.string().min(1).max(200),
  categoria:       z.string().max(100).default(""),
  cuenta:          z.string().max(100).default(""),
  gmailId:         z.string().max(200).default(""),
  creadoPor:       z.string().max(100).default(""),
  notas:           z.string().max(500).default(""),
  comentario:      z.string().max(500).optional(),
  tipo:            z.enum(["compra", "transferencia"]).optional(),
  recordarComercio: z.boolean().default(true),
});

const PatchSchema = z.object({
  id:              z.string().uuid(),
  categoria:       z.string().max(100).optional(),
  comentario:      z.string().max(500).optional(),
  emoji:           z.string().max(10).optional(),
  comercio:        z.string().min(1).max(200).optional(),
  monto:           z.number().int().positive().optional(),
  recordarComercio: z.boolean().default(true),
  fecha:           z.string().optional(),
});

export async function GET() {
  try {
    const gastos = await getGastos();
    return NextResponse.json({ gastos });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = PostSchema.parse(await req.json());
    const gasto = {
      id: uuidv4(),
      fecha: body.fecha,
      hora: body.hora,
      monto: body.monto,
      comercio: body.comercio,
      categoria: body.categoria,
      cuenta: body.cuenta,
      gmailId: body.gmailId,
      creadoPor: body.creadoPor,
      notas: body.notas,
      comentario: body.comentario,
      tipo: body.tipo,
    };
    await appendGasto(gasto);
    if (body.recordarComercio && body.categoria) {
      await upsertComercio(body.comercio, body.categoria, body.fecha);
    }
    return NextResponse.json({ success: true, gasto });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = PatchSchema.parse(await req.json());
    const fields: Record<string, unknown> = {};
    if (body.categoria  !== undefined) fields.categoria  = body.categoria;
    if (body.comentario !== undefined) fields.comentario = body.comentario;
    if (body.emoji      !== undefined) fields.emoji      = body.emoji;
    if (body.comercio   !== undefined) fields.comercio   = body.comercio;
    if (body.monto      !== undefined) fields.monto      = body.monto;
    await patchGasto(body.id, fields);
    if (body.recordarComercio && body.comercio && body.categoria) {
      await upsertComercio(body.comercio, body.categoria, body.fecha ?? "");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
