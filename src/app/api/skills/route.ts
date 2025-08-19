import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, verifySkillOwnership } from "@/lib/auth-utils";
import { generalApiLimit, getClientIP } from "@/lib/ratelimit";

// GET /api/skills/[id] - View skill (only owner can see private details)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clientIP = getClientIP(request);
  
  try {
    // Rate limiting
    const { success } = await generalApiLimit.limit(clientIP);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const { authorized, error: ownershipError } = await verifySkillOwnership(
      params.id,
      user!.id
    );
    if (ownershipError) return ownershipError;

    // User owns this skill - return full details
    const skill = await prisma.skill.findUnique({
      where: { id: params.id },
      include: { listings: true },
    });

    return NextResponse.json(skill);
  } catch (error) {
    console.error("Get skill error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/skills/[id] - Update skill
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clientIP = getClientIP(request);
  
  try {
    const { success } = await generalApiLimit.limit(clientIP);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const { authorized, error: ownershipError } = await verifySkillOwnership(
      params.id,
      user!.id
    );
    if (ownershipError) return ownershipError;

    const { name, description, category, experience } = await request.json();

    const updatedSkill = await prisma.skill.update({
      where: { id: params.id },
      data: { name, description, category, experience },
    });

    return NextResponse.json(updatedSkill);
  } catch (error) {
    console.error("Update skill error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/skills/[id] - Delete skill
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clientIP = getClientIP(request);
  
  try {
    const { success } = await generalApiLimit.limit(clientIP);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const { authorized, error: ownershipError } = await verifySkillOwnership(
      params.id,
      user!.id
    );
    if (ownershipError) return ownershipError;

    await prisma.skill.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete skill error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}