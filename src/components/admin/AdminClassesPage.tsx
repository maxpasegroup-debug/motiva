"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addClass,
  deleteClass,
  listClasses,
  setClassStudentIds,
  type ClassDuration,
  type ClassRecord,
} from "@/lib/classes-store";
import { listTeachers, type TeacherRecord } from "@/lib/teachers-store";
import { listStudents, type StudentRecord } from "@/lib/students-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";

const DURATION_PRESETS: { days: ClassDuration; emoji: string }[] = [
  { days: 12, emoji: "📅" },
  { days: 25, emoji: "🗓️" },
];

const CARD_THEMES = [
  "border-primary/30 bg-primary/[0.07] shadow-primary/10",
  "border-accent/35 bg-accent/[0.08] shadow-accent/10",
  "border-emerald-500/35 bg-emerald-500/[0.07] shadow-emerald-500/10",
  "border-violet-500/35 bg-violet-500/[0.07] shadow-violet-500/10",
];

function teacherName(teachers: TeacherRecord[], id: string) {
  return teachers.find((t) => t.id === id)?.name ?? "—";
}

function previewBatchName(
  teacherId: string,
  duration: ClassDuration,
  existing: ClassRecord[],
): string {
  if (!teacherId) return "";
  const n = existing.filter((c) => c.teacherId === teacherId).length;
  const letter = n < 26 ? String.fromCharCode(65 + n) : String(n + 1);
  return `Batch ${letter} - ${duration} Days`;
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

export function AdminClassesPage() {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);

  const [teacherId, setTeacherId] = useState("");
  const [duration, setDuration] = useState<ClassDuration>(12);
  const [createError, setCreateError] = useState<string | null>(null);

  const [assignClassId, setAssignClassId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [assignSaved, setAssignSaved] = useState(false);

  function refresh() {
    setClasses(listClasses());
    setTeachers(listTeachers());
    setStudents(listStudents());
  }

  useEffect(() => {
    refresh();

    function onUsersUpdated() {
      refresh();
    }
    window.addEventListener("motiva-users-updated", onUsersUpdated);
    return () =>
      window.removeEventListener("motiva-users-updated", onUsersUpdated);
  }, []);

  const previewName = useMemo(
    () => previewBatchName(teacherId, duration, classes),
    [teacherId, duration, classes],
  );

  const assignClass = classes.find((c) => c.id === assignClassId) ?? null;

  const studentsForAssign = useMemo(() => {
    if (!assignClass) return [];
    return students;
  }, [assignClass, students]);

  useEffect(() => {
    if (!assignClassId) {
      setSelectedStudentIds(new Set());
      return;
    }
    const c = classes.find((x) => x.id === assignClassId);
    if (c) setSelectedStudentIds(new Set(c.studentIds));
  }, [assignClassId, classes]);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!teacherId) {
      setCreateError(t("admin_teacher_pick_required"));
      return;
    }
    addClass(teacherId, duration);
    setTeacherId("");
    setDuration(12);
    refresh();
  }

  function toggleStudent(id: string) {
    setAssignSaved(false);
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSaveAssignments() {
    if (!assignClassId) return;
    setClassStudentIds(assignClassId, Array.from(selectedStudentIds));
    setAssignSaved(true);
    refresh();
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {t("admin_nav_classes")}
      </h1>
      <p className="-mt-4 text-lg text-neutral-600">{t("admin_classes_batch_hint")}</p>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden border-2 border-neutral-200/80 p-6 shadow-lg sm:p-8">
          <h2 className="mb-2 text-xl font-bold text-foreground">
            Step 2: {t("admin_classes_create_title")}
          </h2>
          <p className="mb-6 text-sm text-neutral-600">
            {t("admin_classes_create_sub")}
          </p>
          <form onSubmit={handleCreate} className="flex flex-col gap-6">
            <label className="block text-left text-sm font-medium text-neutral-700">
              <span className="mb-2 block">{t("admin_assign_teacher")}</span>
              <select
                value={teacherId}
                onChange={(e) => {
                  setTeacherId(e.target.value);
                  setCreateError(null);
                }}
                className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
              >
                <option value="">{t("admin_select_teacher")}</option>
                {teachers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="mb-3 block text-sm font-medium text-neutral-700">
                {t("admin_classes_duration")}
              </span>
              <div className="grid grid-cols-2 gap-4">
                {DURATION_PRESETS.map(({ days, emoji }) => {
                  const active = duration === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDuration(days)}
                      className={`flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-all sm:min-h-[140px] ${
                        active
                          ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      }`}
                    >
                      <span className="text-4xl" aria-hidden>
                        {emoji}
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {days === 12
                          ? t("admin_classes_duration_12")
                          : t("admin_classes_duration_25")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {previewName ? (
              <div className="rounded-2xl bg-neutral-100 px-4 py-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {t("admin_classes_preview")}
                </p>
                <p className="mt-1 text-xl font-bold text-primary">{previewName}</p>
              </div>
            ) : null}

            {createError ? (
              <p className="text-sm text-accent" role="alert">
                {createError}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={teachers.length === 0}
              className="min-h-14"
            >
              {t("admin_classes_create_btn")}
            </Button>
            {teachers.length === 0 ? (
              <p className="text-center text-sm text-neutral-500">
                {t("admin_add_teacher_first")}
              </p>
            ) : null}
          </form>
        </Card>

        <Card className="overflow-hidden border-2 border-neutral-200/80 p-6 shadow-lg sm:p-8">
          <h2 className="mb-2 text-xl font-bold text-foreground">
            Step 3: {t("admin_classes_assign_title")}
          </h2>
          <p className="mb-6 text-sm text-neutral-600">
            {t("admin_classes_assign_sub")}
          </p>

          {classes.length === 0 ? (
            <div className="rounded-2xl bg-neutral-50 py-12 text-center text-neutral-500">
              {t("admin_classes_assign_need_class")}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <label className="block text-left text-sm font-medium text-neutral-700">
                <span className="mb-2 block">{t("admin_classes_pick_class")}</span>
                <select
                  value={assignClassId}
                  onChange={(e) => {
                    setAssignClassId(e.target.value);
                    setAssignSaved(false);
                  }}
                  className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                >
                  <option value="">{t("admin_classes_select_batch")}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              {assignClassId && studentsForAssign.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {t("admin_classes_no_students_for_teacher")}
                </p>
              ) : null}

              {assignClassId && studentsForAssign.length > 0 ? (
                <ul className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-3 sm:max-h-80">
                  {studentsForAssign.map((s) => {
                    const checked = selectedStudentIds.has(s.id);
                    return (
                      <li key={s.id}>
                        <label className="flex min-h-14 cursor-pointer items-center gap-4 rounded-xl px-3 py-2 hover:bg-neutral-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(s.id)}
                            className="h-5 w-5 rounded border-neutral-300 text-primary focus:ring-primary"
                          />
                          <span className="text-base font-medium text-foreground">
                            {s.name}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {assignClassId ? (
                <Button
                  type="button"
                  onClick={handleSaveAssignments}
                  disabled={studentsForAssign.length === 0}
                  className="min-h-14"
                >
                  {t("admin_classes_save_assignments")}
                </Button>
              ) : null}

              {assignSaved ? (
                <p className="text-center text-sm font-medium text-emerald-700">
                  {t("admin_classes_assign_saved")}
                </p>
              ) : null}
            </div>
          )}
        </Card>
      </div>

      <section>
        <h2 className="mb-6 text-xl font-bold text-foreground">
          {t("admin_classes_list_title")}
        </h2>
        {classes.length === 0 ? (
          <Card className="border-2 border-dashed border-neutral-200 p-12 text-center text-neutral-500 shadow-none">
            {t("admin_classes_no_classes")}
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((c, i) => {
              const tName = teacherName(teachers, c.teacherId);
              const count = c.studentIds.length;
              const theme = CARD_THEMES[i % CARD_THEMES.length];
              return (
                <Card
                  key={c.id}
                  className={`relative border-2 ${theme} p-6 shadow-xl sm:p-8`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      deleteClass(c.id);
                      if (assignClassId === c.id) setAssignClassId("");
                      refresh();
                    }}
                    className="absolute right-3 top-3 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-white/50 hover:text-red-600"
                    aria-label={t("admin_delete_class")}
                  >
                    <TrashIcon />
                  </button>
                  <p className="pr-10 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                    {c.name}
                  </p>
                  <div className="mt-6 space-y-3 text-base">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-hidden>
                        👤
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          {t("admin_classes_card_teacher")}
                        </p>
                        <p className="font-semibold text-foreground">{tName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-hidden>
                        ⏱️
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          {t("admin_classes_card_duration")}
                        </p>
                        <p className="font-semibold text-foreground">
                          {c.duration}{" "}
                          {t("admin_classes_days_short")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-hidden>
                        🎓
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          {t("admin_classes_card_students")}
                        </p>
                        <p className="text-xl font-bold tabular-nums text-foreground">
                          {count}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
