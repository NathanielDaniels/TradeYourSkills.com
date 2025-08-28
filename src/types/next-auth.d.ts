import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

export {};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string | null;
      provider?: string;
    } & DefaultSession["user"]; // Merge with default (name, email, image)
  }
  interface User extends DefaultUser {
    id: string;
    username?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string | null;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
    provider?: string | null;
  }
}
