import { NextResponse } from "next/server";

const WHATSAPP_CONTACT_NUMBER = process.env.WHATSAPP_CONTACT_NUMBER ?? "919946930723";

export async function POST() {
  return NextResponse.json({
    message: "Please contact your coordinator on WhatsApp",
    whatsappUrl: `https://wa.me/${WHATSAPP_CONTACT_NUMBER}`,
  });
}

export const dynamic = "force-dynamic";
