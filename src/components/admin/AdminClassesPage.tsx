"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { listTeachers, type TeacherRecord } from "@/lib/teachers-store";
import { listStudents, type StudentRecord } from "@/lib/students-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getAuthToken } from "@/lib/session";

type ClassDuration = 12 | 25;

type ApiBatch = {
  id: string;
  name: string;
  course_id: string;
  teacher_id: string;
  duration: ClassDuration;
  student_count: number;
  course_title: string;
  start_date: string | null;
  current_day?: number;
  present_today?: number;
};

type AttendanceReport = {
  current_day: number;
  by_day: { day_number: number; records: { student_id: string; status: string }[] }[];
  students: {
    student_id: string;
    name: string;
    attended_label: string;
  }[];
};

type CourseOption = {
  id: string;
  title: string;
  is_published?: boolean;
};

const DURATION_PRESETS: { days: ClassDuration; emoji: string }[] = [
  { days: 12, emoji: "📅" },
  { days: 25, emoji: "🗓️" },
];

const CARD_THEMES = [
  "border-primary/30 bg-primary/[0.07] shadow-primary/10",
  "border-accent/35 bg-accent/[0.08] shadow-accent/10",
  "border-neutral-200 bg-neutral-100 shadow-neutral-200/60",
  "border-primary/20 bg-primary/[0.04] shadow-primary/8",
];

function teacherName(teachers: TeacherRecord[], id: string) {
  return teachers.find((t) => t.id === id)?.name ?? "—";
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
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const [batchName, setBatchName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [duration, setDuration] = useState<ClassDuration>(12);
  const [createError, setCreateError] = useState<string | null>(null);

  const [assignBatchId, setAssignBatchId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [assignSaved, setAssignSaved] = useState(false);

  const [editBatchId, setEditBatchId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCourseId, setEditCourseId] = useState("");
  const [editTeacherId, setEditTeacherId] = useState("");
  const [editSaved, setEditSaved] = useState(false);

  const [reportBatchId, setReportBatchId] = useState<string | null>(null);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const reportStudentNameById = useMemo(() => {
    if (!report) return new Map<string, string>();
    return new Map(report.students.map((s) => [s.student_id, s.name]));
  }, [report]);

  const token = getAuthToken();

  const loadBatches = useCallback(async () => {
    if (!token) {
      setBatches([]);
      return;
    }
    try {
      const res = await fetch("/api/admin/batches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        batches?: ApiBatch[];
        error?: string;
      };
      if (!res.ok) {
        setListError(json.error ?? t("admin_batches_load_error"));
        setBatches([]);
        return;
      }
      setListError(null);
      setBatches(json.batches ?? []);
    } catch {
      setListError(t("admin_batches_load_error"));
      setBatches([]);
    }
  }, [token, t]);

  const loadCourses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        courses?: Array<{
          id: string;
          title: string;
          is_published?: boolean;
        }>;
      };
      setCourses(
        (json.courses ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          is_published: c.is_published,
        })),
      );
    } catch {
      /* ignore */
    }
  }, [token]);

  function refreshUsers() {
    setTeachers(listTeachers());
    setStudents(listStudents());
  }

  useEffect(() => {
    refreshUsers();
    void loadBatches();
    void loadCourses();
  }, [loadBatches, loadCourses]);

  useEffect(() => {
    function onUsersUpdated() {
      refreshUsers();
    }
    window.addEventListener("motiva-users-updated", onUsersUpdated);
    return () =>
      window.removeEventListener("motiva-users-updated", onUsersUpdated);
  }, []);

  const previewName = useMemo(() => {
    if (!teacherId) return "";
    const n = batches.filter((b) => b.teacher_id === teacherId).length;
    const letter = n < 26 ? String.fromCharCode(65 + n) : String(n + 1);
    return `Batch ${letter} - ${duration} Days`;
  }, [teacherId, duration, batches]);

  useEffect(() => {
    if (!assignBatchId || !token) {
      setSelectedStudentIds(new Set());
      return;
    }
    (async () => {
      const res = await fetch(`/api/admin/batches/${assignBatchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        student_ids?: string[];
      };
      setSelectedStudentIds(new Set(json.student_ids ?? []));
    })();
  }, [assignBatchId, token]);

  useEffect(() => {
    if (!editBatchId || !token) {
      setEditName("");
      setEditCourseId("");
      setEditTeacherId("");
      return;
    }
    (async () => {
      const res = await fetch(`/api/admin/batches/${editBatchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        batch?: ApiBatch;
      };
      if (json.batch) {
        setEditName(json.batch.name);
        setEditCourseId(json.batch.course_id);
        setEditTeacherId(json.batch.teacher_id);
      }
    })();
  }, [editBatchId, token]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!token) return;
    if (!teacherId) {
      setCreateError(t("admin_teacher_pick_required"));
      return;
    }
    if (!courseId) {
      setCreateError(t("admin_batch_course_required"));
      return;
    }
    const name = batchName.trim() || previewName;
    if (!name) {
      setCreateError(t("admin_name_required"));
      return;
    }
    const res = await fetch("/api/admin/batches", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        course_id: courseId,
        teacher_id: teacherId,
        duration,
      }),
    });
    if (!res.ok) {
      setCreateError(t("admin_batches_create_error"));
      return;
    }
    setBatchName("");
    setCourseId("");
    setTeacherId("");
    setDuration(12);
    await loadBatches();
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

  async function handleSaveAssignments() {
    if (!assignBatchId || !token) return;
    const res = await fetch(`/api/admin/batches/${assignBatchId}/students`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ student_ids: Array.from(selectedStudentIds) }),
    });
    if (res.ok) {
      setAssignSaved(true);
      await loadBatches();
    }
  }

  async function handleDeleteBatch(id: string) {
    if (!token) return;
    if (!window.confirm(t("admin_batches_delete_confirm"))) return;
    await fetch(`/api/admin/batches/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (assignBatchId === id) setAssignBatchId("");
    if (editBatchId === id) setEditBatchId(null);
    await loadBatches();
  }

  async function openAttendanceReport(batchId: string) {
    if (!token) return;
    setReportBatchId(batchId);
    setReportLoading(true);
    setReport(null);
    try {
      const res = await fetch(
        `/api/admin/batches/${batchId}/attendance-report`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        current_day?: number;
        by_day?: AttendanceReport["by_day"];
        students?: AttendanceReport["students"];
      };
      if (res.ok && json.success) {
        setReport({
          current_day: json.current_day ?? 1,
          by_day: json.by_day ?? [],
          students: json.students ?? [],
        });
      }
    } finally {
      setReportLoading(false);
    }
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editBatchId || !token) return;
    setEditSaved(false);
    const res = await fetch(`/api/admin/batches/${editBatchId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editName.trim(),
        course_id: editCourseId,
        teacher_id: editTeacherId,
      }),
    });
    if (res.ok) {
      setEditSaved(true);
      await loadBatches();
    }
  }

  const publishedCourses = courses.filter((c) => c.is_published === true);

  const editCourseOptions = useMemo(() => {
    const base = [...publishedCourses];
    const b = batches.find((x) => x.id === editBatchId);
    if (b && !base.some((c) => c.id === b.course_id)) {
      base.unshift({
        id: b.course_id,
        title: b.course_title,
        is_published: true,
      });
    }
    return base;
  }, [publishedCourses, batches, editBatchId]);

  return (
    <div className="space-y-10">
      <p className="text-lg text-neutral-600">{t("admin_classes_batch_hint")}</p>
      {listError ? (
        <p className="text-sm text-accent" role="alert">
          {listError}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden border-2 border-neutral-200/80 p-6 shadow-lg sm:p-8">
          <h2 className="mb-2 text-xl font-bold text-foreground">
            Step 2: {t("admin_classes_create_title")}
          </h2>
          <p className="mb-6 text-sm text-neutral-600">
            {t("admin_batch_create_sub")}
          </p>
          <form onSubmit={handleCreate} className="flex flex-col gap-6">
            <label className="block text-left text-sm font-medium text-neutral-700">
              <span className="mb-2 block">{t("admin_batch_name_label")}</span>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder={previewName || t("admin_classes_preview")}
                className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
              />
            </label>

            <label className="block text-left text-sm font-medium text-neutral-700">
              <span className="mb-2 block">{t("admin_batch_select_course")}</span>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setCreateError(null);
                }}
                className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
              >
                <option value="">{t("admin_course_select_placeholder")}</option>
                {publishedCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>

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
                <p className="mt-1 text-xl font-bold text-primary">
                  {batchName.trim() || previewName}
                </p>
              </div>
            ) : null}

            {createError ? (
              <p className="text-sm text-accent" role="alert">
                {createError}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={teachers.length === 0 || publishedCourses.length === 0}
              className="min-h-14"
            >
              {t("admin_classes_create_btn")}
            </Button>
            {teachers.length === 0 ? (
              <p className="text-center text-sm text-neutral-500">
                {t("admin_add_teacher_first")}
              </p>
            ) : null}
            {publishedCourses.length === 0 ? (
              <p className="text-center text-sm text-neutral-500">
                {t("admin_batch_need_published_course")}
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

          {batches.length === 0 ? (
            <div className="rounded-2xl bg-neutral-50 py-12 text-center text-neutral-500">
              {t("admin_classes_assign_need_class")}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <label className="block text-left text-sm font-medium text-neutral-700">
                <span className="mb-2 block">{t("admin_classes_pick_class")}</span>
                <select
                  value={assignBatchId}
                  onChange={(e) => {
                    setAssignBatchId(e.target.value);
                    setAssignSaved(false);
                  }}
                  className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                >
                  <option value="">{t("admin_classes_select_batch")}</option>
                  {batches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.course_title}
                    </option>
                  ))}
                </select>
              </label>

              {assignBatchId && students.length === 0 ? (
                <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">
                  {t("admin_classes_no_students_for_teacher")}
                </p>
              ) : null}

              {assignBatchId && students.length > 0 ? (
                <ul className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-3 sm:max-h-80">
                  {students.map((s) => {
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

              {assignBatchId ? (
                <Button
                  type="button"
                  onClick={() => void handleSaveAssignments()}
                  disabled={students.length === 0}
                  className="min-h-14"
                >
                  {t("admin_classes_save_assignments")}
                </Button>
              ) : null}

              {assignSaved ? (
                <p className="text-center text-sm font-medium text-primary">
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
        {batches.length === 0 ? (
          <Card
            interactive={false}
            className="border-2 border-dashed border-neutral-200 p-12 text-center text-neutral-500 shadow-none"
          >
            {t("admin_classes_no_classes")}
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {batches.map((c, i) => {
              const tName = teacherName(teachers, c.teacher_id);
              const count = c.student_count;
              const theme = CARD_THEMES[i % CARD_THEMES.length];
              const editing = editBatchId === c.id;
              return (
                <Card
                  key={c.id}
                  className={`relative border-2 ${theme} p-6 shadow-xl sm:p-8`}
                >
                  <button
                    type="button"
                    onClick={() => void handleDeleteBatch(c.id)}
                    className="absolute right-3 top-3 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-white/50 hover:text-accent"
                    aria-label={t("admin_delete_class")}
                  >
                    <TrashIcon />
                  </button>
                  <p className="pr-10 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                    {c.name}
                  </p>
                  <p className="mt-2 text-sm font-medium text-primary">
                    {c.course_title}
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
                          {c.duration} {t("admin_classes_days_short")}
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
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-hidden>
                        📍
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          {t("admin_batch_current_day")}
                        </p>
                        <p className="font-semibold text-foreground">
                          {t("attendance_day_heading").replace(
                            "{n}",
                            String(c.current_day ?? 1),
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-hidden>
                        ✔
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          {t("admin_batch_present_today")}
                        </p>
                        <p className="text-xl font-bold tabular-nums text-foreground">
                          {c.present_today ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6 min-h-12 w-full"
                    onClick={() => void openAttendanceReport(c.id)}
                  >
                    {t("admin_attendance_report")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 min-h-12 w-full"
                    onClick={() => {
                      setEditBatchId(editing ? null : c.id);
                      setEditSaved(false);
                    }}
                  >
                    {editing ? t("admin_batch_close_edit") : t("admin_batch_edit")}
                  </Button>
                  {editing ? (
                    <form
                      onSubmit={(e) => void handleSaveEdit(e)}
                      className="mt-4 space-y-3 rounded-xl border border-neutral-200 bg-white/90 p-4 text-left"
                    >
                      <label className="block text-sm font-medium text-neutral-700">
                        {t("admin_batch_name_label")}
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="mt-1 min-h-12 w-full rounded-lg border border-neutral-300 px-3"
                        />
                      </label>
                      <label className="block text-sm font-medium text-neutral-700">
                        {t("admin_batch_select_course")}
                        <select
                          value={editCourseId}
                          onChange={(e) => setEditCourseId(e.target.value)}
                          className="mt-1 min-h-12 w-full rounded-lg border border-neutral-300 px-3"
                        >
                          {editCourseOptions.map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm font-medium text-neutral-700">
                        {t("admin_assign_teacher")}
                        <select
                          value={editTeacherId}
                          onChange={(e) => setEditTeacherId(e.target.value)}
                          className="mt-1 min-h-12 w-full rounded-lg border border-neutral-300 px-3"
                        >
                          {teachers.map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button type="submit" className="min-h-12 w-full">
                        {t("admin_course_save")}
                      </Button>
                      {editSaved ? (
                        <p className="text-center text-sm text-primary">
                          {t("admin_classes_assign_saved")}
                        </p>
                      ) : null}
                    </form>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {reportBatchId ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl sm:p-8">
            <h3 className="text-xl font-bold">{t("admin_attendance_report")}</h3>
            {reportLoading ? (
              <p className="mt-4 text-neutral-500">{t("course_player_loading")}</p>
            ) : report ? (
              <div className="mt-4 space-y-6 text-sm">
                <p className="font-medium text-foreground">
                  {t("admin_batch_current_day")}:{" "}
                  {t("attendance_day_heading").replace(
                    "{n}",
                    String(report.current_day),
                  )}
                </p>
                <div>
                  <p className="mb-2 font-semibold text-neutral-800">
                    {t("admin_attendance_summary")}
                  </p>
                  <ul className="space-y-2">
                    {report.students.map((s) => (
                      <li
                        key={s.student_id}
                        className="rounded-lg border border-neutral-200 px-3 py-2"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-2 text-neutral-600">
                          {s.attended_label} {t("admin_attendance_days_suffix")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 font-semibold text-neutral-800">
                    {t("admin_attendance_by_day")}
                  </p>
                  <ul className="space-y-3">
                    {report.by_day.map((d) => (
                      <li
                        key={d.day_number}
                        className="rounded-lg bg-neutral-50 px-3 py-2"
                      >
                        <p className="font-semibold">
                          {t("class_day")} {d.day_number}
                        </p>
                        {d.records.length === 0 ? (
                          <p className="text-xs text-neutral-500">—</p>
                        ) : (
                          <ul className="mt-1 text-xs text-neutral-700">
                            {d.records.map((r) => (
                              <li key={r.student_id}>
                                {reportStudentNameById.get(r.student_id) ??
                                  r.student_id}
                                {" · "}
                                {r.status}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-accent">{t("admin_batches_load_error")}</p>
            )}
            <Button
              type="button"
              variant="outline"
              className="mt-6 min-h-12 w-full"
              onClick={() => {
                setReportBatchId(null);
                setReport(null);
              }}
            >
              {t("admin_attendance_close")}
            </Button>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
