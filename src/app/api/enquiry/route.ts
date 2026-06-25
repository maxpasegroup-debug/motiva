import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ACADEMY_OFFERINGS, getOfferingLabel } from "@/lib/academy-offerings";
import { publicLimiter, rateLimitRequest } from "@/lib/ratelimit";

const LEGACY_PROGRAM_INTERESTS = [
  "tuition",
  "remedial",
  "recorded_courses",
  "career_counseling",
  "other",
] as const;

const PROGRAM_INTERESTS = [
  ...LEGACY_PROGRAM_INTERESTS,
  ...ACADEMY_OFFERINGS.map((item) => item.key),
] as [string, ...string[]];

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  programInterest: z.enum(PROGRAM_INTERESTS),
  childName: z.string().trim().max(100).optional(),
  childClass: z.string().trim().max(50).optional(),
  subjectConcern: z.string().trim().max(160).optional(),
  callbackSlot: z.string().trim().max(80).optional(),
  contactPreference: z.enum(["call", "whatsapp", "either"]).optional(),
  message: z.string().max(1000).optional(),
});

function buildStructuredMessage(input: z.infer<typeof enquirySchema>) {
  const lines = [
    `Selected program: ${getOfferingLabel(input.programInterest)}`,
    input.childName ? `Child: ${input.childName}` : null,
    input.childClass ? `Class: ${input.childClass}` : null,
    input.subjectConcern ? `Concern: ${input.subjectConcern}` : null,
    input.callbackSlot ? `Callback slot: ${input.callbackSlot}` : null,
    input.contactPreference
      ? `Contact preference: ${input.contactPreference}`
      : null,
    input.message?.trim() ? `Note: ${input.message.trim()}` : null,
  ].filter(Boolean);

  return lines.length > 0 ? lines.join("\n") : null;
}

export async function POST(req: NextRequest) {
  const limited = await rateLimitRequest(req, publicLimiter, "enquiry");
  if (limited) return limited;

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

  const { name, mobile, programInterest } = parsed.data;
  const message = buildStructuredMessage(parsed.data);

  const enquiry = await prisma.enquiry.create({
    data: {
      name,
      mobile,
      programInterest,
      message,
      status: "new",
    },
  });

  return NextResponse.json({ success: true, enquiryId: enquiry.id }, { status: 201 });
}
export const dynamic = "force-dynamic";
