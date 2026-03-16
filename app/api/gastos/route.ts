import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getGastos,
  appendGasto,
  updateGastoCategoria,
  upsertComercio,
} from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const gastos = await getGastos();
    return NextResponse.json({ gastos });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
      creadoPor: session.user?.name || "",
      notas: body.notas || "",
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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    await updateGastoCategoria(body.id, body.categoria);
    if (body.recordarComercio !== false && body.comercio) {
      await upsertComercio(body.comercio, body.categoria, body.fecha || "");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
