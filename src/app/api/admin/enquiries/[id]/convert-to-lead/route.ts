import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { appendLeadNote } from "@/lib/leads";
import { requireAdminApi } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapProgramToLead(input: string): {
  type: "tuition" | "foundation" | "remedial";
  flowType: "tuition" | "remedial";
  subjects: string;
} {
  if (input === "remedial") {
    return {
      type: "remedial",
      flowType: "remedial",
      subjects: "Free learning gap check / remedial support",
    };
  }

  if (input === "tuition") {
    return {
      type: "tuition",
      flowType: "tuition",
      subjects: "One-to-One Tuition",
    };
  }

  return {
    type: "tuition",
    flowType: "tuition",
    subjects: input.replace(/_/g, " "),
  };
}

function buildLeadNote(input: {
  enquiryId: string;
  programInterest: string;
  message: string | null;
}) {
  return [
    `Converted from enquiry ${input.enquiryId}.`,
    `Program interest: ${input.programInterest}.`,
    input.message?.trim() ? `Learning check details:\n${input.message.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const id = params.id?.trim() ?? "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const enquiry = await tx.enquiry.findUnique({ where: { id } });
      if (!enquiry) return null;

      const leadShape = mapProgramToLead(enquiry.programInterest);
      const noteText = buildLeadNote({
        enquiryId: enquiry.id,
        programInterest: enquiry.programInterest,
        message: enquiry.message,
      });

      const existingLead = await tx.lead.findFirst({
        where: { phone: enquiry.mobile },
        orderBy: { createdAt: "desc" },
      });

      const lead = existingLead
        ? await tx.lead.update({
            where: { id: existingLead.id },
            data: {
              status:
                existingLead.status === "closed_lost" ||
                existingLead.status === "closed"
                  ? "new"
                  : existingLead.status,
              subjects: existingLead.subjects || leadShape.subjects,
              notes: appendLeadNote(existingLead.notes, {
                text: noteText,
                addedBy: auth.payload.name || "Admin",
              }),
            },
          })
        : await tx.lead.create({
            data: {
              name: enquiry.name,
              phone: enquiry.mobile,
              type: leadShape.type,
              flowType: leadShape.flowType,
              subjects: leadShape.subjects,
              status: "new",
              notes: appendLeadNote(null, {
                text: noteText,
                addedBy: auth.payload.name || "Admin",
              }),
            },
          });

      const updatedEnquiry = await tx.enquiry.update({
        where: { id: enquiry.id },
        data: { status: "converted" },
      });

      return { lead, enquiry: updatedEnquiry, reusedExistingLead: Boolean(existingLead) };
    });

    if (!result) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[POST /api/admin/enquiries/[id]/convert-to-lead]", error);
    return NextResponse.json(
      { error: "Could not convert enquiry" },
      { status: 500 },
    );
  }
}
