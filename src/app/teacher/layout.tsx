import { TeacherShell } from "@/components/layout/TeacherShell";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TeacherShell>
      <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        {children}
      </div>
    </TeacherShell>
  );
}
