import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, verifyMessageAccess } from "@/lib/auth-utils";
import { generalApiLimit, getClientIP } from "@/lib/ratelimit";

// GET /api/messages/[id] - View message
export async function GET(
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

    const { authorized, error: accessError } = await verifyMessageAccess(
      params.id,
      user!.id
    );
    if (accessError) return accessError;

    const message = await prisma.message.findUnique({
      where: { id: params.id },
      include: {
        fromUser: { select: { id: true, name: true, username: true } },
        toUser: { select: { id: true, name: true, username: true } },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Get message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete message (only sender can delete)
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

    // For deletion, only the sender should be able to delete
    const message = await prisma.message.findUnique({
      where: { id: params.id },
      select: { fromUserId: true },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.fromUserId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.message.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
