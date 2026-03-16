import { NextRequest, NextResponse } from "next/server";
import { getPresupuestos, upsertPresupuesto } from "@/lib/storage";

export async function GET() {
  try {
    const presupuestos = await getPresupuestos();
    return NextResponse.json({ presupuestos });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await upsertPresupuesto(body.mes, body.categoria, body.presupuesto);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
