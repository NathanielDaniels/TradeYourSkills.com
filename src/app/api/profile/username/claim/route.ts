// app/api/profile/username/claim/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9]+$/); // Lowercase, 3-20 chars

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();
    const desiredUsername = String(username ?? "").toLowerCase();
    // Validate username format
    usernameSchema.parse(desiredUsername);

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: desiredUsername },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Update user with the new username
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { username: desiredUsername },
      select: { username: true },
    });

    return NextResponse.json({ username: user.username });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      return NextResponse.json(
        { error: "Invalid username", issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}
