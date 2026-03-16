import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client, saveTokens } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  const errorRedirect = new URL("/configuracion?gmail=error", req.nextUrl.origin);

  if (error || !code || !state) {
    return NextResponse.redirect(errorRedirect);
  }

  // Validate state to prevent OAuth CSRF attacks
  const storedState = req.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(errorRedirect);
  }

  try {
    const auth = getOAuth2Client();
    const { tokens } = await auth.getToken(code);
    await saveTokens(tokens as Record<string, unknown>);

    const res = NextResponse.redirect(
      new URL("/importar?gmail=connected", req.nextUrl.origin)
    );
    // Clear the state cookie
    res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  } catch {
    return NextResponse.redirect(errorRedirect);
  }
}
