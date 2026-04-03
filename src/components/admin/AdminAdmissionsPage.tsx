"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  addAdmissionRequest,
  listAdmissions,
  setAdmissionStatus,
  type AdmissionRequest,
} from "@/lib/admissions-store";
import { addStudentToClass } from "@/lib/class-students-store";
import { listClasses, type ClassRecord } from "@/lib/classes-store";
import { listCourses } from "@/lib/courses-store";
import { getAuthToken } from "@/lib/session";
import { addPaymentEntry } from "@/lib/payments-ledger-store";
import { setStudentPaymentStatus } from "@/lib/student-payments-store";
import { upsertStudentProfile } from "@/lib/student-profiles-store";
import { listTeachers } from "@/lib/teachers-store";
import type { UserRecord } from "@/lib/users-store";
import { upsertUserPublic } from "@/lib/users-store";

function generatePassword() {
  if (Math.random() < 0.5) return "motiva123";
  const n = Math.floor(Math.random() * 1000000);
  return String(n).padStart(6, "0");
}

function emailFromName(raw: string, suffix: string) {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${slug || "user"}${n}${suffix}@motiva.local`;
}

type CreatedCreds = {
  studentId: string;
  studentEmail: string;
  studentPassword: string;
  parentId: string;
  parentEmail: string;
  parentPassword: string;
};

export function AdminAdmissionsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<AdmissionRequest[]>([]);
  const [sName, setSName] = useState("");
  const [pName, setPName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [approveFor, setApproveFor] = useState<AdmissionRequest | null>(null);
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [fee, setFee] = useState("5000");
  const [feePaid, setFeePaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCreds | null>(null);

  const refresh = useCallback(() => {
    setRows(listAdmissions().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  useEffect(() => {
    refresh();
    const ev = () => refresh();
    window.addEventListener("motiva-admissions-updated", ev);
    return () => window.removeEventListener("motiva-admissions-updated", ev);
  }, [refresh]);

  const courses = listCourses();
  const classes = listClasses();
  const teachers = listTeachers();

  const selectedClass: ClassRecord | undefined = classes.find(
    (c) => c.id === classId,
  );

  function telHref(raw: string) {
    const d = raw.replace(/\D/g, "");
    if (!d) return "#";
    return `tel:${d}`;
  }

  async function postUser(body: {
    name: string;
    email: string;
    password: string;
    role: "student" | "parent";
  }): Promise<UserRecord> {
    const token = getAuthToken();
    if (!token) throw new Error("Unauthorized");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(j?.error ?? "Could not create login");
    }
    const json = (await res.json()) as { user: UserRecord };
    upsertUserPublic(json.user);
    return json.user;
  }

  function saveNewRequest(e: FormEvent) {
    e.preventDefault();
    if (!sName.trim() || !pName.trim() || !phone.trim()) {
      setError(t("admin_name_required"));
      return;
    }
    setError(null);
    addAdmissionRequest({
      studentName: sName.trim(),
      parentName: pName.trim(),
      phone: phone.trim(),
      courseInterest: interest.trim() || "—",
    });
    setSName("");
    setPName("");
    setPhone("");
    setInterest("");
    refresh();
  }

  async function finishApprove(e: FormEvent) {
    e.preventDefault();
    if (!approveFor) return;
    if (!courseId || !classId) {
      setError(t("admin_teacher_pick_required"));
      return;
    }

    const course = courses.find((c) => c.id === courseId);
    const batch = classes.find((c) => c.id === classId);
    if (!course || !batch) {
      setError(t("admin_admissions_need_batch"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const stPass = generatePassword();
      const parPass = generatePassword();
      const stEmail = emailFromName(approveFor.studentName, ".s");
      const parEmail = `parent.${approveFor.id.slice(0, 10).replace(/-/g, "")}@motiva.local`;

      const studentUser = await postUser({
        name: approveFor.studentName,
        email: stEmail,
        password: stPass,
        role: "student",
      });

      const parentUser = await postUser({
        name: approveFor.parentName,
        email: parEmail,
        password: parPass,
        role: "parent",
      });

      addStudentToClass(batch.id, studentUser.id);

      upsertStudentProfile({
        studentId: studentUser.id,
        parentName: approveFor.parentName,
        parentPhone: approveFor.phone,
        parentUserId: parentUser.id,
        courseId: course.id,
        courseLabel: course.name,
      });

      const amount = Math.max(0, parseFloat(fee) || 0);
      addPaymentEntry({
        studentId: studentUser.id,
        studentName: studentUser.name,
        courseLabel: course.name,
        amount,
        status: feePaid ? "paid" : "pending",
      });
      setStudentPaymentStatus(studentUser.id, feePaid ? "paid" : "pending");

      setAdmissionStatus(approveFor.id, "approved");
      setCreated({
        studentId: studentUser.id,
        studentEmail: studentUser.email,
        studentPassword: stPass,
        parentId: parentUser.id,
        parentEmail: parentUser.email,
        parentPassword: parPass,
      });
      setApproveFor(null);
      setCourseId("");
      setClassId("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {t("admin_admissions_title")}
        </h1>
        <p className="mt-2 text-lg text-neutral-600">{t("admin_admissions_sub")}</p>
      </div>

      <Card className="border-2 border-primary/20 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-foreground">
          {t("admin_admissions_new_title")}
        </h2>
        <form onSubmit={saveNewRequest} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-left text-sm font-medium text-neutral-700 sm:col-span-2">
            {t("admin_student_name")}
            <input
              value={sName}
              onChange={(e) => setSName(e.target.value)}
              className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
            />
          </label>
          <label className="block text-left text-sm font-medium text-neutral-700">
            {t("admin_parents_child")} ({t("admin_parents_title")})
            <input
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
            />
          </label>
          <label className="block text-left text-sm font-medium text-neutral-700">
            {t("admin_parents_phone")}
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
            />
          </label>
          <label className="block text-left text-sm font-medium text-neutral-700 sm:col-span-2">
            {t("admin_admissions_course_interest")}
            <input
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" className="min-h-14 w-full sm:w-auto sm:min-w-[12rem] text-lg">
              {t("admin_admissions_add")}
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-4 text-xl font-bold text-foreground">
          {t("admin_admissions_list")}
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white py-12 text-center text-neutral-500">
            {t("admin_admissions_empty")}
          </p>
        ) : (
          <ul className="space-y-4">
            {rows.map((r) => (
              <li key={r.id}>
                <Card className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-left">
                      <p className="text-lg font-bold text-foreground">
                        {r.studentName}
                      </p>
                      <p className="text-neutral-600">
                        {r.parentName} · {r.phone}
                      </p>
                      <p className="text-sm text-neutral-500">{r.courseInterest}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        {r.status}
                      </p>
                    </div>
                    {r.status === "pending" ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setApproveFor(r);
                            setCourseId(courses[0]?.id ?? "");
                            setClassId(classes[0]?.id ?? "");
                          }}
                          className="min-h-14 text-lg"
                        >
                          {t("admin_admissions_approve")}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setAdmissionStatus(r.id, "rejected")}
                          className="min-h-14 text-lg"
                        >
                          {t("admin_admissions_reject")}
                        </Button>
                        <a
                          href={telHref(r.phone)}
                          className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-primary bg-white px-6 text-lg font-semibold text-primary"
                        >
                          {t("admin_admissions_call")}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {approveFor ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl sm:p-8">
            <h3 className="text-xl font-bold">{t("admin_admissions_step2")}</h3>
            <p className="mt-2 text-neutral-600">{approveFor.studentName}</p>
            <form onSubmit={finishApprove} className="mt-6 space-y-4">
              <label className="block text-left text-sm font-medium">
                {t("admin_admissions_pick_course")}
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-left text-sm font-medium">
                {t("admin_admissions_pick_batch")}
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
                >
                  {classes.length === 0 ? (
                    <option value="">{t("admin_admissions_need_batch")}</option>
                  ) : (
                    classes.map((c) => {
                      const tn =
                        teachers.find((x) => x.id === c.teacherId)?.name ?? "—";
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} · {tn} · {c.duration}{" "}
                          {t("admin_classes_days_short")}
                        </option>
                      );
                    })
                  )}
                </select>
              </label>
              <label className="block text-left text-sm font-medium">
                {t("admin_admissions_fee")}
                <input
                  type="number"
                  min={0}
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-left font-medium">
                <input
                  type="checkbox"
                  checked={feePaid}
                  onChange={(e) => setFeePaid(e.target.checked)}
                  className="h-6 w-6"
                />
                {t("admin_admissions_fee_paid")}
              </label>
              {selectedClass && selectedClass.teacherId ? (
                <p className="text-sm text-neutral-500">
                  {t("admin_classes_card_teacher")}:{" "}
                  {teachers.find((x) => x.id === selectedClass.teacherId)?.name}
                </p>
              ) : null}
              {error ? (
                <p className="text-sm font-medium text-accent">{error}</p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  disabled={busy || classes.length === 0 || courses.length === 0}
                  className="min-h-14 flex-1 text-lg"
                >
                  {busy ? "…" : t("admin_admissions_step2")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setApproveFor(null);
                    setError(null);
                  }}
                  className="min-h-14 flex-1 text-lg"
                >
                  {t("back")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {created ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6 shadow-2xl sm:p-8">
            <h3 className="text-center text-2xl font-bold text-primary">
              ✅ {t("admin_admissions_created_title")}
            </h3>
            <div className="mt-6 space-y-4 rounded-2xl bg-neutral-50 p-4 text-left text-sm">
              <p className="font-bold text-foreground">{t("admin_nav_students")}</p>
              <p>
                {t("admin_admissions_student_id")}:{" "}
                <span className="font-mono">{created.studentId}</span>
              </p>
              <p>
                Email:{" "}
                <span className="font-mono break-all">{created.studentEmail}</span>
              </p>
              <p>
                {t("admin_admissions_password")}:{" "}
                <span className="font-mono">{created.studentPassword}</span>
              </p>
              <hr className="border-neutral-200" />
              <p className="font-bold text-foreground">{t("admin_nav_parents")}</p>
              <p>
                {t("admin_admissions_parent_id")}:{" "}
                <span className="font-mono">{created.parentId}</span>
              </p>
              <p>
                Email:{" "}
                <span className="font-mono break-all">{created.parentEmail}</span>
              </p>
              <p>
                {t("admin_admissions_password")}:{" "}
                <span className="font-mono">{created.parentPassword}</span>
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setCreated(null)}
              className="mt-6 min-h-14 w-full text-lg"
            >
              OK
            </Button>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
