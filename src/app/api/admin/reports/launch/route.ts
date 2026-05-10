import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysAgo(days: number) {
  const date = startOfToday();
  date.setDate(date.getDate() - days);
  return date;
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  try {
    const [
      totalEnquiries,
      newEnquiries,
      contactedEnquiries,
      convertedEnquiries,
      recentEnquiries,
      totalLeads,
      newLeads,
      contactedLeads,
      admissionLeads,
      paymentPendingLeads,
      paymentConfirmedLeads,
      closedLostLeads,
      atRiskLeads,
      totalStudents,
      totalParents,
      activeLearningPlans,
      recentlyUpdatedPlans,
      totalAttendance,
      presentAttendance,
      paidAmount,
      pendingPayments,
      paidPayments,
    ] = await Promise.all([
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: "new" } }),
      prisma.enquiry.count({ where: { status: "contacted" } }),
      prisma.enquiry.count({ where: { status: "converted" } }),
      prisma.enquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "new" } }),
      prisma.lead.count({ where: { status: "contacted" } }),
      prisma.lead.count({
        where: {
          status: {
            in: [
              "admission",
              "payment_pending",
              "payment_confirmed",
              "mentor_assigned",
              "closed_won",
            ],
          },
        },
      }),
      prisma.lead.count({ where: { status: "payment_pending" } }),
      prisma.lead.count({ where: { status: "payment_confirmed" } }),
      prisma.lead.count({ where: { status: { in: ["closed_lost", "closed"] } } }),
      prisma.lead.findMany({
        where: {
          status: {
            in: ["new", "contacted", "demo_scheduled", "demo_done", "counseling"],
          },
          createdAt: {
            lte: sevenDaysAgo,
          },
        },
        orderBy: { createdAt: "asc" },
        take: 8,
      }),
      prisma.studentAccount.count(),
      prisma.parentAccount.count(),
      prisma.learningPlan.count({ where: { status: "active" } }),
      prisma.learningPlan.count({ where: { updatedAt: { gte: sevenDaysAgo } } }),
      prisma.attendance.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.attendance.count({
        where: { createdAt: { gte: sevenDaysAgo }, status: "present" },
      }),
      prisma.paymentTransaction.aggregate({
        where: { status: "paid" },
        _sum: { amountCents: true },
      }),
      prisma.paymentTransaction.count({ where: { status: "pending" } }),
      prisma.paymentTransaction.count({ where: { status: "paid" } }),
    ]);

    const recentThirtyDayEnquiries = await prisma.enquiry.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    const recentThirtyDayConverted = await prisma.enquiry.count({
      where: { status: "converted", createdAt: { gte: thirtyDaysAgo } },
    });

    const learningPlanCoverage = percentage(activeLearningPlans, totalStudents);
    const attendancePercentage = percentage(presentAttendance, totalAttendance);
    const enquiryConversionRate = percentage(convertedEnquiries, totalEnquiries);
    const recentConversionRate = percentage(
      recentThirtyDayConverted,
      recentThirtyDayEnquiries,
    );

    const launchScore = Math.round(
      (Math.min(enquiryConversionRate, 40) / 40) * 25 +
        (Math.min(learningPlanCoverage, 80) / 80) * 25 +
        (Math.min(attendancePercentage, 85) / 85) * 25 +
        (paymentConfirmedLeads > 0 ? 15 : 0) +
        (newEnquiries === 0 ? 10 : 5),
    );

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      metrics: {
        launchScore,
        enquiries: {
          total: totalEnquiries,
          new: newEnquiries,
          contacted: contactedEnquiries,
          converted: convertedEnquiries,
          conversionRate: enquiryConversionRate,
          recent30DayTotal: recentThirtyDayEnquiries,
          recent30DayConversionRate: recentConversionRate,
        },
        leads: {
          total: totalLeads,
          new: newLeads,
          contacted: contactedLeads,
          admission: admissionLeads,
          paymentPending: paymentPendingLeads,
          paymentConfirmed: paymentConfirmedLeads,
          closedLost: closedLostLeads,
          atRisk: atRiskLeads.length,
        },
        delivery: {
          students: totalStudents,
          parents: totalParents,
          activeLearningPlans,
          recentlyUpdatedPlans,
          learningPlanCoverage,
          attendanceMarked7Days: totalAttendance,
          attendancePercentage7Days: attendancePercentage,
        },
        money: {
          paidAmount: (paidAmount._sum.amountCents ?? 0) / 100,
          paidPayments,
          pendingPayments,
        },
      },
      recentEnquiries: recentEnquiries.map((enquiry) => ({
        id: enquiry.id,
        name: enquiry.name,
        mobile: enquiry.mobile,
        status: enquiry.status,
        programInterest: enquiry.programInterest,
        createdAt: enquiry.createdAt.toISOString(),
      })),
      atRiskLeads: atRiskLeads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        status: lead.status,
        flowType: lead.flowType,
        createdAt: lead.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/reports/launch]", error);
    return NextResponse.json(
      { error: "Could not load launch report" },
      { status: 500 },
    );
  }
}
