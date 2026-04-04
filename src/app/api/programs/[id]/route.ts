import { NextResponse } from "next/server";
import { getProgramById } from "@/server/programs/programs-store";

export const dynamic = "force-dynamic";

/** Public single program (must be active). */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const p = await getProgramById(params.id);
  if (!p || !p.is_active) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    program: {
      id: p.id,
      title: p.title,
      description: p.description,
      image_path: p.image_path,
    },
  });
}
