import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";

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
        session.user.image =
          ((token as any).picture as string) ?? session.user.image ?? null;
        session.user.username =
          ((token as any).username as string | null) ?? null;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // Persist user ID in JWT for future sessions
      if (user?.id) token.sub = user.id;

      if (user) {
        // If your Prisma User has `username` and `image`
        (token as any).username =
          (user as any).username ?? (token as any).username ?? null;
        (token as any).picture =
          (user as any).image ?? (token as any).picture ?? null;
      }

      // If the client calls `signIn("credentials", { redirect: false })` with
      // `trigger: "update"` (or you call `update` via useSession), allow updating token fields
      if (trigger === "update") {
        if (session?.username !== undefined)
          (token as any).username = session.username;
        if (session?.image !== undefined)
          (token as any).picture = session.image;
      }

      if (user && "image" in user) {
        (token as any).picture = (user as any).image ?? (token as any).picture;
      }

      if (trigger === "update" && session?.image) {
        (token as any).picture = session.image as string;
      }

      // Optional: ensure username is present for returning users
      // (e.g., if token was created before username existed)
      if (!(token as any).username && token.sub) {
        try {
          const userRecord = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { username: true, image: true },
          });
          if (userRecord) {
            (token as any).username = userRecord.username ?? null;
            (token as any).picture =
              userRecord.image ?? (token as any).picture ?? null;
          }
        } catch (e) {
          console.warn(
            "[next-auth][jwt] backfill failed:",
            (e as Error)?.message ?? e
          );
          Sentry.captureException(e, { tags: { area: "next-auth-jwt" } });
        }
      }
      return token;
    },
  },
};
