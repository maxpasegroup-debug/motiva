/** WhatsApp business number: country code, no + or spaces. */
export const WHATSAPP_NUMBER = process.env.WHATSAPP_CONTACT_NUMBER ?? "919946930723";

export function whatsappHref(text?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text.trim())}`;
}
