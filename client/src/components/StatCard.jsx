export default function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-green-50 text-green-700">
          <Icon size={16} aria-hidden="true" />
        </span>
        <span>{label}</span>
      </div>
      {loading ? (
        <div className="mt-3 h-7 w-24 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      )}
    </div>
  );
}
