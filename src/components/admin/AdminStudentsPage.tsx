"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getAuthToken } from "@/lib/session";
import { upsertUserPublic, type UserRecord } from "@/lib/users-store";

type AdminStudent = UserRecord & {
  mobile?: string | null;
};

type CreatedUser = {
  mobile: string;
  pin: string;
};

function generatePin() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

export function AdminStudentsPage() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState(generatePin);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  async function refresh() {
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch("/api/admin/users?role=student", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const body = (await res.json()) as { users?: AdminStudent[] };
    setStudents(body.users ?? []);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const finalName = name.trim();
    const finalMobile = mobile.replace(/\D/g, "").slice(-10);
    const finalPin = pin || generatePin();

    if (!finalName) {
      setError(t("admin_name_required"));
      return;
    }
    if (!/^\d{10}$/.test(finalMobile) || !/^\d{4}$/.test(finalPin)) {
      setError("Enter a 10-digit mobile number and 4-digit PIN");
      return;
    }

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
        name: finalName,
        mobile: finalMobile,
        pin: finalPin,
        role: "student",
      }),
    });

    const body = (await res.json().catch(() => null)) as
      | { error?: string; user?: AdminStudent }
      | null;
    if (!res.ok || !body?.user) {
      setError(body?.error ?? "Something went wrong");
      return;
    }

    upsertUserPublic({
      id: body.user.id,
      name: body.user.name,
      email: `${finalMobile}@motiva.local`,
      role: body.user.role,
    });
    setName("");
    setMobile("");
    setPin(generatePin());
    setCreatedUser({ mobile: finalMobile, pin: finalPin });
    await refresh();
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-neutral-600">Create student login credentials</p>

      <Card className="p-6 shadow-md sm:p-8">
        <h2 className="mb-6 text-lg font-semibold text-foreground">
          {t("admin_add_student_section")}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("admin_student_name")}
            className="min-h-12 rounded-lg border border-neutral-300 px-3 text-sm md:col-span-2"
          />
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Mobile"
            inputMode="numeric"
            className="min-h-12 rounded-lg border border-neutral-300 px-3 text-sm"
          />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="PIN"
            inputMode="numeric"
            maxLength={4}
            className="min-h-12 rounded-lg border border-neutral-300 px-3 text-sm"
          />
          <Button type="button" variant="outline" onClick={() => setPin(generatePin())}>
            Generate PIN
          </Button>
          <Button type="submit" className="md:col-span-3">
            {t("admin_add_student")}
          </Button>
        </form>
        {error ? <p className="mt-4 text-sm font-medium text-accent">{error}</p> : null}
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("admin_student_list_heading")}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3 font-medium">{student.name}</td>
                  <td className="px-4 py-3">{student.mobile ?? "-"}</td>
                  <td className="px-4 py-3">{student.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {createdUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">Student Created</h3>
            <p className="mt-3 text-sm text-neutral-600">Mobile: {createdUser.mobile}</p>
            <p className="mt-1 text-sm text-neutral-600">PIN: {createdUser.pin}</p>
            <Button type="button" onClick={() => setCreatedUser(null)} className="mt-5 w-full">
              OK
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
