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
  type AdmissionStatus,
} from "@/lib/admissions-store";
import { getAuthToken } from "@/lib/session";
import { listTeachers } from "@/lib/teachers-store";
import { addPaymentEntry } from "@/lib/payments-ledger-store";
import { setStudentPaymentStatus } from "@/lib/student-payments-store";
import { upsertStudentProfile } from "@/lib/student-profiles-store";
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

async function syncParentPortalRegister(input: {
  token: string;
  parentId: string;
  studentId: string;
  name: string;
  phone: string;
  notifyEnrolled: boolean;
}) {
  try {
    const res = await fetch("/api/admin/parents/register", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parentId: input.parentId,
        studentId: input.studentId,
        name: input.name,
        phone: input.phone,
        notifyEnrolled: input.notifyEnrolled,
      }),
    });
    if (!res.ok) {
      console.warn("[parent portal register]", await res.text());
    }
  } catch (e) {
    console.warn("[parent portal register]", e);
  }
}

async function syncStudentPaymentToServer(
  token: string,
  studentId: string,
  status: "paid" | "pending",
) {
  try {
    const res = await fetch(
      `/api/admin/students/${encodeURIComponent(studentId)}/payment-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    );
    if (!res.ok) {
      console.warn("[payment status sync]", await res.text());
    }
  } catch (e) {
    console.warn("[payment status sync]", e);
  }
}

type CreatedCreds = {
  studentId: string;
  studentEmail: string;
  studentPassword: string;
  parentId: string;
  parentEmail: string;
  parentPassword: string;
};

type DbAdmissionApi = {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  programId: string;
  programTitle: string;
  status: string;
  createdAt: string;
};

type AdmissionListRow = AdmissionRequest & { source: "local" | "db" };

export function AdminAdmissionsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<AdmissionListRow[]>([]);
  const [sName, setSName] = useState("");
  const [pName, setPName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [approveFor, setApproveFor] = useState<AdmissionListRow | null>(null);
  const [batchId, setBatchId] = useState("");
  const [adminBatches, setAdminBatches] = useState<
    {
      id: string;
      name: string;
      course_id: string;
      course_title: string;
      teacher_id: string;
      duration: number;
    }[]
  >([]);
  const [fee, setFee] = useState("5000");
  const [feePaid, setFeePaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCreds | null>(null);

  const refreshAll = useCallback(async () => {
    const token = getAuthToken();
    const local: AdmissionListRow[] = listAdmissions().map((a) => ({
      ...a,
      source: "local",
    }));
    let dbRows: AdmissionListRow[] = [];
    if (token) {
      try {
        const res = await fetch("/api/admin/admissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = (await res.json()) as { admissions?: DbAdmissionApi[] };
          const admissions = json.admissions ?? [];
          dbRows = admissions.map((a) => ({
            id: a.id,
            studentName: a.studentName,
            parentName: a.parentName,
            phone: a.phone,
            courseInterest: a.programTitle,
            programId: a.programId,
            status: a.status as AdmissionStatus,
            createdAt: a.createdAt,
            source: "db",
          }));
        }
      } catch {
        /* keep local rows */
      }
    }
    setRows(
      [...dbRows, ...local].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  }, []);

  useEffect(() => {
    void refreshAll();
    const ev = () => void refreshAll();
    window.addEventListener("motiva-admissions-updated", ev);
    return () => window.removeEventListener("motiva-admissions-updated", ev);
  }, [refreshAll]);

  useEffect(() => {
    async function loadBatches() {
      const token = getAuthToken();
      if (!token) {
        setAdminBatches([]);
        return;
      }
      const res = await fetch("/api/admin/batches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setAdminBatches([]);
        return;
      }
      const json = (await res.json()) as {
        batches?: {
          id: string;
          name: string;
          course_id: string;
          course_title: string;
          teacher_id: string;
          duration: number;
        }[];
      };
      setAdminBatches(json.batches ?? []);
    }
    void loadBatches();
  }, [approveFor]);

  const selectedBatch = adminBatches.find((b) => b.id === batchId);

  async function addStudentToServerBatch(
    bId: string,
    studentUserId: string,
  ): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error("Unauthorized");
    const gr = await fetch(`/api/admin/batches/${bId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!gr.ok) throw new Error("Could not load batch");
    const gj = (await gr.json()) as { student_ids?: string[] };
    const ids = gj.student_ids ?? [];
    const res = await fetch(`/api/admin/batches/${bId}/students`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ student_ids: [...ids, studentUserId] }),
    });
    if (!res.ok) throw new Error("Could not assign student to batch");
  }

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
    void refreshAll();
  }

  async function finishApprove(e: FormEvent) {
    e.preventDefault();
    if (!approveFor) return;
    if (!batchId || !selectedBatch) {
      setError(t("admin_admissions_need_batch"));
      return;
    }

    const course = {
      id: selectedBatch.course_id,
      name: selectedBatch.course_title,
    };

    setBusy(true);
    setError(null);

    try {
      if (approveFor.source === "db") {
        const token = getAuthToken();
        if (!token) throw new Error("Unauthorized");
        const res = await fetch(
          `/api/admin/admissions/${approveFor.id}/approve`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const body = (await res.json().catch(() => null)) as
          | {
              error?: string;
              student?: { id: string; email: string; password: string };
              parent?: { id: string; email: string; password: string };
            }
          | null;
        if (!res.ok) {
          throw new Error(body?.error ?? "Could not approve admission");
        }
        if (!body?.student || !body?.parent) {
          throw new Error("Invalid response");
        }

        upsertUserPublic({
          id: body.student.id,
          name: approveFor.studentName,
          email: body.student.email,
          role: "student",
        });
        upsertUserPublic({
          id: body.parent.id,
          name: approveFor.parentName,
          email: body.parent.email,
          role: "parent",
        });

        await addStudentToServerBatch(batchId, body.student.id);

        upsertStudentProfile({
          studentId: body.student.id,
          parentName: approveFor.parentName,
          parentPhone: approveFor.phone,
          parentUserId: body.parent.id,
          courseId: course.id,
          courseLabel: approveFor.courseInterest || course.name,
        });

        const amount = Math.max(0, parseFloat(fee) || 0);
        addPaymentEntry({
          studentId: body.student.id,
          studentName: approveFor.studentName,
          courseLabel: course.name,
          amount,
          status: feePaid ? "paid" : "pending",
        });
        setStudentPaymentStatus(body.student.id, feePaid ? "paid" : "pending");

        await syncStudentPaymentToServer(
          token,
          body.student.id,
          feePaid ? "paid" : "pending",
        );

        setCreated({
          studentId: body.student.id,
          studentEmail: body.student.email,
          studentPassword: body.student.password,
          parentId: body.parent.id,
          parentEmail: body.parent.email,
          parentPassword: body.parent.password,
        });
        setApproveFor(null);
        setBatchId("");
        await refreshAll();
        return;
      }

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

      await addStudentToServerBatch(batchId, studentUser.id);

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

      const admToken = getAuthToken();
      if (admToken) {
        await syncParentPortalRegister({
          token: admToken,
          parentId: parentUser.id,
          studentId: studentUser.id,
          name: approveFor.parentName,
          phone: approveFor.phone,
          notifyEnrolled: true,
        });
        await syncStudentPaymentToServer(
          admToken,
          studentUser.id,
          feePaid ? "paid" : "pending",
        );
      }

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
      setBatchId("");
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-lg text-neutral-600">{t("admin_admissions_sub")}</p>
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
        {error && !approveFor ? (
          <p className="mb-4 text-sm font-medium text-accent">{error}</p>
        ) : null}
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
                      {r.notes ? (
                        <p className="mt-2 text-sm text-neutral-600">
                          <span className="font-medium text-neutral-700">
                            {t("admin_admissions_notes_label")}:{" "}
                          </span>
                          {r.notes}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        {r.status}
                      </p>
                    </div>
                    {r.status === "pending" ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setError(null);
                            setApproveFor(r);
                            setBatchId(adminBatches[0]?.id ?? "");
                          }}
                          className="min-h-14 text-lg"
                        >
                          {t("admin_admissions_approve")}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busy}
                          onClick={async () => {
                            setError(null);
                            setBusy(true);
                            try {
                              if (r.source === "db") {
                                const token = getAuthToken();
                                if (!token) throw new Error("Unauthorized");
                                const res = await fetch(
                                  `/api/admin/admissions/${r.id}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ status: "rejected" }),
                                  },
                                );
                                if (!res.ok) {
                                  const j = (await res
                                    .json()
                                    .catch(() => null)) as {
                                    error?: string;
                                  } | null;
                                  throw new Error(j?.error ?? "Reject failed");
                                }
                                await refreshAll();
                              } else {
                                setAdmissionStatus(r.id, "rejected");
                                await refreshAll();
                              }
                            } catch (e) {
                              setError(
                                e instanceof Error ? e.message : "Error",
                              );
                            } finally {
                              setBusy(false);
                            }
                          }}
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
                {t("admin_admissions_pick_batch")}
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
                >
                  {adminBatches.length === 0 ? (
                    <option value="">{t("admin_admissions_need_batch")}</option>
                  ) : (
                    adminBatches.map((b) => {
                      const tn =
                        listTeachers().find((x) => x.id === b.teacher_id)?.name ??
                        "—";
                      return (
                        <option key={b.id} value={b.id}>
                          {b.name} · {b.course_title} · {tn} · {b.duration}{" "}
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
              {selectedBatch ? (
                <p className="text-sm text-neutral-500">
                  {t("admin_classes_card_teacher")}:{" "}
                  {listTeachers().find((x) => x.id === selectedBatch.teacher_id)
                    ?.name ?? "—"}
                  {" · "}
                  {t("admin_admissions_pick_course")}: {selectedBatch.course_title}
                </p>
              ) : null}
              {error ? (
                <p className="text-sm font-medium text-accent">{error}</p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  disabled={busy || adminBatches.length === 0}
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
                    setBatchId("");
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
              {t("admin_admissions_created_title")}
            </h3>
            <div className="mt-6 space-y-5 rounded-2xl bg-neutral-50 p-4 text-left text-sm">
              <div>
                <p className="font-bold text-foreground">
                  {t("admin_admissions_student_login")}
                </p>
                <p className="mt-2 text-neutral-600">
                  {t("admin_admissions_login_email")}:{" "}
                  <span className="font-mono break-all text-foreground">
                    {created.studentEmail}
                  </span>
                </p>
                <p className="mt-1 text-neutral-600">
                  {t("admin_admissions_password")}:{" "}
                  <span className="font-mono text-foreground">
                    {created.studentPassword}
                  </span>
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  {t("admin_admissions_student_id")}:{" "}
                  <span className="font-mono">{created.studentId}</span>
                </p>
              </div>
              <hr className="border-neutral-200" />
              <div>
                <p className="font-bold text-foreground">
                  {t("admin_admissions_parent_login")}
                </p>
                <p className="mt-2 text-neutral-600">
                  {t("admin_admissions_login_email")}:{" "}
                  <span className="font-mono break-all text-foreground">
                    {created.parentEmail}
                  </span>
                </p>
                <p className="mt-1 text-neutral-600">
                  {t("admin_admissions_password")}:{" "}
                  <span className="font-mono text-foreground">
                    {created.parentPassword}
                  </span>
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  {t("admin_admissions_parent_id")}:{" "}
                  <span className="font-mono">{created.parentId}</span>
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                setCreated(null);
                setError(null);
              }}
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
