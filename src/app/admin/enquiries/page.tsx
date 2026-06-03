"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  MessageCircle,
  Phone,
  Plus,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import { whatsappHref } from "@/components/marketing/whatsapp";
import {
  FLOW_TYPE_BADGE_CLASS,
  LEAD_PIPELINE_STEPS,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
  getLeadStepIndex,
  getNextLeadStatus,
  normalizeLeadFlowType,
  normalizeLeadStatus,
  type LeadStatus,
} from "@/lib/leads";

type Enquiry = {
  id: string;
  name: string;
  mobile: string;
  programInterest: string;
  message: string | null;
  status: string;
  createdAt: string;
};

type Lead = {
  id: string;
  name: string;
  phone: string;
  type: string;
  subjects: string | null;
  status: string;
  flowType: string;
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  demos?: { id: string; status: string; result: string | null }[];
  admissions?: { id: string; status: string }[];
};

type CreateLeadForm = {
  name: string;
  phone: string;
  type: "tuition" | "foundation" | "remedial";
  subjects: string;
  assignedTo: string;
  note: string;
};

type ApiResponse = {
  enquiries?: Enquiry[];
  leads?: Lead[];
  error?: string;
};

const EMPTY_FORM: CreateLeadForm = {
  name: "",
  phone: "",
  type: "tuition",
  subjects: "",
  assignedTo: "",
  note: "",
};

const FILTERS = [
  { key: "active", label: "Active" },
  { key: "new", label: "New" },
  { key: "demo", label: "Demo" },
  { key: "admission", label: "Admission" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function formatProgram(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function buildWhatsAppMessage(row: Enquiry | Lead) {
  const name = "mobile" in row ? row.name : row.name;
  const detail =
    "message" in row
      ? row.message
      : row.subjects || (row.type === "remedial" ? "Remedial enquiry" : "Tuition enquiry");

  return [
    "Hi, Motiva Edus team here.",
    `${name}, we are following up about your learning support enquiry.`,
    "Can we schedule a quick call to understand the student's requirement?",
    detail ? `Details: ${detail}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function isAdmissionStatus(status: string) {
  return [
    "admission",
    "payment_pending",
    "payment_confirmed",
    "account_created",
    "mentor_assigned",
  ].includes(status);
}

function leadMatchesFilter(lead: Lead, filter: FilterKey) {
  const status = normalizeLeadStatus(lead.status);
  if (filter === "active") {
    return !["closed_lost", "closed", "closed_won"].includes(status);
  }
  if (filter === "new") return status === "new" || status === "contacted";
  if (filter === "demo") {
    return ["demo", "demo_scheduled", "demo_done", "counseling"].includes(status);
  }
  if (filter === "admission") return isAdmissionStatus(status);
  if (filter === "won") return status === "closed_won" || status === "mentor_assigned";
  return status === "closed_lost" || status === "closed";
}

function pipelineLabel(lead: Lead) {
  const status = normalizeLeadStatus(lead.status);
  return STATUS_LABEL[status] ?? STATUS_LABEL.new;
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof ClipboardList;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        <span className={`rounded-lg p-2 ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-2xl font-black text-neutral-950">{value}</p>
    </div>
  );
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("active");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateLeadForm>(EMPTY_FORM);
  const [createBusy, setCreateBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/enquiries");
    const json = (await res.json().catch(() => ({}))) as ApiResponse;
    if (!res.ok) {
      setError(json.error || "Could not load lead management data");
      setEnquiries([]);
      setLeads([]);
      setLoading(false);
      return;
    }
    setEnquiries(json.enquiries ?? []);
    setLeads(json.leads ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const active = leads.filter((lead) => leadMatchesFilter(lead, "active")).length;
    const admissions = leads.filter((lead) => isAdmissionStatus(lead.status)).length;
    const won = leads.filter((lead) =>
      ["closed_won", "mentor_assigned"].includes(normalizeLeadStatus(lead.status)),
    ).length;
    return {
      freshEnquiries: enquiries.filter((row) => row.status === "new").length,
      active,
      admissions,
      won,
    };
  }, [enquiries, leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (!leadMatchesFilter(lead, filter)) return false;
      if (!query) return true;
      return [lead.name, lead.phone, lead.subjects, lead.assignedTo, lead.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [filter, leads, search]);

  const freshEnquiries = useMemo(
    () =>
      enquiries
        .filter((row) => row.status !== "converted" && row.status !== "closed_lost")
        .slice(0, 6),
    [enquiries],
  );

  function updateEnquiry(updated: Enquiry) {
    setEnquiries((current) =>
      current.map((row) => (row.id === updated.id ? updated : row)),
    );
  }

  function updateLead(updated: Lead) {
    setLeads((current) =>
      current.map((row) => (row.id === updated.id ? updated : row)),
    );
  }

  async function setEnquiryStatus(row: Enquiry, status: "contacted" | "closed_lost") {
    setBusyId(row.id);
    setError(null);
    const res = await fetch(`/api/admin/enquiries/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json().catch(() => null)) as
      | { error?: string; enquiry?: Enquiry }
      | null;
    setBusyId(null);
    if (!res.ok || !json?.enquiry) {
      setError(json?.error ?? "Could not update enquiry");
      return;
    }
    updateEnquiry(json.enquiry);
  }

  async function convertToLead(row: Enquiry) {
    setBusyId(row.id);
    setError(null);
    const res = await fetch(`/api/admin/enquiries/${row.id}/convert-to-lead`, {
      method: "POST",
    });
    const json = (await res.json().catch(() => null)) as
      | { error?: string; enquiry?: Enquiry; lead?: Lead }
      | null;
    setBusyId(null);
    if (!res.ok || !json?.enquiry || !json.lead?.id) {
      setError(json?.error ?? "Could not convert enquiry");
      return;
    }
    updateEnquiry(json.enquiry);
    await load();
  }

  async function updateLeadStatus(lead: Lead, status: LeadStatus, note?: string) {
    setBusyId(lead.id);
    setError(null);
    const res = await fetch(`/api/admin/leads/${lead.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    const json = (await res.json().catch(() => null)) as
      | { error?: string; lead?: Lead }
      | null;
    setBusyId(null);
    if (!res.ok || !json?.lead) {
      setError(json?.error ?? "Could not update lead");
      return;
    }
    updateLead(json.lead);
  }

  async function handleCreateLead(event: FormEvent) {
    event.preventDefault();
    setCreateBusy(true);
    setError(null);
    const res = await fetch("/api/admin/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const json = (await res.json().catch(() => null)) as
      | { error?: string; lead?: Lead }
      | null;
    setCreateBusy(false);
    if (!res.ok || !json?.lead) {
      setError(json?.error ?? "Could not create lead");
      return;
    }
    setLeads((current) => [json.lead as Lead, ...current]);
    setCreateForm(EMPTY_FORM);
    setShowCreate(false);
    setFilter("active");
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">
            Lead Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Create leads, track enquiry follow-up, move parents through the
            pipeline, and open the detailed admission workflow when a lead is
            ready.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((value) => !value)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Lead
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Fresh enquiries"
          value={stats.freshEnquiries}
          icon={ClipboardList}
          tone="bg-blue-50 text-blue-700"
        />
        <StatTile
          label="Active leads"
          value={stats.active}
          icon={UserRound}
          tone="bg-amber-50 text-amber-700"
        />
        <StatTile
          label="Admissions"
          value={stats.admissions}
          icon={CircleDollarSign}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatTile
          label="Won"
          value={stats.won}
          icon={CheckCircle2}
          tone="bg-cyan-50 text-cyan-700"
        />
      </div>

      {showCreate ? (
        <form
          onSubmit={handleCreateLead}
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-3 lg:grid-cols-6">
            <label className="lg:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">
                Student or parent name
              </span>
              <input
                required
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((form) => ({ ...form, name: event.target.value }))
                }
                className="min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none ring-blue-600/20 focus:border-blue-600 focus:ring-2"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">
                Phone
              </span>
              <input
                required
                value={createForm.phone}
                onChange={(event) =>
                  setCreateForm((form) => ({ ...form, phone: event.target.value }))
                }
                className="min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none ring-blue-600/20 focus:border-blue-600 focus:ring-2"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">
                Program
              </span>
              <select
                value={createForm.type}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    type: event.target.value as CreateLeadForm["type"],
                  }))
                }
                className="min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none ring-blue-600/20 focus:border-blue-600 focus:ring-2"
              >
                <option value="tuition">Tuition</option>
                <option value="foundation">Foundation</option>
                <option value="remedial">Remedial</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">
                Owner
              </span>
              <input
                value={createForm.assignedTo}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    assignedTo: event.target.value,
                  }))
                }
                placeholder="Staff name"
                className="min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none ring-blue-600/20 focus:border-blue-600 focus:ring-2"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">
                Subject
              </span>
              <input
                value={createForm.subjects}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    subjects: event.target.value,
                  }))
                }
                placeholder="Maths, English"
                className="min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none ring-blue-600/20 focus:border-blue-600 focus:ring-2"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row">
            <textarea
              value={createForm.note}
              onChange={(event) =>
                setCreateForm((form) => ({ ...form, note: event.target.value }))
              }
              placeholder="Call notes, source, preferred timing, fee discussion..."
              className="min-h-20 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-blue-600/20 focus:border-blue-600 focus:ring-2"
            />
            <button
              type="submit"
              disabled={createBusy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 lg:self-start"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Create Lead
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-950">Lead Pipeline</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Move leads forward from the list, or open a lead for payment,
              admission, account creation, and mentor assignment.
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone, owner"
                className="min-h-11 w-full rounded-lg border border-neutral-300 pl-9 pr-3 text-sm outline-none ring-blue-600/20 focus:border-blue-600 focus:ring-2"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-neutral-200 px-4 py-3">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-sm font-bold transition ${
                filter === item.key
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="p-4 text-sm text-neutral-500">Loading leads...</p>
        ) : filteredLeads.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">
            No leads match this view.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredLeads.map((lead) => {
              const status = normalizeLeadStatus(lead.status);
              const flowType = normalizeLeadFlowType(lead.flowType);
              const nextStatus = getNextLeadStatus(status, flowType);
              const progressIndex = getLeadStepIndex(status, flowType);
              const busy = busyId === lead.id;
              return (
                <article key={lead.id} className="p-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)_auto] xl:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-neutral-950">
                          {lead.name}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            STATUS_BADGE_CLASS[status]
                          }`}
                        >
                          {pipelineLabel(lead)}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            FLOW_TYPE_BADGE_CLASS[flowType]
                          }`}
                        >
                          {flowType}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1 font-semibold text-blue-700"
                        >
                          <Phone className="h-4 w-4" aria-hidden />
                          {lead.phone}
                        </a>
                        <span>{lead.subjects || formatProgram(lead.type)}</span>
                        <span>Owner: {lead.assignedTo || "Unassigned"}</span>
                        <span>Updated: {formatDate(lead.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="grid grid-cols-3 gap-1 sm:grid-cols-9">
                        {LEAD_PIPELINE_STEPS.map((step, index) => {
                          const reached = progressIndex >= index;
                          return (
                            <span
                              key={step.key}
                              title={step.label}
                              className={`h-2 rounded-full ${
                                reached ? "bg-emerald-500" : "bg-neutral-200"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">
                        {lead.demos?.length ?? 0} demos,{" "}
                        {lead.admissions?.length ?? 0} admissions
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <a
                        href={whatsappHref(buildWhatsAppMessage(lead))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden />
                        WhatsApp
                      </a>
                      {nextStatus ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            updateLeadStatus(
                              lead,
                              nextStatus,
                              `Moved to ${STATUS_LABEL[nextStatus]}.`,
                            )
                          }
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden />
                          Next
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy || status === "closed_lost"}
                        onClick={() =>
                          updateLeadStatus(lead, "closed_lost", "Marked lost.")
                        }
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" aria-hidden />
                        Lost
                      </button>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-50"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 p-4">
          <h2 className="text-lg font-bold text-neutral-950">Fresh Enquiries</h2>
          <p className="mt-1 text-sm text-neutral-500">
            New website enquiries that can be contacted or converted into leads.
          </p>
        </div>
        {freshEnquiries.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">
            No fresh enquiries are waiting.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {freshEnquiries.map((row) => {
              const busy = busyId === row.id;
              return (
                <article
                  key={row.id}
                  className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-neutral-950">{row.name}</h3>
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold capitalize text-neutral-700">
                        {row.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatDate(row.createdAt)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                      <a
                        href={`tel:${row.mobile}`}
                        className="inline-flex items-center gap-1 font-semibold text-blue-700"
                      >
                        <Phone className="h-4 w-4" aria-hidden />
                        {row.mobile}
                      </a>
                      <span className="capitalize">
                        {formatProgram(row.programInterest)}
                      </span>
                    </div>
                    <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-neutral-700">
                      {row.message || "No details shared"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <a
                      href={whatsappHref(buildWhatsAppMessage(row))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      disabled={busy || row.status !== "new"}
                      onClick={() => setEnquiryStatus(row, "contacted")}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Contacted
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => convertToLead(row)}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Convert
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEnquiryStatus(row, "closed_lost")}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Lost
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
