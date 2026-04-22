import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const mobile = typeof o.mobile === "string" ? o.mobile.trim() : "";
  const programInterest =
    typeof o.programInterest === "string" ? o.programInterest.trim() : "";
  const message = typeof o.message === "string" ? o.message.trim() : "";

  if (!name || !mobile || !programInterest) {
    return NextResponse.json(
      { error: "name, mobile, and programInterest are required" },
      { status: 400 },
    );
  }

  const enquiry = await prisma.enquiry.create({
    data: {
      name,
      mobile,
      programInterest,
      message: message || null,
      status: "new",
    },
  });

  return NextResponse.json({ success: true, enquiryId: enquiry.id }, { status: 201 });
}
