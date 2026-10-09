import { useState } from "react";
import { Loader2 } from "lucide-react";
import Sheet from "./Sheet.jsx";
import { formatINR } from "../utils/format.js";

export default function ConfirmDialog({ participant, onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm(participant);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Sheet open={Boolean(participant)} onClose={onCancel} busy={busy} title="Delete participant?">
      {participant && (
        <div className="space-y-4">
          <p className="text-slate-600">
            <span className="font-semibold text-slate-900">{participant.name}</span>{" "}
            ({formatINR(participant.amount_paid)} paid) will be removed permanently. This cannot be undone.
          </p>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              disabled={busy}
              className="min-h-12 rounded-xl border border-slate-300 font-medium text-slate-700 transition active:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              disabled={busy}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 font-medium text-white transition active:bg-red-700 disabled:opacity-70"
            >
              {busy && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
