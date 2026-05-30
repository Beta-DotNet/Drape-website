export function normalizePhoneToWa(phone: string): string {
  // WhatsApp expects digits only.
  // Remove + and whitespace; then strip any non-digits.
  const digitsOnly = phone.replace(/\+/g, "").replace(/\s+/g, "").replace(/[^0-9]/g, "");
  return digitsOnly;
}

export function buildWhatsAppUrl(phone: string, text?: string): string {
  const normalized = normalizePhoneToWa(phone);
  if (!normalized) {
    throw new Error("Invalid WhatsApp phone number");
  }

  const base = `https://wa.me/${normalized}`;
  if (!text || !text.trim()) return base;

  const params = new URLSearchParams({ text: text.trim() });
  return `${base}?${params.toString()}`;
}

