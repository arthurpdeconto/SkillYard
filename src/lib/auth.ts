import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { Roles } from "@/lib/rbac";
import { loginSchema } from "@/lib/validators";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        console.log("[auth] Attempting credentials signin", rawCredentials?.email);
        const parsed = loginSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          console.log("[auth] invalid payload", parsed.error.format());
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user || !user.password) {
          console.log("[auth] user not found or missing password", email);
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          console.log("[auth] invalid password", email);
          return null;
        }

        console.log("[auth] credentials ok", email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role?.name ?? Roles.USER,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? Roles.USER;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const role = "role" in user ? user.role : undefined;
        token.role = role ?? Roles.USER;
      }

      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export async function auth() {
  return getServerSession(authOptions);
}
