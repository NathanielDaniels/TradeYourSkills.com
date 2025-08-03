import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profileVisible, city, state, country } = await req.json();

  const updatedUser = await prisma.user.update({
    where: { email: session.user.email },
    data: { profileVisible, city, state, country },
    select: { profileVisible: true, city: true, state: true, country: true },
  });

  return NextResponse.json(updatedUser);
}
