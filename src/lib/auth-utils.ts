import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function getAuthenticatedUser(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user: session.user, error: null };
}

export async function verifySkillOwnership(skillId: string, userId: string) {
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: { userId: true },
  });

  if (!skill) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Skill not found" }, { status: 404 }),
    };
  }

  if (skill.userId !== userId) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { authorized: true, error: null };
}

export async function verifyListingOwnership(
  listingId: string,
  userId: string
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { userId: true },
  });

  if (!listing) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Listing not found" }, { status: 404 }),
    };
  }

  if (listing.userId !== userId) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { authorized: true, error: null };
}

export async function verifyMessageAccess(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { fromUserId: true, toUserId: true },
  });

  if (!message) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Message not found" }, { status: 404 }),
    };
  }

  // User can access message if they're sender OR recipient
  if (message.fromUserId !== userId && message.toUserId !== userId) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { authorized: true, error: null };
}
