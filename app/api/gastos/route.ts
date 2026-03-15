import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getOrCreateSheet,
  getGastos,
  appendGasto,
  updateGastoCategoria,
  upsertComercio,
} from "@/lib/sheets";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sheetId = await getOrCreateSheet(session.accessToken);
    const gastos = await getGastos(session.accessToken, sheetId);
    return NextResponse.json({ gastos, sheetId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const sheetId = await getOrCreateSheet(session.accessToken);
    const gasto = {
      id: uuidv4(),
      fecha: body.fecha,
      hora: body.hora,
      monto: body.monto,
      comercio: body.comercio,
      categoria: body.categoria,
      cuenta: body.cuenta || "",
      gmailId: body.gmailId || "",
      creadoPor: session.user?.email || "",
      notas: body.notas || "",
    };
    await appendGasto(session.accessToken, sheetId, gasto);
    if (body.recordarComercio !== false) {
      await upsertComercio(session.accessToken, sheetId, body.comercio, body.categoria, body.fecha);
    }
    return NextResponse.json({ success: true, gasto });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const sheetId = await getOrCreateSheet(session.accessToken);
    await updateGastoCategoria(session.accessToken, sheetId, body.id, body.categoria);
    if (body.recordarComercio !== false && body.comercio) {
      await upsertComercio(session.accessToken, sheetId, body.comercio, body.categoria, body.fecha || "");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
