import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/server/auth/require-admin";
import {
  hashPin,
  isFourDigitPin,
  normalizeMobile,
} from "@/server/auth/unified-auth";

function intOr(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return fallback;
}

function profileDataForTeacher(teacherId: string, subject: string): Prisma.InputJsonObject {
  return {
    teacherProfileId: teacherId,
    subject,
  };
}

function teacherProfileIdFromUser(user: { profileData: Prisma.JsonValue | null }) {
  if (!user.profileData || typeof user.profileData !== "object" || Array.isArray(user.profileData)) {
    return null;
  }
  const value = user.profileData as Record<string, unknown>;
  return typeof value.teacherProfileId === "string" ? value.teacherProfileId : null;
}

async function listTeacherLoginsByProfileId() {
  const users = await prisma.user.findMany({
    where: { role: "teacher" },
    select: {
      id: true,
      name: true,
      mobile: true,
      isActive: true,
      profileData: true,
    },
  });
  return new Map(
    users
      .map((user) => {
        const teacherProfileId = teacherProfileIdFromUser(user);
        return teacherProfileId ? ([teacherProfileId, user] as const) : null;
      })
      .filter((entry): entry is readonly [string, (typeof users)[number]] => entry !== null),
  );
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const teachers = await prisma.teacher.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  const loginsByProfileId = await listTeacherLoginsByProfileId();
  return NextResponse.json({
    teachers: teachers.map((teacher) => {
      const login = loginsByProfileId.get(teacher.id);
      return {
        ...teacher,
        loginUserId: login?.id ?? null,
        loginMobile: login?.mobile ?? null,
        loginIsActive: login?.isActive ?? false,
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

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
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const subject = typeof o.subject === "string" ? o.subject.trim() : "";
  const mobile = normalizeMobile(typeof o.mobile === "string" ? o.mobile : "");
  const pin = typeof o.pin === "string" ? o.pin : "";
  const bio = typeof o.bio === "string" ? o.bio.trim() : null;
  const photo = typeof o.photo === "string" ? o.photo.trim() : null;
  const displayOrder = intOr(o.displayOrder, 0);
  const isVisible = typeof o.isVisible === "boolean" ? o.isVisible : true;

  if (!name || !subject) {
    return NextResponse.json(
      { error: "name and subject are required" },
      { status: 400 },
    );
  }

  if (!mobile || !isFourDigitPin(pin)) {
    return NextResponse.json(
      { error: "Teacher mobile and 4-digit PIN are required" },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: { mobile, role: "teacher" },
    select: { id: true },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "A teacher login with this mobile already exists" },
      { status: 409 },
    );
  }

  const pinHash = await hashPin(pin);
  const teacher = await prisma.$transaction(async (tx) => {
    const createdTeacher = await tx.teacher.create({
      data: {
        name,
        subject,
        bio: bio || null,
        photo: photo || null,
        displayOrder,
        isVisible,
      },
    });

    await tx.user.create({
      data: {
        name,
        mobile,
        pin: pinHash,
        role: "teacher",
        isActive: true,
        pinResetRequired: false,
        createdBy: auth.payload.userId,
        profileData: profileDataForTeacher(createdTeacher.id, subject),
      },
    });

    return createdTeacher;
  });

  return NextResponse.json({ teacher }, { status: 201 });
}
export const dynamic = "force-dynamic";
