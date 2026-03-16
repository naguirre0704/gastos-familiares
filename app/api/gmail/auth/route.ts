import { NextResponse } from "next/server";
import { getAuthUrl, generateOAuthState } from "@/lib/gmail";

export async function GET() {
  const state = generateOAuthState();
  const url = getAuthUrl(state);

  const res = NextResponse.redirect(url);
  // Store state in httpOnly cookie to validate in callback (CSRF protection)
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });
  return res;
}
