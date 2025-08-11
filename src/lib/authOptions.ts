import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      // Ensure user ID is added to session
      // if (session.user && token.sub) {
      //   session.user.id = token.sub;
      // }

      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        // propagate token picture to session user.image
        // @ts-expect-error: user.image may be readonly in types
        session.user.image =
          ((token as any).picture as string) ?? session.user.image ?? null;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // Persist user ID in JWT for future sessions
      if (user?.id) token.sub = user.id;

      if (user && "image" in user) {
        (token as any).picture = (user as any).image ?? (token as any).picture;
      }

      if (trigger === "update" && session?.image) {
        (token as any).picture = session.image as string;
      }
      return token;
    },
  },
};
