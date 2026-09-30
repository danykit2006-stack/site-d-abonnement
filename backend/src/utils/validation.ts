export const validEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);
export const normalizePhone = (phone: string) => {
  const digits = phone.replace(/^\+243/, "");
  if (!/^\d{9}$/.test(digits)) return null;
  return `+243${digits}`;
};

export const isoAfterDays = (start: Date, days: number) => {
  const expiry = new Date(start);
  expiry.setUTCDate(expiry.getUTCDate() + days);
  return expiry.toISOString();
};