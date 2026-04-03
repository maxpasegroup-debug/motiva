"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  deleteStudent,
  listStudents,
  type StudentRecord,
} from "@/lib/students-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getAuthToken } from "@/lib/session";
import { upsertUserPublic, type UserRecord } from "@/lib/users-store";
import {
  getStudentPaymentStatus,
  setStudentPaymentStatus,
  type PaymentStatus,
} from "@/lib/student-payments-store";

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 1 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

export function AdminStudentsPage() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<null | {
    email: string;
    password: string;
  }>(null);
  const [copiedKey, setCopiedKey] = useState<null | "email" | "password">(
    null,
  );

  function refresh() {
    setStudents(listStudents());
  }

  useEffect(() => {
    refresh();

    function onUsersUpdated() {
      refresh();
    }
    window.addEventListener("motiva-users-updated", onUsersUpdated);
    return () => window.removeEventListener("motiva-users-updated", onUsersUpdated);
  }, []);

  function generatePassword() {
    // Spec: either "motiva123" or a random 6-digit number.
    if (Math.random() < 0.5) return "motiva123";
    const n = Math.floor(Math.random() * 1000000);
    return String(n).padStart(6, "0");
  }

  function generateEmailFromName(rawName: string) {
    const slug = rawName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\\.+|\\.+$/g, "");
    const n = Math.floor(Math.random() * 9000) + 1000;
    return `${slug || "user"}${n}@motiva.local`;
  }

  async function copyValue(key: "email" | "password", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      // Ignore; user can manually select/copy from the input.
    }
  }

  function whatsappHrefFromStudent(student: StudentRecord) {
    // We don't currently store a dedicated phone field in the UI.
    // For legacy records, `email` was derived from mobile digits.
    const digits = student.email.replace(/[^0-9]/g, "");
    if (!digits) return null;
    const phone = digits.startsWith("91") ? digits : `91${digits}`;
    return `https://wa.me/${phone}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    const em = email.trim().toLowerCase();
    if (!n) {
      setError(t("admin_name_required"));
      return;
    }
    const finalEmail = em || generateEmailFromName(n);
    const finalPassword = password || generatePassword();

    const token = getAuthToken();
    if (!token) {
      setError("Unauthorized");
      return;
    }

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: n,
        email: finalEmail,
        password: finalPassword,
        role: "student",
      }),
    });

    if (!res.ok) {
      setError("Something went wrong");
      return;
    }

    const json = (await res.json()) as { user: UserRecord };
    upsertUserPublic(json.user);
    setStudentPaymentStatus(json.user.id, paymentStatus);
    setName("");
    setEmail("");
    setPassword("");
    setPaymentStatus("pending");
    refresh();
    setCreatedUser({ email: finalEmail, password: finalPassword });
  }

  async function handleDelete(id: string) {
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setError("Something went wrong");
      return;
    }
    deleteStudent(id);
    refresh();
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {t("admin_nav_students")}
      </h1>
      <p className="mt-1 text-sm text-neutral-600">Step 1: Add students</p>

      <Card className="p-6 shadow-md sm:p-8">
        <h2 className="mb-6 text-lg font-semibold text-foreground">
          {t("admin_add_student_section")}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="block text-left text-sm font-medium text-neutral-700">
            <span className="mb-2 block">{t("admin_student_name")}</span>
            <input
              type="text"
              name="studentName"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
            />
          </label>
          <label className="block text-left text-sm font-medium text-neutral-700">
            <span className="mb-2 block">Email (optional)</span>
            <input
              type="email"
              name="studentEmail"
              inputMode="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
            />
          </label>
          <label className="block text-left text-sm font-medium text-neutral-700">
            <span className="mb-2 block">Password</span>
            <input
              type="password"
              name="studentPassword"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              readOnly
              className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPassword(generatePassword());
              if (error) setError(null);
            }}
            className="w-auto min-h-12"
          >
            Generate Password
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPassword(generatePassword());
              if (error) setError(null);
            }}
            className="w-auto min-h-12"
          >
            Change Password
          </Button>
          <label className="block text-left text-sm font-medium text-neutral-700">
            <span className="mb-2 block">Payment Status</span>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
            >
              <option value="paid">Paid ✅</option>
              <option value="pending">Pending ❌</option>
            </select>
          </label>

          {error ? (
            <p className="text-sm text-accent" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" icon={<PlusIcon />}>
            {t("admin_add_student")}
          </Button>
        </form>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("admin_student_list_heading")}
        </h2>
        {students.length === 0 ? (
          <Card className="p-8 text-center text-neutral-500 shadow-sm">
            {t("admin_no_students")}
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {students.map((student) => (
              <li key={student.id}>
                <Card className="flex flex-col gap-4 p-6 shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0 space-y-1">
                    <p className="text-lg font-semibold text-foreground">
                      {student.name}
                    </p>
                    <p className="text-base text-neutral-600">{student.email}</p>
                    <div className="mt-2">
                      <select
                        value={getStudentPaymentStatus(student.id)}
                        onChange={(e) =>
                          setStudentPaymentStatus(
                            student.id,
                            e.target.value as PaymentStatus,
                          )
                        }
                        className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                      >
                        <option value="paid">Paid ✅</option>
                        <option value="pending">Pending ❌</option>
                      </select>
                    </div>
                    {whatsappHrefFromStudent(student) ? (
                      <a
                        href={whatsappHrefFromStudent(student) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 active:bg-primary/85"
                      >
                        Contact Student on WhatsApp
                      </a>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    icon={<TrashIcon />}
                    onClick={() => handleDelete(student.id)}
                    className="shrink-0 border-2 border-accent/30 text-accent hover:border-accent/50 hover:bg-accent/10 focus-visible:outline-accent/50 sm:max-w-xs sm:w-full"
                    aria-label={`${t("admin_delete")}: ${student.name}`}
                  >
                    {t("admin_delete")}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {createdUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-foreground">
                  User Created ✅
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Email:{" "}
                  <span className="font-semibold text-neutral-800">
                    {createdUser.email}
                  </span>
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Password:{" "}
                  <span className="font-semibold text-neutral-800">
                    {createdUser.password}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreatedUser(null);
                  setCopiedKey(null);
                }}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-neutral-500 hover:bg-neutral-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  readOnly
                  value={createdUser.email}
                  className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyValue("email", createdUser.email)}
                  className="w-auto min-h-12"
                >
                  {copiedKey === "email" ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  readOnly
                  value={createdUser.password}
                  className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    copyValue("password", createdUser.password)
                  }
                  className="w-auto min-h-12"
                >
                  {copiedKey === "password" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
