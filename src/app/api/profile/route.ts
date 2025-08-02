import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      bio: true,
      location: true,
      skills: { select: { id: true, name: true }, orderBy: { order: 'asc' } },
    },
  });

  return NextResponse.json(user || {});
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bio, location } = await req.json();

  await prisma.user.update({
    where: { email: session.user.email },
    data: { bio, location },
  });

  return NextResponse.json({ success: true });
}
