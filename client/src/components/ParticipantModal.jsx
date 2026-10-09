import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Sheet from "./Sheet.jsx";
import { validateForm } from "../utils/format.js";

// participant === null  -> Add mode;  participant object -> Edit mode
export default function ParticipantModal({ open, participant, onClose, onSubmit }) {
  const isEdit = Boolean(participant);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Reset the form each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setName(participant?.name ?? "");
    setAmount(participant ? String(participant.amount_paid) : "0");
    setErrors({});
    setSaving(false);
    const t = setTimeout(() => nameRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [open, participant]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return; // blocks double taps
    const { errors: errs, value } = validateForm({ name, amount });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await onSubmit(value);
    } catch (err) {
      if (alive.current) {
        setErrors({ ...(err.fieldErrors || {}), form: err.message });
        setSaving(false);
      }
    }
  }

  // Digits and a single decimal point only.
  function handleAmount(e) {
    let v = e.target.value.replace(/[^\d.]/g, "");
    const dot = v.indexOf(".");
    if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, "").slice(0, 2);
    setAmount(v);
  }

  const inputCls = (bad) =>
    `mt-1 block w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
      bad ? "border-red-400 focus:ring-red-200" : "border-slate-300 focus:border-green-600 focus:ring-green-200"
    }`;

  return (
    <Sheet open={open} onClose={onClose} busy={saving} title={isEdit ? "Edit participant" : "Add participant"}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            autoComplete="off"
            autoCapitalize="words"
            placeholder="Participant name"
            className={inputCls(errors.name)}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="amount" className="text-sm font-medium text-slate-700">
            Amount paid (₹)
          </label>
          <input
            id="amount"
            value={amount}
            onChange={handleAmount}
            onFocus={(e) => e.target.select()}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            className={inputCls(errors.amount_paid)}
          />
          {errors.amount_paid && <p className="mt-1 text-sm text-red-600">{errors.amount_paid}</p>}
        </div>

        {errors.form && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errors.form}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-12 rounded-xl border border-slate-300 font-medium text-slate-700 transition active:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-700 font-medium text-white transition active:bg-green-800 disabled:opacity-70"
          >
            {saving && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add participant"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
