const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// ₹1,500 / ₹25,000 / ₹1,50,000
export const formatINR = (n) => inr.format(Number(n) || 0).replace(/\s/g, "");

// 1,500 (no symbol) - used in the PDF table whose header already says (₹)
export const formatNumber = (n) => plain.format(Number(n) || 0);

// Sum money safely in paise (integers) to avoid 0.1 + 0.2 style float errors.
export const sumAmounts = (list) =>
  list.reduce((acc, n) => acc + Math.round((Number(n) || 0) * 100), 0) / 100;

// Same rule as the server: up to 10 digits and at most 2 decimals, never negative.
const AMOUNT_RE = /^\d{1,10}(\.\d{1,2})?$/;

export function validateForm({ name, amount }) {
  const errors = {};
  const cleanName = name.trim().replace(/\s+/g, " ");
  if (!cleanName) errors.name = "Name is required";
  else if (cleanName.length > 120) errors.name = "Name must be 120 characters or fewer";

  const amt = amount.trim() === "" ? "0" : amount.trim();
  if (!AMOUNT_RE.test(amt)) errors.amount_paid = "Enter 0 or a positive amount (max 2 decimals)";

  return { errors, value: { name: cleanName, amount_paid: amt } };
}
