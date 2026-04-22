"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PaymentButton } from "@/components/payments/PaymentButton";
import {
  FLOW_TYPE_BADGE_CLASS,
  LEAD_PIPELINE_STEPS,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
  getAdvanceButtonLabel,
  getLeadStepIndex,
  getNextLeadStatus,
  isLeadStepDisabledForFlow,
  normalizeLeadFlowType,
  normalizeLeadStatus,
  parseLeadNotes,
} from "@/lib/leads";

type DemoView = {
  id: string;
  status: string;
  result: string | null;
  notes: string | null;
  createdAt: string;
};

type LeadView = {
  id: string;
  name: string;
  phone: string;
  type: string;
  flowType: string;
  status: string;
  notes: string | null;
  createdAt: string;
  demos: DemoView[];
};

type Props = {
  initialLead: LeadView;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminLeadDetailPage({ initialLead }: Props) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const flowType = normalizeLeadFlowType(lead.flowType);
  const status = normalizeLeadStatus(lead.status);
  const notes = useMemo(() => parseLeadNotes(lead.notes), [lead.notes]);
  const currentStepIndex = getLeadStepIndex(status, flowType);
  const nextStatus = getNextLeadStatus(status, flowType);
  const advanceLabel = getAdvanceButtonLabel(status, flowType);
  const isClosed = status === "closed_lost" || status === "closed_won";

  function runUpdate(payload: { status?: string; note?: string }) {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/admin/leads/${lead.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json().catch(() => null)) as
          | { error?: string; lead?: LeadView }
          | null;
        if (!res.ok || !json?.lead) {
          setError(json?.error ?? "Could not update lead");
          return;
        }
        setLead({
          ...json.lead,
          createdAt: json.lead.createdAt,
          demos: json.lead.demos.map((demo) => ({
            ...demo,
            createdAt: demo.createdAt,
          })),
        });
        setNote("");
        router.refresh();
      } catch {
        setError("Could not update lead");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">{lead.name}</h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${FLOW_TYPE_BADGE_CLASS[flowType]}`}
            >
              {flowType}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
          <div className="space-y-1 text-sm text-neutral-600">
            <p>Phone: {lead.phone}</p>
            <p className="capitalize">Type: {lead.type}</p>
            <p>Created: {formatDate(lead.createdAt)}</p>
          </div>
        </div>

        <Link
          href="/admin/leads"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Back to Leads
        </Link>
      </div>

      <Card className="space-y-6 p-5 sm:p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Pipeline Progress</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {LEAD_PIPELINE_STEPS.map((step, index) => {
              const isDisabled = isLeadStepDisabledForFlow(step.key, flowType);
              const isCompleted =
                !isDisabled &&
                (index < currentStepIndex ||
                  (status === "contacted" && index === 0) ||
                  (status === "closed_won" && index === LEAD_PIPELINE_STEPS.length - 1));
              const isCurrent =
                !isDisabled &&
                !isCompleted &&
                currentStepIndex === index &&
                status !== "closed_won" &&
                status !== "closed_lost";

              const boxClass = isDisabled
                ? "border-neutral-200 bg-neutral-50 text-neutral-400"
                : isCurrent
                  ? "border-primary bg-blue-50 text-primary"
                  : isCompleted
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-neutral-200 bg-white text-neutral-500";

              return (
                <div
                  key={step.key}
                  className={`flex min-h-24 flex-1 items-center gap-3 rounded-2xl border p-4 sm:min-w-[12rem] ${boxClass}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-current text-sm font-bold">
                    {isCompleted ? "✓" : index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="mt-1 text-xs">
                      {isDisabled
                        ? "Skipped for remedial flow"
                        : isCompleted
                          ? "Completed"
                          : isCurrent
                            ? "Current step"
                            : "Upcoming"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {status === "payment_confirmed" ? (
            <>
              <div className="inline-flex min-h-11 items-center rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                Payment Confirmed
              </div>
              <Button
                href={`/admin/admissions/create-account?leadId=${lead.id}`}
                className="min-h-11 sm:w-auto"
              >
                Create Student Account
              </Button>
            </>
          ) : status === "mentor_assigned" ? (
            <div className="inline-flex min-h-11 items-center rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Completed
            </div>
          ) : status === "payment_pending" ? (
            <div className="w-full sm:max-w-md">
              <PaymentButton
                leadId={lead.id}
                studentName={lead.name}
                mobile={lead.phone}
                onSuccess={() => window.location.reload()}
              />
            </div>
          ) : advanceLabel && nextStatus ? (
            <Button
              type="button"
              disabled={isPending}
              className="min-h-11 sm:w-auto"
              onClick={() => runUpdate({ status: nextStatus })}
            >
              {advanceLabel}
            </Button>
          ) : null}

          {!isClosed ? (
            <button
              type="button"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => runUpdate({ status: "closed_lost" })}
            >
              Mark as Lost
            </button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </Card>

      <Card className="space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notes</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Add timeline updates for counseling, payment, and follow-ups.
          </p>
        </div>

        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
              No notes yet.
            </div>
          ) : (
            notes
              .slice()
              .reverse()
              .map((entry, index) => (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>{entry.addedBy}</span>
                    <span>{formatDate(entry.timestamp)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{entry.text}</p>
                </div>
              ))
          )}
        </div>

        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="Add a timeline note"
            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-primary"
          />
          <Button
            type="button"
            disabled={isPending || !note.trim()}
            className="min-h-11 sm:w-auto"
            onClick={() => runUpdate({ note: note.trim() })}
          >
            Add Note
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Demos</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Existing demo history linked to this lead.
          </p>
        </div>

        {lead.demos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
            No demos recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {lead.demos.map((demo) => (
              <div
                key={demo.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-col gap-1 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-neutral-800">
                    Status: {demo.status}
                  </span>
                  <span>{formatDate(demo.createdAt)}</span>
                </div>
                {demo.result ? (
                  <p className="mt-2 text-sm text-neutral-700">
                    Result: {demo.result}
                  </p>
                ) : null}
                {demo.notes ? (
                  <p className="mt-2 text-sm text-neutral-700">{demo.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
