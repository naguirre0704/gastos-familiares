import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client, saveTokens } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/configuracion?gmail=error", req.nextUrl.origin)
    );
  }

  try {
    const auth = getOAuth2Client();
    const { tokens } = await auth.getToken(code);
    await saveTokens(tokens as Record<string, unknown>);
    return NextResponse.redirect(
      new URL("/importar?gmail=connected", req.nextUrl.origin)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/configuracion?gmail=error", req.nextUrl.origin)
    );
  }
}
