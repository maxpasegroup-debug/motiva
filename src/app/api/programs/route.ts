import { NextResponse } from "next/server";
import { listActivePrograms } from "@/server/programs/programs-store";

export async function GET() {
  const programs = await listActivePrograms();
  return NextResponse.json({ programs });
}
