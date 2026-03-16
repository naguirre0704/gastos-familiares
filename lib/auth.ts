import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { checkRateLimit, resetRateLimit } from "./rateLimit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req) {
        // VULN-07: Rate limiting per IP
        const ip =
          (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
          "unknown";
        const rl = checkRateLimit(`login:${ip}`);
        if (!rl.allowed) {
          throw new Error("Too many login attempts. Try again later.");
        }

        const username = credentials?.username;
        const password = credentials?.password;
        const storedUsername = process.env.APP_USERNAME;
        // VULN-04: Compare against bcrypt hash stored in APP_PASSWORD_HASH.
        // Falls back to plaintext APP_PASSWORD for backwards compatibility during migration.
        const passwordHash = process.env.APP_PASSWORD_HASH;
        const plainPassword = process.env.APP_PASSWORD;

        if (!username || !password || !storedUsername) return null;

        if (username !== storedUsername) return null;

        const passwordOk = passwordHash
          ? await bcrypt.compare(password, passwordHash)
          : password === plainPassword;

        if (!passwordOk) return null;

        // Successful login — clear rate limit counter
        resetRateLimit(`login:${ip}`);

        // VULN-10: Include explicit role claim in user object (persisted to JWT)
        return { id: "1", name: storedUsername, email: storedUsername, role: "admin" };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    // VULN-10: Persist role claim into JWT
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as typeof user & { role: string }).role;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose role and sub to the session object
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
