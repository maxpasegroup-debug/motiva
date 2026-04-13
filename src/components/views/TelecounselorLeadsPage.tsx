"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAuthToken } from "@/lib/session";
import type { UserRecord } from "@/lib/users-store";

type Lead = {
  id: string;
  name: string;
  phone: string;
  type: "tuition" | "foundation";
  subjects: string | null;
  status: "new" | "demo" | "admission" | "closed";
  assigned_to: string | null;
};

export function TelecounselorLeadsPage() {
  const { t } = useLanguage();
  const token = getAuthToken();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [executives, setExecutives] = useState<UserRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"tuition" | "foundation">("tuition");
  const [subjects, setSubjects] = useState("");

  const [admissionLeadId, setAdmissionLeadId] = useState<string | null>(null);
  const [stName, setStName] = useState("");
  const [parName, setParName] = useState("");
  const [admPhone, setAdmPhone] = useState("");
  const [feeCents, setFeeCents] = useState("");

  const refresh = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [lr, er] = await Promise.all([
        fetch("/api/leads", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/users?role=demo_executive", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const lj = (await lr.json().catch(() => ({}))) as {
        leads?: Lead[];
        error?: string;
      };
      if (!lr.ok) {
        setError(lj.error ?? t("leads_load_error"));
        return;
      }
      setLeads(lj.leads ?? []);
      if (er.ok) {
        const ej = (await er.json().catch(() => ({}))) as {
          users?: UserRecord[];
        };
        setExecutives(ej.users ?? []);
      }
    } catch {
      setError(t("leads_load_error"));
    }
  }, [token, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        type,
        subjects: subjects.trim() || null,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? t("leads_create_error"));
      return;
    }
    setName("");
    setPhone("");
    setSubjects("");
    await refresh();
  }

  async function patchStatus(id: string, status: Lead["status"]) {
    if (!token) return;
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    await refresh();
  }

  async function assignDemo(leadId: string, demo_executive_id: string) {
    if (!token) return;
    const res = await fetch(`/api/leads/${leadId}/assign-demo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ demo_executive_id }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? t("leads_demo_error"));
      return;
    }
    await refresh();
  }

  async function submitAdmission(e: FormEvent) {
    e.preventDefault();
    if (!token || !admissionLeadId) return;
    const cents = feeCents.trim() ? parseInt(feeCents, 10) : NaN;
    const res = await fetch(`/api/leads/${admissionLeadId}/admission`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_name: stName.trim(),
        parent_name: parName.trim(),
        phone: admPhone.trim(),
        fee_amount_cents: Number.isFinite(cents) ? cents : null,
        fee_currency: "INR",
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? t("leads_admission_error"));
      return;
    }
    setAdmissionLeadId(null);
    setStName("");
    setParName("");
    setAdmPhone("");
    setFeeCents("");
    await refresh();
  }

  if (!token) {
    return (
      <p className="text-center text-neutral-600">{t("leads_need_login")}</p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t("leads_title")}</h1>
      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold">{t("leads_add_title")}</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <input
            required
            className="min-h-12 rounded-lg border border-neutral-300 px-3"
            placeholder={t("leads_name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            className="min-h-12 rounded-lg border border-neutral-300 px-3"
            placeholder={t("leads_phone_placeholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <select
            className="min-h-12 rounded-lg border border-neutral-300 px-3"
            value={type}
            onChange={(e) =>
              setType(e.target.value === "foundation" ? "foundation" : "tuition")
            }
          >
            <option value="tuition">{t("leads_type_tuition")}</option>
            <option value="foundation">{t("leads_type_foundation")}</option>
          </select>
          <input
            className="min-h-12 rounded-lg border border-neutral-300 px-3"
            placeholder={t("leads_subjects_placeholder")}
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
          />
          <Button type="submit" className="min-h-12">
            {t("leads_add_submit")}
          </Button>
        </form>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("leads_list_title")}</h2>
        <ul className="space-y-4">
          {leads.map((l) => (
            <li key={l.id}>
              <Card className="p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">{l.name}</p>
                    <p className="text-sm text-neutral-600">{l.phone}</p>
                    <p className="text-xs text-neutral-500">
                      {l.type}
                      {l.subjects ? ` · ${l.subjects}` : ""}
                    </p>
                  </div>
                  <select
                    className="rounded-lg border border-neutral-300 px-2 py-2 text-sm"
                    value={l.status}
                    onChange={(e) =>
                      void patchStatus(l.id, e.target.value as Lead["status"])
                    }
                  >
                    <option value="new">new</option>
                    <option value="demo">demo</option>
                    <option value="admission">admission</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
                {l.type === "tuition" && executives.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select
                      id={`exec-${l.id}`}
                      className="min-h-10 flex-1 rounded-lg border border-neutral-300 px-2 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        {t("leads_pick_demo_exec")}
                      </option>
                      {executives.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-10"
                      onClick={() => {
                        const sel = document.getElementById(
                          `exec-${l.id}`,
                        ) as HTMLSelectElement | null;
                        const v = sel?.value ?? "";
                        if (v) void assignDemo(l.id, v);
                      }}
                    >
                      {t("leads_assign_demo")}
                    </Button>
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 min-h-10 w-full sm:w-auto"
                  onClick={() => {
                    setAdmissionLeadId(l.id);
                    setAdmPhone(l.phone);
                    setStName(l.name);
                  }}
                >
                  {t("leads_to_admission")}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {admissionLeadId ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold">{t("leads_admission_modal_title")}</h3>
            <form onSubmit={submitAdmission} className="mt-4 flex flex-col gap-3">
              <input
                required
                className="min-h-11 rounded-lg border px-3"
                placeholder={t("leads_student_name")}
                value={stName}
                onChange={(e) => setStName(e.target.value)}
              />
              <input
                required
                className="min-h-11 rounded-lg border px-3"
                placeholder={t("leads_parent_name")}
                value={parName}
                onChange={(e) => setParName(e.target.value)}
              />
              <input
                required
                className="min-h-11 rounded-lg border px-3"
                placeholder={t("leads_phone_placeholder")}
                value={admPhone}
                onChange={(e) => setAdmPhone(e.target.value)}
              />
              <input
                className="min-h-11 rounded-lg border px-3"
                placeholder={t("leads_fee_cents_placeholder")}
                inputMode="numeric"
                value={feeCents}
                onChange={(e) => setFeeCents(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" className="min-h-11 flex-1">
                  {t("leads_admission_submit")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1"
                  onClick={() => setAdmissionLeadId(null)}
                >
                  {t("leads_cancel")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
