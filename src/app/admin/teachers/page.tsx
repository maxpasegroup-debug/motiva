import type { Metadata } from "next";
import { AdminTeachersPage } from "@/components/admin/AdminTeachersPage";

export const metadata: Metadata = {
  title: "Teachers — Motiva Edus",
};

export default function Page() {
  return <AdminTeachersPage />;
}
