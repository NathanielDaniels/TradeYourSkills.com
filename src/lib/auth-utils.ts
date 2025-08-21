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

// Add this function to your existing auth-utils.ts
export async function verifySwapRequestAccess(swapRequestId: string, userId: string) {
  const swapRequest = await prisma.swapRequest.findUnique({
    where: { id: swapRequestId },
    select: { 
      requesterId: true, 
      recipientId: true,
      status: true 
    },
  });

  if (!swapRequest) {
    return { 
      authorized: false, 
      error: NextResponse.json({ error: "Swap request not found" }, { status: 404 }) 
    };
  }

  // User must be either requester or recipient
  if (swapRequest.requesterId !== userId && swapRequest.recipientId !== userId) {
    return { 
      authorized: false, 
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) 
    };
  }

  return { 
    authorized: true, 
    error: null,
    swapRequest 
  };
}

export async function verifySwapRequestResponse(swapRequestId: string, userId: string) {
  const swapRequest = await prisma.swapRequest.findUnique({
    where: { id: swapRequestId },
    select: { 
      recipientId: true,
      status: true 
    },
  });

  if (!swapRequest) {
    return { 
      authorized: false, 
      error: NextResponse.json({ error: "Swap request not found" }, { status: 404 }) 
    };
  }

  if (swapRequest.recipientId !== userId) {
    return { 
      authorized: false, 
      error: NextResponse.json({ error: "Only the recipient can respond to this request" }, { status: 403 }) 
    };
  }

  if (swapRequest.status !== "pending") {
    return { 
      authorized: false, 
      error: NextResponse.json({ error: "This request has already been responded to" }, { status: 409 }) 
    };
  }

  return { authorized: true, error: null };
}