import { NextResponse } from "next/server";
import { getImportaciones } from "@/lib/storage";

export async function GET() {
  try {
    const importaciones = await getImportaciones();
    return NextResponse.json({ importaciones });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
