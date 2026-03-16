import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateSheet, getCategorias, updateCategoria, appendCategoria } from "@/lib/sheets";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sheetId = await getOrCreateSheet(session.accessToken);
    const categorias = await getCategorias(session.accessToken, sheetId);
    return NextResponse.json({ categorias });
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
    await appendCategoria(session.accessToken, sheetId, {
      nombre: body.nombre,
      emoji: body.emoji || "📦",
      color: body.color || "#6B7280",
      presupuestoMensual: body.presupuestoMensual || 0,
    });
    return NextResponse.json({ success: true });
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
    await updateCategoria(session.accessToken, sheetId, body.nombre, body.presupuesto);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
