import { NextRequest, NextResponse } from "next/server";
import { getCiclos, crearCiclo } from "@/lib/storage";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    const ciclos = await getCiclos();
    return NextResponse.json({ ciclos });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { mes, fechaInicio } = await req.json();
    if (!mes || !fechaInicio) {
      return NextResponse.json(
        { error: "mes y fechaInicio son requeridos" },
        { status: 400 }
      );
    }
    await crearCiclo(mes, fechaInicio);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
