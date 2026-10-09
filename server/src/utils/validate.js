// Whole digits (max 10) with at most 2 decimals. Rejects negatives, "1e3", "abc".
const AMOUNT_RE = /^\d{1,10}(\.\d{1,2})?$/;

export function validateParticipant(body = {}) {
  const errors = {};

  const name =
    typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (!name) errors.name = "Name is required";
  else if (name.length > 120) errors.name = "Name must be 120 characters or fewer";

  let raw = body.amount_paid;
  if (raw === undefined || raw === null || raw === "") raw = "0";
  const str = String(raw).trim();

  let amount_paid = 0;
  if (!AMOUNT_RE.test(str)) {
    errors.amount_paid = "Amount paid must be zero or a positive number (max 2 decimals)";
  } else {
    amount_paid = str; // keep as string; Postgres NUMERIC parses it exactly
  }

  return { errors, value: { name, amount_paid } };
}
