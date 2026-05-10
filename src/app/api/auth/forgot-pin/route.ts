import { NextRequest, NextResponse } from "next/server";
import { authLimiter, rateLimitRequest } from "@/lib/ratelimit";

const WHATSAPP_CONTACT_NUMBER = process.env.WHATSAPP_CONTACT_NUMBER ?? "919946930723";

export async function POST(req: NextRequest) {
  const limited = await rateLimitRequest(req, authLimiter, "forgot-pin");
  if (limited) return limited;

  return NextResponse.json({
    message: "Please contact your coordinator on WhatsApp",
    whatsappUrl: `https://wa.me/${WHATSAPP_CONTACT_NUMBER}`,
  });
}

export const dynamic = "force-dynamic";
