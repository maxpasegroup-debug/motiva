import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MOBILE_RE = /^\d{10}$/;

function normalizeMobile(input: string): string {
  return input.replace(/\D/g, "");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const mobile = normalizeMobile(typeof o.mobile === "string" ? o.mobile : "");
  if (!MOBILE_RE.test(mobile)) {
    return NextResponse.json({ error: "Invalid mobile" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { mobile },
    select: { id: true, mobile: true },
  });
  if (!user) {
    return NextResponse.json(
      { message: "Reset request submitted. Please contact your coordinator." },
      { status: 200 },
    );
  }

  await prisma.pinResetRequest.create({
    data: {
      userId: user.id,
      mobile: user.mobile ?? mobile,
      status: "pending",
    },
  });

  return NextResponse.json(
    { message: "Reset request submitted. Please contact your coordinator." },
    { status: 200 },
  );
}
