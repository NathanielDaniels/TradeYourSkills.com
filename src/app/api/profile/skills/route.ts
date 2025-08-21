import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, verifySkillOwnership } from "@/lib/auth-utils";
import { generalApiLimit, getClientIP } from "@/lib/ratelimit";
import { sanitizeText } from "@/lib/sanitize";
import { skillCreateSchema, skillDeleteSchema } from "@/lib/validators";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import type { Session } from "next-auth";

export async function POST(request: Request) {
  const clientIP = getClientIP(request);
  let user: Session["user"] | null = null;

  try {
    const { success } = await generalApiLimit.limit(clientIP);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user: authenticatedUser, error: authError } =
      await getAuthenticatedUser(request);
    if (authError) return authError;

    user = authenticatedUser;

    if (!user.id) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Input validation and sanitization
    const body = await request.json();

    const sanitizedInput = {
      name: body.name ? sanitizeText(body.name, 50) : body.name,
      description: body.description
        ? sanitizeText(body.description, 200)
        : body.description,
      category: body.category ? sanitizeText(body.category, 30) : body.category,
      experience: body.experience,
    };

    const validatedData = skillCreateSchema.parse(sanitizedInput);

    const skill = await prisma.$transaction(async (tx) => {
        if (!user?.id) {
          throw new Error("User authentication lost");
        }
      const existingSkill = await tx.skill.findFirst({
        where: {
          userId: user.id,
          name: {
            equals: validatedData.name,
            mode: "insensitive",
          },
        },
      });

      if (existingSkill) {
        throw new Error("You already have this skill");
      }

      // Get the highest order number for this user's skills
      const lastSkill = await tx.skill.findFirst({
        where: { userId: user.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      // Use larger increments (1000) to allow for future reordering
      const newOrder = (lastSkill?.order || 0) + 1000;

      return tx.skill.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          category: validatedData.category,
          experience: validatedData.experience,
          userId: user.id,
          order: newOrder,
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          experience: true,
          order: true,
        },
      });
    });
    console.log(`Skill created: ${user.id} - ${validatedData.name}`);
    Sentry.addBreadcrumb({
      message: "Skill created",
      category: "skill",
      level: "info",
      data: { userId: user.id, skillName: validatedData.name },
    });
    return NextResponse.json(skill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return NextResponse.json(
        { error: "Invalid input data", details: issues },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "You already have this skill"
    ) {
      return NextResponse.json(
        { error: "You already have this skill" },
        { status: 409 }
      );
    }
    console.error("Skill creation error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "skill-creation",
        ip: clientIP,
        userId: user?.id,
      },
    });
    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const clientIP = getClientIP(request);
  let user: Session["user"] | null = null;
  try {
    const { success } = await generalApiLimit.limit(clientIP);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Authentication
    const { user: authenticatedUser, error: authError } =
      await getAuthenticatedUser(request);
    if (authError) return authError;

    user = authenticatedUser;

    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Input validation
    const body = await request.json();
    const { id } = skillDeleteSchema.parse(body);

    // Verify ownership and delete
    const { error: ownershipError } = await verifySkillOwnership(id, user.id);
    if (ownershipError) return ownershipError;

    await prisma.skill.delete({
      where: { id },
    });

    console.log(`Skill deleted: ${user.id} - ${id}`);
    Sentry.addBreadcrumb({
      message: "Skill deleted",
      category: "skill",
      level: "info",
      data: { userId: user.id, skillId: id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      );
    }
    Sentry.captureException(error, {
      tags: {
        area: "skill-deletion",
        ip: clientIP,
        userId: user?.id,
      },
    });
    return NextResponse.json(
      { error: "Failed to delete skill" },
      { status: 500 }
    );
  }
}
