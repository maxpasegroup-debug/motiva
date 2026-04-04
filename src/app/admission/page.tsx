import { Suspense } from "react";
import { AdmissionPageContent } from "@/components/views/AdmissionPage";

export default function AdmissionPage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-16 text-center text-neutral-500">
          Loading…
        </p>
      }
    >
      <AdmissionPageContent />
    </Suspense>
  );
}
