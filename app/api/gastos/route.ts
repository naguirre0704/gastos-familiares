import { NextRequest, NextResponse } from "next/server";
import {
  getGastos,
  appendGasto,
  patchGasto,
  upsertComercio,
} from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const gastos = await getGastos();
    return NextResponse.json({ gastos });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gasto = {
      id: uuidv4(),
      fecha: body.fecha,
      hora: body.hora,
      monto: body.monto,
      comercio: body.comercio,
      categoria: body.categoria,
      cuenta: body.cuenta || "",
      gmailId: body.gmailId || "",
      creadoPor: body.creadoPor || "",
      notas: body.notas || "",
      comentario: body.comentario || undefined,
      tipo: body.tipo || undefined,
    };
    await appendGasto(gasto);
    if (body.recordarComercio !== false) {
      await upsertComercio(body.comercio, body.categoria, body.fecha);
    }
    return NextResponse.json({ success: true, gasto });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: any = {};
    if (body.categoria !== undefined) fields.categoria = body.categoria;
    if (body.comentario !== undefined) fields.comentario = body.comentario;
    await patchGasto(body.id, fields);
    if (body.recordarComercio !== false && body.comercio && body.categoria) {
      await upsertComercio(body.comercio, body.categoria, body.fecha || "");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
