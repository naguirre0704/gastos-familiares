import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCategorias, updateCategoria, appendCategoria, renameCategoria, deleteCategoria } from "@/lib/storage";
import { apiError } from "@/lib/api";

const PostSchema = z.object({
  nombre:            z.string().min(1).max(100),
  emoji:             z.string().max(10).default("📦"),
  color:             z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6B7280"),
  presupuestoMensual: z.number().int().nonnegative().default(0),
});

const PatchSchema = z.object({
  nombre:      z.string().min(1).max(100),
  nuevoNombre: z.string().min(1).max(100).optional(),
  presupuesto: z.number().int().nonnegative(),
  emoji:       z.string().max(10).optional(),
});

const DeleteSchema = z.object({
  nombre: z.string().min(1).max(100),
});

export async function GET() {
  try {
    const categorias = await getCategorias();
    return NextResponse.json({ categorias });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = PostSchema.parse(await req.json());
    await appendCategoria(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = PatchSchema.parse(await req.json());
    if (body.nuevoNombre) {
      await renameCategoria(body.nombre, body.nuevoNombre);
    }
    await updateCategoria(body.nuevoNombre ?? body.nombre, body.presupuesto, body.emoji);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = DeleteSchema.parse(await req.json());
    await deleteCategoria(body.nombre);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
