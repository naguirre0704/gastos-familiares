import { NextRequest, NextResponse } from "next/server";
import { getCategorias, updateCategoria, appendCategoria } from "@/lib/storage";

export async function GET() {
  try {
    const categorias = await getCategorias();
    return NextResponse.json({ categorias });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await appendCategoria({
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
  try {
    const body = await req.json();
    await updateCategoria(body.nombre, body.presupuesto);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
