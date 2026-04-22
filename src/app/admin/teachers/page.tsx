import type { Metadata } from "next";
import { AdminTeachersManagerPage } from "@/components/admin/AdminTeachersManagerPage";

export const metadata: Metadata = {
  title: "Teachers — Motiva Edus",
};

export default function Page() {
  return <AdminTeachersManagerPage />;
}
