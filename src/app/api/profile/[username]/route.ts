import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      bio: true,
      location: true,
      avatar: true,
      skills: { select: { id: true, name: true }, orderBy: { order: "asc" } },
    },
  });

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}
