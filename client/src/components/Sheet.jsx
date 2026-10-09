import { useEffect } from "react";

// Bottom sheet on phones, centred dialog on larger screens.
export default function Sheet({ open, onClose, title, children, busy = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="animate-fade-in absolute inset-0 bg-slate-900/50"
        onClick={() => !busy && onClose()}
      />
      <div className="animate-sheet-up sm:animate-pop-in relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pt-3 shadow-xl sm:max-w-md sm:rounded-2xl sm:pt-5 pb-safe">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
