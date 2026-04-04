import { NextRequest, NextResponse } from "next/server";
import { insertAdmissionRequest } from "@/server/admissions/admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";
import { getProgramById } from "@/server/programs/programs-store";

export const runtime = "nodejs";

const SUCCESS_MESSAGE = "Request submitted successfully";

export async function POST(req: NextRequest) {
  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Admission storage is not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const student_name = typeof o.student_name === "string" ? o.student_name : "";
  const parent_name = typeof o.parent_name === "string" ? o.parent_name : "";
  const phone = typeof o.phone === "string" ? o.phone : "";
  const program_id = typeof o.program_id === "string" ? o.program_id : "";

  if (!student_name.trim() || !parent_name.trim() || !phone.trim()) {
    return NextResponse.json(
      { error: "student_name, parent_name, and phone are required" },
      { status: 400 },
    );
  }

  if (!program_id.trim()) {
    return NextResponse.json(
      { error: "program_id is required" },
      { status: 400 },
    );
  }

  const program = await getProgramById(program_id.trim());
  if (!program || !program.is_active) {
    return NextResponse.json(
      { error: "Invalid or inactive program" },
      { status: 400 },
    );
  }

  try {
    await insertAdmissionRequest({
      student_name,
      parent_name,
      phone,
      program_id,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not save admission request" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: SUCCESS_MESSAGE }, { status: 201 });
}
