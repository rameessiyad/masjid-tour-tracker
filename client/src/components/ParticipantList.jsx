import { useEffect, useRef, useState } from "react";
import {
  Pencil,
  Trash2,
  UserPlus,
  SearchX,
  Loader2,
  Check,
} from "lucide-react";
import { validateForm } from "../utils/format.js";

// Amount box shown against every name. Type an amount, then press Done/Enter or
// tap anywhere else: it is saved to the database straight away.
function AmountField({ participant, onSaveAmount }) {
  const [value, setValue] = useState(String(participant.amount_paid));
  const [status, setStatus] = useState("idle"); // idle | saving | saved
  const [error, setError] = useState("");
  const savingRef = useRef(false);
  const timer = useRef(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  // Follow the database value (after a refresh, or after editing in the form).
  useEffect(() => {
    setValue(String(participant.amount_paid));
    setError("");
  }, [participant.amount_paid]);

  async function commit() {
    if (savingRef.current) return;
    const { errors, value: clean } = validateForm({
      name: participant.name,
      amount: value,
    });
    if (errors.amount_paid) {
      setError(errors.amount_paid);
      return;
    }
    if (Number(clean.amount_paid) === participant.amount_paid) {
      setValue(String(participant.amount_paid)); // tidy things like "1500." or ""
      setError("");
      return;
    }

    savingRef.current = true;
    setStatus("saving");
    setError("");
    try {
      await onSaveAmount(participant, clean.amount_paid);
      if (!alive.current) return;
      setStatus("saved");
      timer.current = setTimeout(
        () => alive.current && setStatus("idle"),
        1500,
      );
    } catch (err) {
      if (!alive.current) return;
      setStatus("idle");
      setError(err.message);
    } finally {
      savingRef.current = false;
    }
  }

  // Digits and a single decimal point (max 2 decimals) only.
  function handleChange(e) {
    let v = e.target.value.replace(/[^\d.]/g, "");
    const dot = v.indexOf(".");
    if (dot !== -1)
      v =
        v.slice(0, dot + 1) +
        v
          .slice(dot + 1)
          .replace(/\./g, "")
          .slice(0, 2);
    setValue(v);
    if (error) setError("");
  }

  const paid = participant.amount_paid > 0;

  return (
    <div>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        >
          ₹
        </span>
        <input
          value={value}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          placeholder="0"
          aria-label={`Amount paid by ${participant.name}`}
          className={`h-11 w-full rounded-xl border bg-white pl-8 pr-10 outline-none transition focus:ring-2 ${
            error
              ? "border-red-400 focus:ring-red-200"
              : "border-slate-300 focus:border-green-600 focus:ring-green-200"
          } ${paid ? "font-medium text-green-800" : "text-slate-500"}`}
        />
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2"
          aria-live="polite"
        >
          {status === "saving" && (
            <Loader2
              size={18}
              className="animate-spin text-slate-400"
              aria-label="Saving"
            />
          )}
          {status === "saved" && (
            <Check size={18} className="text-green-600" aria-label="Saved" />
          )}
        </span>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ParticipantList({
  participants,
  totalCount,
  searching,
  onEdit,
  onDelete,
  onAdd,
  onSaveAmount,
}) {
  if (participants.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-100">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-700">
          {searching ? (
            <SearchX size={22} aria-hidden="true" />
          ) : (
            <UserPlus size={22} aria-hidden="true" />
          )}
        </div>
        <p className="mt-3 font-medium">
          {searching ? "No matching participants" : "No participants yet"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {searching
            ? "Try a different name."
            : "Add your first participant to start tracking payments."}
        </p>
        {!searching && totalCount === 0 && (
          <button
            onClick={onAdd}
            className="mt-4 min-h-11 rounded-xl bg-green-700 px-5 font-medium text-white transition active:bg-green-800"
          >
            Add participant
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {participants.map((p, i) => (
        <li
          key={p.id}
          className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-50 text-sm font-semibold text-green-700">
              {i + 1}
            </span>
            <p className="min-w-0 flex-1 break-words font-medium leading-snug">
              {p.name}
            </p>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => onEdit(p)}
                aria-label={`Edit ${p.name}`}
                className="grid h-11 w-11 place-items-center rounded-xl text-slate-600 transition active:bg-slate-100"
              >
                <Pencil size={18} aria-hidden="true" />
              </button>
              <button
                onClick={() => onDelete(p)}
                aria-label={`Delete ${p.name}`}
                className="grid h-11 w-11 place-items-center rounded-xl text-red-600 transition active:bg-red-50"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="mt-2 pl-12">
            <AmountField participant={p} onSaveAmount={onSaveAmount} />
          </div>
        </li>
      ))}
    </ul>
  );
}
