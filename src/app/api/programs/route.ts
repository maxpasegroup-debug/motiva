import { NextRequest, NextResponse } from "next/server";
import type { CourseAudienceRole } from "@/lib/recorded-courses";
import { listActivePrograms } from "@/server/programs/programs-store";

/** Public list: only `is_active` programs; each has id, title, description, image_path. */
export const dynamic = "force-dynamic";

function parseAudience(value: string | null): CourseAudienceRole | "all" {
  if (
    value === "student" ||
    value === "parent" ||
    value === "teacher" ||
    value === "mentor" ||
    value === "public"
  ) {
    return value;
  }
  if (value === "all") return "all";
  return "public";
}

export async function GET(req: NextRequest) {
  const programs = await listActivePrograms(
    parseAudience(req.nextUrl.searchParams.get("audience")),
  );
  return NextResponse.json({ programs });
}
