import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const teachers = await prisma.teacher.findMany({
    where: { isVisible: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      subject: true,
      bio: true,
      photo: true,
      displayOrder: true,
    },
  });
  return NextResponse.json({ teachers });
}
