import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user by email to get their ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { itemIds } = await req.json();

    if (!Array.isArray(itemIds)) {
      return NextResponse.json({ error: "Invalid item IDs" }, { status: 400 });
    }

    // Fetch current skills for the user
    const skills = await prisma.skill.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    // Update each skill's order in the database
    const updateOperations = itemIds
      .map((skillId: string, index: number) => ({ skillId, index }))
      .filter(({ skillId, index }) => skills[index]?.id !== skillId) // Only changed
      .map(({ skillId, index }) =>
        prisma.skill.update({
          where: { id: skillId, userId: user.id },
          data: { order: index },
        })
      );
        try {
          await prisma.$transaction(updateOperations);
        } catch (err) {
          console.error("Transaction failed while reordering skills:", err);
          return NextResponse.json(
            { error: "Failed to update skill order" },
            { status: 500 }
          );
        }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering skills:", error);
    return NextResponse.json(
      { error: "Failed to reorder skills" },
      { status: 500 }
    );
  }
}
