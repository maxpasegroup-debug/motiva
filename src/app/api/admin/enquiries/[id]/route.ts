import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const statusSchema = z.object({
  status: z.enum(["new", "contacted", "converted", "closed_lost"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const id = params.id?.trim() ?? "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ success: true, enquiry });
  } catch (error) {
    console.error("[PATCH /api/admin/enquiries/[id]]", error);
    return NextResponse.json(
      { error: "Could not update enquiry" },
      { status: 500 },
    );
  }
}
