"use client";

import { useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type Props = {
  leadId: string;
  studentName: string;
  mobile: string;
  defaultAmount?: number;
  onSuccess?: () => void;
};

function normalizeMobile(value: string) {
  return value.replace(/\D/g, "");
}

async function loadRazorpayScript() {
  if (window.Razorpay) return true;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });

  return Boolean(window.Razorpay);
}

export function PaymentButton({
  leadId,
  studentName,
  mobile,
  defaultAmount,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState(
    defaultAmount && defaultAmount > 0 ? String(defaultAmount) : "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePayNow() {
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Enter a valid amount.");
      setMessage(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          amount: amountValue,
        }),
      });

      const orderJson = (await orderRes.json().catch(() => null)) as
        | {
            error?: string;
            orderId?: string;
            amount?: number;
            currency?: string;
            keyId?: string;
          }
        | null;

      if (
        !orderRes.ok ||
        !orderJson?.orderId ||
        !orderJson.amount ||
        !orderJson.currency ||
        !orderJson.keyId
      ) {
        throw new Error(orderJson?.error ?? "Could not create payment order");
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Could not load Razorpay checkout");
      }

      const razorpay = new window.Razorpay({
        key: orderJson.keyId,
        amount: orderJson.amount,
        currency: orderJson.currency,
        order_id: orderJson.orderId,
        name: "Motiva Edus",
        description: "Admission Fee",
        prefill: {
          name: studentName,
          contact: normalizeMobile(mobile),
        },
        theme: { color: "#0B5ED7" },
        handler: async (response: Record<string, unknown>) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                leadId,
              }),
            });

            const verifyJson = (await verifyRes.json().catch(() => null)) as
              | { error?: string; success?: boolean }
              | null;

            if (!verifyRes.ok || !verifyJson?.success) {
              throw new Error(verifyJson?.error ?? "Payment verification failed");
            }

            setMessage("Payment confirmed!");
            setError(null);
            onSuccess?.();
          } catch (verifyError) {
            setError(
              verifyError instanceof Error
                ? verifyError.message
                : "Payment verification failed",
            );
            setMessage(null);
          } finally {
            setIsLoading(false);
          }
        },
      });

      setIsLoading(false);
      razorpay.open();
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Payment could not be processed",
      );
      setMessage(null);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <label className="text-sm font-medium text-neutral-700">
        Amount (INR)
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
        />
      </label>

      <button
        type="button"
        disabled={isLoading}
        onClick={() => void handlePayNow()}
        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </button>

      {message ? <p className="text-sm font-medium text-green-600">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
