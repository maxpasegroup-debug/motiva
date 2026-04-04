import { NextRequest, NextResponse } from "next/server";
import { listAdmissionRequests } from "@/server/admissions/admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";
import { getProgramById } from "@/server/programs/programs-store";
import { requireAdminApi } from "@/server/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json({ admissions: [] });
  }

  try {
    const rows = await listAdmissionRequests();
    const admissions = await Promise.all(
      rows.map(async (r) => {
        const p = await getProgramById(r.program_id);
        return {
          id: r.id,
          studentName: r.student_name,
          parentName: r.parent_name,
          phone: r.phone,
          programId: r.program_id,
          programTitle: p?.title ?? r.program_id,
          status: r.status,
          createdAt:
            r.created_at instanceof Date
              ? r.created_at.toISOString()
              : String(r.created_at),
        };
      }),
    );
    return NextResponse.json({ admissions });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not load admissions" },
      { status: 500 },
    );
  }
}
