export default function RefundPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-neutral-900">Refund Policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-neutral-700">
        This policy describes how refunds are handled for Motiva Edus services.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Recorded Courses</h2>
        <p className="text-sm text-neutral-700">
          Recorded courses are eligible for refund within 7 days from purchase,
          provided no substantial completion or misuse is detected.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Tuition and Batch Programs</h2>
        <p className="text-sm text-neutral-700">
          For one-to-one tuition and remedial batches, no refund is available after
          the batch has started.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">How to Request</h2>
        <p className="text-sm text-neutral-700">
          Contact our support team with your name, registered mobile number, and
          payment details. Eligible refunds are processed to the original payment
          method within reasonable processing timelines.
        </p>
      </section>
    </main>
  );
}
