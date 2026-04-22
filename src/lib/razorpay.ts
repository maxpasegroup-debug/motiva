import crypto from "crypto";
import Razorpay from "razorpay";

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }

  return { keyId, keySecret };
}

let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance() {
  if (!razorpayInstance) {
    const credentials = getRazorpayCredentials();
    razorpayInstance = new Razorpay({
      key_id: credentials.keyId,
      key_secret: credentials.keySecret,
    });
  }
  return razorpayInstance;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const { keySecret } = getRazorpayCredentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop, receiver) {
    const instance = getRazorpayInstance();
    return Reflect.get(instance, prop, receiver);
  },
});

export default razorpay;
