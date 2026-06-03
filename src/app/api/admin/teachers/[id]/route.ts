import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/server/auth/require-admin";
import {
  hashPin,
  isFourDigitPin,
  normalizeMobile,
} from "@/server/auth/unified-auth";

type Ctx = { params: { id: string } };

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

async function getTeacherLogin(teacherProfileId: string) {
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
  return (
    users.find((user) => teacherProfileIdFromUser(user) === teacherProfileId) ??
    null
  );
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const teacher = await prisma.teacher.findUnique({ where: { id: params.id } });
  if (!teacher) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const login = await getTeacherLogin(teacher.id);
  return NextResponse.json({
    teacher: {
      ...teacher,
      loginUserId: login?.id ?? null,
      loginMobile: login?.mobile ?? null,
      loginIsActive: login?.isActive ?? false,
    },
  });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const existing = await prisma.teacher.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const name = typeof o.name === "string" ? o.name.trim() : existing.name;
  const subject =
    typeof o.subject === "string" ? o.subject.trim() : existing.subject;
  const mobile = normalizeMobile(typeof o.mobile === "string" ? o.mobile : "");
  const pin = typeof o.pin === "string" ? o.pin : "";
  const bio = typeof o.bio === "string" ? o.bio.trim() : existing.bio;
  const photo = typeof o.photo === "string" ? o.photo.trim() : existing.photo;
  const displayOrder =
    o.displayOrder !== undefined
      ? intOr(o.displayOrder, existing.displayOrder)
      : existing.displayOrder;
  const isVisible =
    typeof o.isVisible === "boolean" ? o.isVisible : existing.isVisible;

  if (!name || !subject) {
    return NextResponse.json(
      { error: "name and subject are required" },
      { status: 400 },
    );
  }

  const login = await getTeacherLogin(existing.id);
  if (!login && (mobile || pin) && (!mobile || !isFourDigitPin(pin))) {
    return NextResponse.json(
      { error: "Teacher mobile and 4-digit PIN are required to create login" },
      { status: 400 },
    );
  }

  if (!login && mobile) {
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
  }

  const teacher = await prisma.$transaction(async (tx) => {
    const updatedTeacher = await tx.teacher.update({
      where: { id: params.id },
      data: {
        name,
        subject,
        bio: bio || null,
        photo: photo || null,
        displayOrder,
        isVisible,
      },
    });

    if (login) {
      await tx.user.update({
        where: { id: login.id },
        data: {
          name,
          profileData: profileDataForTeacher(updatedTeacher.id, subject),
        },
      });
    } else if (mobile) {
      await tx.user.create({
        data: {
          name,
          mobile,
          pin: await hashPin(pin),
          role: "teacher",
          isActive: true,
          pinResetRequired: false,
          createdBy: auth.payload.userId,
          profileData: profileDataForTeacher(updatedTeacher.id, subject),
        },
      });
    }

    return updatedTeacher;
  });

  return NextResponse.json({ teacher });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const existing = await prisma.teacher.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const login = await getTeacherLogin(existing.id);
  await prisma.$transaction(async (tx) => {
    if (login) {
      await tx.user.update({
        where: { id: login.id },
        data: { isActive: false },
      });
    }
    await tx.teacher.delete({ where: { id: params.id } });
  });
  return NextResponse.json({ ok: true });
}
export const dynamic = "force-dynamic";
