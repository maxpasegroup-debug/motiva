import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  programInterest: z.enum([
    "tuition",
    "remedial",
    "recorded_courses",
    "career_counseling",
    "other",
  ]),
  message: z.string().max(1000).optional(),
});

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

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, mobile, programInterest, message } = parsed.data;

  const enquiry = await prisma.enquiry.create({
    data: {
      name,
      mobile,
      programInterest,
      message: message?.trim() || null,
      status: "new",
    },
  });

  return NextResponse.json({ success: true, enquiryId: enquiry.id }, { status: 201 });
}
export const dynamic = "force-dynamic";
