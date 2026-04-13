import { NextRequest, NextResponse } from "next/server";
import { parseTeacherIdFromRequest } from "@/server/auth/teacher-bearer";
import { findAuthUserById } from "@/server/auth/auth-users-store";
import {
  getBatchStudentIds,
  listBatchesForTeacher,
} from "@/server/batches/batches-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Students enrolled in any batch owned by this teacher (for client roster UI).
 * Replaces the insecure global `/api/users?role=student` for teachers.
 */
export async function GET(req: NextRequest) {
  void req;
  const teacherId = parseTeacherIdFromRequest(req);
  if (!teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  try {
    const batches = await listBatchesForTeacher(teacherId);
    const idSet = new Set<string>();
    for (const b of batches) {
      const ids = await getBatchStudentIds(b.id);
      for (const sid of ids) idSet.add(sid);
    }

    const users: { id: string; name: string; email: string; role: "student" }[] =
      [];
    for (const id of Array.from(idSet)) {
      const u = await findAuthUserById(id);
      if (u?.role === "student") {
        users.push({
          id: u.id,
          name: u.name,
          email: u.email,
          role: "student",
        });
      }
    }

    users.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ users });
  } catch (e) {
    console.error("[GET /api/teacher/directory]", e);
    return NextResponse.json(
      { error: "Could not load directory" },
      { status: 500 },
    );
  }
}
