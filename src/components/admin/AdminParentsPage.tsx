"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { listStudents } from "@/lib/students-store";
import {
  listStudentProfiles,
  type StudentAdminProfile,
} from "@/lib/student-profiles-store";
import { listUsersByRole } from "@/lib/users-store";

type Row = {
  parentId: string;
  parentName: string;
  parentEmail: string;
  phone: string;
  children: { studentId: string; name: string }[];
};

function buildRows(): Row[] {
  const parents = listUsersByRole("parent");
  const profiles = listStudentProfiles();
  const nameByStudent = new Map(
    listStudents().map((s) => [s.id, s.name] as const),
  );
  const byParent = new Map<string, StudentAdminProfile[]>();
  for (const p of profiles) {
    if (!p.parentUserId) continue;
    const list = byParent.get(p.parentUserId) ?? [];
    list.push(p);
    byParent.set(p.parentUserId, list);
  }

  return parents.map((u) => {
    const linked = byParent.get(u.id) ?? [];
    return {
      parentId: u.id,
      parentName: u.name,
      parentEmail: u.email,
      phone: linked[0]?.parentPhone ?? "—",
      children: linked.map((p) => ({
        studentId: p.studentId,
        name: nameByStudent.get(p.studentId) ?? p.studentId,
      })),
    };
  });
}

export function AdminParentsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    function load() {
      setRows(buildRows());
    }
    load();
    window.addEventListener("motiva-users-updated", load);
    window.addEventListener("motiva-student-profiles-updated", load);
    return () => {
      window.removeEventListener("motiva-users-updated", load);
      window.removeEventListener("motiva-student-profiles-updated", load);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-lg text-neutral-600">{t("admin_parents_sub")}</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white py-12 text-center text-neutral-500">
          {t("admin_parents_empty")}
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.parentId}>
              <Card className="p-6">
                <p className="text-lg font-bold text-foreground">{r.parentName}</p>
                <p className="text-sm text-neutral-600">{r.parentEmail}</p>
                <p className="text-sm text-neutral-600">
                  {t("admin_parents_phone")}: {r.phone}
                </p>
                <p className="mt-3 font-semibold text-foreground">
                  {t("admin_parents_child")}:
                </p>
                <ul className="mt-1 list-inside list-disc text-neutral-700">
                  {r.children.length === 0 ? (
                    <li className="list-none text-neutral-500">—</li>
                  ) : (
                    r.children.map((c) => (
                      <li key={c.studentId}>{c.name}</li>
                    ))
                  )}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
