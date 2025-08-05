import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Skill name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Use transaction to prevent race conditions and ensure data consistency
    const skill = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Get user and verify existence
        const email =
          typeof session.user?.email === "string"
            ? session.user.email
            : undefined;
        if (!email) {
          throw new Error("User not found");
        }

        const user = await tx.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Check for duplicate skill names (optional - removes duplicates)
        const existingSkill = await tx.skill.findFirst({
          where: {
            userId: user.id,
            name: {
              equals: trimmedName,
              mode: "insensitive", // Case-insensitive check
            },
          },
        });

        if (existingSkill) {
          return NextResponse.json(
            { error: "Skill already exists" },
            { status: 409 }
          );
        }

        // Get the highest order number for this user's skills
        const lastSkill = await tx.skill.findFirst({
          where: { userId: user.id },
          orderBy: { order: "desc" },
          select: { order: true },
        });

        // Use larger increments (1000) to allow for future reordering
        const newOrder = (lastSkill?.order || 0) + 1000;

        // Create the new skill
        return await tx.skill.create({
          data: {
            name: trimmedName,
            userId: user.id,
            order: newOrder,
          },
          select: {
            id: true,
            name: true,
            order: true,
          },
        });
      }
    );

    return NextResponse.json(skill);
  } catch (error) {
    console.error("Error creating skill:", error);

    // Handle specific known errors
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (error.message === "You already have this skill") {
        return NextResponse.json(
          { error: "You already have this skill" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Skill ID is required" },
        { status: 400 }
      );
    }

    // Use transaction to ensure user owns the skill being deleted
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get user ID
      const email =
        typeof session.user?.email === "string"
          ? session.user.email
          : undefined;
      if (!email) {
        throw new Error("User not found");
      }

      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Verify skill exists and belongs to user
      const skill = await tx.skill.findFirst({
        where: {
          id: id,
          userId: user.id,
        },
      });

      if (!skill) {
        throw new Error("Skill not found or access denied");
      }

      // Delete the skill
      await tx.skill.delete({
        where: { id: id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting skill:", error);

    if (error instanceof Error) {
      if (error.message === "User not found") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (error.message === "Skill not found or access denied") {
        return NextResponse.json({ error: "Skill not found" }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Failed to delete skill" },
      { status: 500 }
    );
  }
}
