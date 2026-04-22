import type { Metadata } from "next";
import { TeacherProfileForm } from "@/components/admin/TeacherProfileForm";

type Props = { params: { id: string } };

export const metadata: Metadata = {
  title: "Edit teacher — Motiva Edus",
};

export default function Page({ params }: Props) {
  return <TeacherProfileForm mode="edit" teacherId={params.id} />;
}
