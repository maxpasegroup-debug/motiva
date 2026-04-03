"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  getDayAttendance,
  todayYmdLocal,
  toggleStudentPresent,
} from "@/lib/attendance-store";
import { listClasses, type ClassRecord } from "@/lib/classes-store";
import { listStudents } from "@/lib/students-store";
import { TeacherBackLink } from "@/components/views/TeacherSubPageLayout";

export function TeacherAttendancePage() {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [classId, setClassId] = useState("");
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>({});
  const [, setUsersTick] = useState(0);
  const dateYmd = todayYmdLocal();

  const refreshClasses = useCallback(() => {
    setClasses(listClasses());
  }, []);

  useEffect(() => {
    refreshClasses();
  }, [refreshClasses]);

  useEffect(() => {
    function onUsersUpdated() {
      setUsersTick((x) => x + 1);
    }
    window.addEventListener("motiva-users-updated", onUsersUpdated);
    return () =>
      window.removeEventListener("motiva-users-updated", onUsersUpdated);
  }, []);

  const selected = classes.find((c) => c.id === classId) ?? null;

  useEffect(() => {
    if (!classId) {
      setPresentMap({});
      return;
    }
    setPresentMap(getDayAttendance(classId, dateYmd));
  }, [classId, dateYmd]);

  function handleToggle(studentId: string) {
    if (!classId) return;
    toggleStudentPresent(classId, dateYmd, studentId);
    setPresentMap(getDayAttendance(classId, dateYmd));
  }

  const studentsInClass = selected
    ? listStudents().filter((s) => selected.studentIds.includes(s.id))
    : [];

  return (
    <div className="space-y-8">
      <TeacherBackLink />
      <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
        {t("teacher_nav_attendance")}
      </h1>

      <Card className="p-6 shadow-md sm:p-8">
        <p className="mb-4 text-center text-sm font-medium text-neutral-600">
          {t("teacher_attendance_date_label")}:{" "}
          <span className="font-semibold text-foreground">{dateYmd}</span>
        </p>
        <label className="block text-left text-sm font-medium text-neutral-700">
          <span className="mb-2 block">{t("teacher_attendance_batch_label")}</span>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
          >
            <option value="">{t("teacher_attendance_select_batch")}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {!classId ? (
        <p className="text-center text-sm text-neutral-500">
          {t("teacher_attendance_pick_class")}
        </p>
      ) : studentsInClass.length === 0 ? (
        <Card className="p-8 text-center text-neutral-500 shadow-md">
          {t("teacher_attendance_no_students")}
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {studentsInClass.map((s) => {
            const on = presentMap[s.id] === true;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleToggle(s.id)}
                  className={`flex min-h-[160px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 p-8 text-center shadow-md transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[180px] ${
                    on
                      ? "border-primary bg-primary/[0.08]"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <span
                    className="text-5xl leading-none sm:text-6xl"
                    aria-hidden
                  >
                    {on ? "✔" : "○"}
                  </span>
                  <span className="text-lg font-semibold text-foreground sm:text-xl">
                    {s.name}
                  </span>
                  <span className="text-xs font-medium text-neutral-500">
                    {t("teacher_attendance_tap")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
