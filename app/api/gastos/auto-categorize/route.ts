import { NextResponse } from "next/server";
import { autoCategorizeGastos } from "@/lib/storage";

export async function POST() {
  try {
    const count = await autoCategorizeGastos();
    return NextResponse.json({ count });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
