import { NextResponse } from "next/server";
import { listActivePrograms } from "@/server/programs/programs-store";

/** Public list: only `is_active` programs; each has id, title, description, image_path. */
export const dynamic = "force-dynamic";

export async function GET() {
  const programs = await listActivePrograms();
  return NextResponse.json({ programs });
}
