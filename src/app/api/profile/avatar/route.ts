import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// Handle avatar upload (POST)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid avatar URL" },
        { status: 400 }
      );
    }

    // Get current avatar
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { avatar: true },
    });

    // If an old avatar exists and is hosted on UploadThing, delete it
    if (user?.avatar?.startsWith("https://utfs.io/f/")) {
      const oldFileKey = user.avatar.split("/").pop(); // Extract file key from URL
      if (oldFileKey) {
        try {
          await utapi.deleteFiles(oldFileKey);
          console.log(`Deleted old avatar: ${oldFileKey}`);
        } catch (error) {
          console.error("Error deleting old avatar:", error);
        }
      }
    }

    // Update avatar in DB
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { avatar: url },
      select: { avatar: true },
    });

    return NextResponse.json({ success: true, avatar: updatedUser.avatar });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

// Fetch current avatar (GET)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { avatar: true },
    });

    return NextResponse.json({ avatar: user?.avatar || null });
  } catch (error) {
    console.error("Avatar fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch avatar" },
      { status: 500 }
    );
  }
}
