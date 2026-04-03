"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { listClasses } from "@/lib/classes-store";
import { listStudents, type StudentRecord } from "@/lib/students-store";
import { listTeachers } from "@/lib/teachers-store";
import { TeacherBackLink } from "@/components/views/TeacherSubPageLayout";

type Enriched = StudentRecord & { batchNames: string; teacherNames: string };

export function TeacherStudentsPage() {
  const { t } = useLanguage();
  const [usersTick, setUsersTick] = useState(0);

  function whatsappHrefFromStudent(student: StudentRecord) {
    // We don't currently store a dedicated phone field in the UI.
    // For legacy records, `email` was derived from mobile digits.
    const digits = student.email.replace(/[^0-9]/g, "");
    if (!digits) return null;
    const phone = digits.startsWith("91") ? digits : `91${digits}`;
    return `https://wa.me/${phone}`;
  }

  useEffect(() => {
    function onUsersUpdated() {
      setUsersTick((x) => x + 1);
    }
    window.addEventListener("motiva-users-updated", onUsersUpdated);
    return () =>
      window.removeEventListener("motiva-users-updated", onUsersUpdated);
  }, []);

  const students = useMemo(() => {
    void usersTick; // ensures recompute when the users mirror hydrates
    const classes = listClasses();
    const teachers = listTeachers();
    const teacherById = new Map(teachers.map((x) => [x.id, x.name] as const));
    const idSet = new Set<string>();
    for (const c of classes) {
      for (const sid of c.studentIds) idSet.add(sid);
    }
    const byId = new Map(listStudents().map((s) => [s.id, s] as const));
    const out: Enriched[] = [];
    for (const sid of Array.from(idSet)) {
      const s = byId.get(sid);
      if (!s) continue;
      const inClasses = classes.filter((c) => c.studentIds.includes(sid));
      const names = inClasses.map((c) => c.name).join(", ");
      const tnames = Array.from(
        new Set(
          inClasses
            .map((c) => teacherById.get(c.teacherId))
            .filter((n): n is string => Boolean(n)),
        ),
      ).join(", ");
      out.push({
        ...s,
        batchNames: names || "—",
        teacherNames: tnames || "—",
      });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [usersTick]);

  return (
    <div className="space-y-8">
      <TeacherBackLink />
      <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
        {t("teacher_nav_students")}
      </h1>

      {students.length === 0 ? (
        <Card className="p-8 text-center text-neutral-500 shadow-md">
          {t("teacher_no_students_in_batches")}
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {students.map((s) => (
            <li key={s.id}>
              <Card className="flex min-h-[140px] flex-col justify-center gap-2 p-6 shadow-md sm:p-8">
                <p className="text-xl font-bold text-foreground">{s.name}</p>
                <p className="text-base text-neutral-600">{s.email}</p>
                <p className="text-sm text-neutral-500">
                  <span className="font-medium text-neutral-600">
                    {t("teacher_student_teacher_label")}:{" "}
                  </span>
                  {s.teacherNames}
                </p>
                <p className="text-sm text-neutral-500">
                  <span className="font-medium text-neutral-600">
                    {t("teacher_student_batches_label")}:{" "}
                  </span>
                  {s.batchNames}
                </p>
                {whatsappHrefFromStudent(s) ? (
                  <a
                    href={whatsappHrefFromStudent(s) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 active:bg-primary/85"
                  >
                    Contact Student on WhatsApp
                  </a>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
