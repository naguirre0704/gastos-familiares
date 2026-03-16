import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Returns a safe error message — internal details only in development */
export function apiError(error: unknown, status = 500): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Datos inválidos", details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error instanceof Error
      ? error.message
      : String(error);
  return NextResponse.json({ error: message }, { status });
}
