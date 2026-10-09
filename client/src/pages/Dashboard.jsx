import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  IndianRupee,
  Search,
  X,
  Plus,
  FileDown,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import StatCard from "../components/StatCard.jsx";
import ParticipantList from "../components/ParticipantList.jsx";
import ParticipantModal from "../components/ParticipantModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { ToastStack, useToasts } from "../components/Toast.jsx";
import * as api from "../services/api.js";
import { formatINR } from "../utils/format.js";
import { matchesSearch } from "../utils/malayalamSearch.js";

export default function Dashboard() {
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({
    total_participants: 0,
    total_collected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ open: false, participant: null });
  const [toDelete, setToDelete] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const toast = useToasts();
  const alive = useRef(true);

  // Loads the table and the dashboard totals together (both come from PostgreSQL).
  const refresh = useCallback(async (signal) => {
    const [list, dash] = await Promise.all([
      api.getParticipants(signal),
      api.getDashboard(signal),
    ]);
    if (!Array.isArray(list) || typeof dash?.total_participants !== "number") {
      throw new Error("Invalid response from server");
    }
    setParticipants(list);
    setStats(dash);
  }, []);

  const initialLoad = useCallback(
    async (signal) => {
      setLoading(true);
      setLoadError("");
      try {
        await refresh(signal);
      } catch (err) {
        if (signal?.aborted) return;
        setLoadError(err.message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [refresh],
  );

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    initialLoad(controller.signal);
    return () => {
      alive.current = false;
      controller.abort();
    };
  }, [initialLoad]);

  // After a successful change, re-sync everything from the database.
  const resync = useCallback(async () => {
    try {
      await refresh();
    } catch (err) {
      if (alive.current)
        toast.error(`Saved, but could not refresh: ${err.message}`);
    }
  }, [refresh, toast]);

  async function handleSave(value) {
    const editing = modal.participant;
    if (editing) await api.updateParticipant(editing.id, value);
    else await api.createParticipant(value);
    setModal({ open: false, participant: null });
    toast.success(editing ? "Participant updated" : "Participant added");
    await resync();
  }

  // Inline amount box in the list: saves, then re-syncs the totals in the background.
  async function handleSaveAmount(p, amount) {
    await api.updateParticipant(p.id, { name: p.name, amount_paid: amount });
    resync();
  }

  async function handleDelete(p) {
    await api.deleteParticipant(p.id);
    setToDelete(null);
    toast.success("Participant deleted");
    await resync();
  }

  async function handlePdf() {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      // Fetch a fresh, complete list so the PDF always matches the database,
      // regardless of the current search box.
      const [{ generateReport }, fresh] = await Promise.all([
        import("../utils/pdf.js"),
        api.getParticipants(),
      ]);
      await generateReport(fresh);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(err.message || "Could not create the PDF");
    } finally {
      if (alive.current) setPdfBusy(false);
    }
  }

  const visible = useMemo(() => {
    // Works with Malayalam or English (Manglish) typing.
    const q = search.trim();
    return q
      ? participants.filter((p) => matchesSearch(p.name, q))
      : participants;
  }, [participants, search]);

  const openAdd = () => setModal({ open: true, participant: null });
  const closeModal = useCallback(
    () => setModal((m) => ({ ...m, open: false })),
    [],
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="mx-auto -mt-10 w-full max-w-2xl flex-1 px-4 pb-28">
        <section className="grid grid-cols-2 gap-3" aria-label="Summary">
          <StatCard
            icon={Users}
            label="Participants"
            value={stats.total_participants}
            loading={loading}
          />
          <StatCard
            icon={IndianRupee}
            label="Total collected"
            value={formatINR(stats.total_collected)}
            loading={loading}
          />
        </section>

        <button
          onClick={handlePdf}
          disabled={pdfBusy || loading || Boolean(loadError)}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-green-700 bg-white font-medium text-green-800 shadow-sm transition active:bg-green-50 disabled:opacity-60"
        >
          {pdfBusy ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <FileDown size={18} aria-hidden="true" />
          )}
          {pdfBusy ? "Preparing PDF…" : "Download PDF Report"}
        </button>

        <div className="sticky top-0 z-20 -mx-4 mt-3 bg-slate-50/95 px-4 py-2 backdrop-blur">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name (മലയാളം / English)"
              aria-label="Search participants by name in Malayalam or English"
              autoComplete="off"
              className="block w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-11 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-200 [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-slate-400 active:bg-slate-100"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-2">
          {loading ? (
            <ul
              className="space-y-2"
              aria-busy="true"
              aria-label="Loading participants"
            >
              {[0, 1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="h-[64px] animate-pulse rounded-2xl bg-white ring-1 ring-slate-100"
                />
              ))}
            </ul>
          ) : loadError ? (
            <div
              className="rounded-2xl bg-white px-6 py-10 text-center shadow-sm ring-1 ring-slate-100"
              role="alert"
            >
              <p className="font-medium text-red-700">Could not load data</p>
              <p className="mt-1 text-sm text-slate-500">{loadError}</p>
              <button
                onClick={() => initialLoad()}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-green-700 px-5 font-medium text-white active:bg-green-800"
              >
                <RefreshCw size={16} aria-hidden="true" /> Try again
              </button>
            </div>
          ) : (
            <ParticipantList
              participants={visible}
              totalCount={participants.length}
              searching={Boolean(search.trim())}
              onEdit={(p) => setModal({ open: true, participant: p })}
              onDelete={setToDelete}
              onAdd={openAdd}
              onSaveAmount={handleSaveAmount}
            />
          )}
        </div>

        <Footer />
      </main>

      {!loadError && (
        <button
          onClick={openAdd}
          className="fixed right-4 z-30 flex min-h-14 items-center gap-2 rounded-full bg-green-700 px-5 font-medium text-white shadow-lg shadow-green-900/20 transition active:scale-95 active:bg-green-800 bottom-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <Plus size={20} aria-hidden="true" />
          Add participant
        </button>
      )}

      <ParticipantModal
        open={modal.open}
        participant={modal.participant}
        onClose={closeModal}
        onSubmit={handleSave}
      />
      <ConfirmDialog
        participant={toDelete}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
      <ToastStack toasts={toast.toasts} />
    </div>
  );
}
