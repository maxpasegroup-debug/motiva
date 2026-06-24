import type { Metadata } from "next";
import { AdminTeachersManagerPage } from "@/components/admin/AdminTeachersManagerPage";

export const metadata: Metadata = {
  title: "Teachers — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <AdminTeachersManagerPage />;
}
