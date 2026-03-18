import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth env vars: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required");
}
if (!process.env.ALLOWED_GOOGLE_EMAIL) {
  throw new Error("Missing ALLOWED_GOOGLE_EMAIL env var");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async signIn({ user }) {
      const allowedEmail = process.env.ALLOWED_GOOGLE_EMAIL!;
      return user.email?.toLowerCase() === allowedEmail.toLowerCase();
    },
    async jwt({ token }) {
      if (token.email?.toLowerCase() === process.env.ALLOWED_GOOGLE_EMAIL!.toLowerCase()) {
        token.role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { role: string; id: string }).role =
          token.role as string;
        (session.user as typeof session.user & { id: string }).id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
