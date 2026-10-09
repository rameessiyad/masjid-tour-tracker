import { useCallback, useRef, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const push = useCallback((type, message) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return { toasts, success: (m) => push("success", m), error: (m) => push("error", m) };
}

export function ToastStack({ toasts }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-pop-in pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-xl px-4 py-3 text-sm text-white shadow-lg ${
            t.type === "success" ? "bg-green-700" : "bg-red-600"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
