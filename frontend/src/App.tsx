import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { read, write, CONTRACT } from "./genlayer";

type Sport = "Football" | "Basketball" | "Tennis" | "MMA" | "Cricket";

interface Option {
  label: string;
  odds: number; // implied probability %
}

interface Market {
  key: string;
  sport: Sport;
  question: string;
  pool: number; // total staked (local cosmetic)
  options: Option[];
  resolved: boolean;
  winningIndex: number | null;
  winningLabel?: string;
  reasoning?: string;
}

interface Selection {
  market: Market;
  optionIndex: number;
}

const SPORTS: Sport[] = ["Football", "Basketball", "Tennis", "MMA", "Cricket"];

const fmt = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

// Normalise the on-chain options payload (string JSON or array of strings/objects)
function normalizeOptions(raw: any): Option[] {
  let arr: any = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      arr = [raw];
    }
  }
  if (!Array.isArray(arr)) arr = [];
  const n = arr.length || 1;
  const odds = Math.round(100 / n);
  return arr.map((o: any) => ({
    label: typeof o === "string" ? o : String(o?.label ?? o),
    odds,
  }));
}

function App() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filter, setFilter] = useState<Sport | "All">("All");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [stake, setStake] = useState("");
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    sport: "Football" as Sport,
    question: "",
    optA: "",
    optB: "",
  });

  const visible = useMemo(
    () => markets.filter((m) => filter === "All" || m.sport === filter),
    [markets, filter]
  );

  async function loadMarkets() {
    setLoading(true);
    try {
      const stats = (await read("stats")) as any;
      const total = Number(stats?.total_markets ?? 0);
      const loaded: Market[] = [];
      for (let i = 0; i < total; i++) {
        try {
          const m = (await read("get_market", [String(i)])) as any;
          if (!m) continue;
          loaded.push({
            key: String(i),
            sport: (m.sport ?? "Football") as Sport,
            question: m.question ?? "",
            pool: 0,
            options: normalizeOptions(m.options),
            resolved: Boolean(m.resolved),
            winningIndex:
              m.winning_index === null || m.winning_index === undefined
                ? null
                : Number(m.winning_index),
          });
        } catch {
          // skip unreadable market
        }
      }
      setMarkets(loaded.reverse());
    } catch (e: any) {
      toast.error(`Failed to load markets: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarkets();
  }, []);

  const openSlip = (market: Market, optionIndex: number) => {
    setSelection({ market, optionIndex });
    setStake("");
  };

  const placeBet = () => {
    const amt = Number(stake);
    if (!selection || !amt || amt <= 0) {
      toast.error("Enter a stake amount.");
      return;
    }
    const opt = selection.market.options[selection.optionIndex];
    setMarkets((ms) =>
      ms.map((m) =>
        m.key === selection.market.key ? { ...m, pool: m.pool + amt } : m
      )
    );
    toast.success(
      `Staked ${fmt(amt)} on "${opt.label}" @ ${opt.odds}% — payout ${fmt(
        Math.round((amt / (opt.odds / 100)) * 100) / 100
      )}`
    );
    setSelection(null);
  };

  const createMarket = async () => {
    if (!draft.question.trim() || !draft.optA.trim() || !draft.optB.trim()) {
      toast.error("Question and both options are required.");
      return;
    }
    const options = [draft.optA.trim(), draft.optB.trim()];
    setSubmitting(true);
    const tid = toast.loading("Creating market on-chain… (30–60s)");
    try {
      await write("create_market", [
        draft.question.trim(),
        draft.sport,
        "",
        JSON.stringify(options),
      ]);
      const stats = (await read("stats")) as any;
      const total = Number(stats?.total_markets ?? 0);
      toast.success(`Market created — ${total} live on the board ⚡`, { id: tid });
      setDraft({ sport: "Football", question: "", optA: "", optB: "" });
      setCreating(false);
      await loadMarkets();
    } catch (e: any) {
      toast.error(`Create failed: ${e?.message ?? e}`, { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  const resolveMarket = async (key: string) => {
    setResolving(key);
    const tid = toast.loading("Resolving via AI adjudication… (30–60s)");
    try {
      await write("resolve_market", [key]);
      const outcome = (await read("read_outcome", [key])) as any;
      const winningIndex =
        outcome?.winning_index === null || outcome?.winning_index === undefined
          ? null
          : Number(outcome.winning_index);
      setMarkets((ms) =>
        ms.map((m) =>
          m.key === key
            ? {
                ...m,
                resolved: Boolean(outcome?.resolved ?? true),
                winningIndex,
                winningLabel: outcome?.winning_label,
                reasoning: outcome?.reasoning,
              }
            : m
        )
      );
      toast.success(
        `Resolved — winner: ${
          outcome?.winning_label ??
          (winningIndex !== null ? `option ${winningIndex}` : "n/a")
        }`,
        { id: tid }
      );
    } catch (e: any) {
      toast.error(`Resolve failed: ${e?.message ?? e}`, { id: tid });
    } finally {
      setResolving(null);
    }
  };

  const potential =
    selection && Number(stake) > 0
      ? Math.round(
          (Number(stake) / (selection.market.options[selection.optionIndex].odds / 100)) *
            100
        ) / 100
      : 0;

  return (
    <div className="min-h-screen bg-[#0B1437] text-slate-100">
      <Toaster theme="dark" position="top-center" richColors />

      {/* board header + filter bar */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0B1437]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C7F464] font-black text-[#0B1437]">
                ◎
              </span>
              <h1 className="text-lg font-extrabold tracking-tight">
                Subjective<span className="text-[#C7F464]">Bet</span>
              </h1>
              <span className="ml-2 hidden rounded-full bg-[#C7F464]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#C7F464] sm:inline">
                {loading ? "loading…" : `${markets.length} live markets`}
              </span>
            </div>
            <span className="hidden font-mono text-[10px] text-slate-400/50 md:inline">
              {CONTRACT}
            </span>
          </div>

          {/* sport filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["All", ...SPORTS] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  filter === s
                    ? "bg-[#C7F464] text-[#0B1437]"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* market card board */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {visible.map((m) => (
              <motion.div
                key={m.key}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col rounded-2xl border border-white/8 bg-[#121d4a] p-4 transition hover:border-[#C7F464]/40"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-semibold text-[#C7F464]">
                    {m.sport}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    {m.resolved ? (
                      <span className="text-[#C7F464]">● resolved</span>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C7F464]" />
                        open
                      </>
                    )}
                  </span>
                </div>

                <h3 className="mb-4 min-h-[48px] text-[15px] font-bold leading-snug text-white">
                  {m.question}
                </h3>

                <div className="mt-auto space-y-2">
                  {m.options.map((o, i) => {
                    const isWinner = m.resolved && m.winningIndex === i;
                    return (
                      <button
                        key={`${o.label}-${i}`}
                        onClick={() => !m.resolved && openSlip(m, i)}
                        disabled={m.resolved}
                        className={`group relative flex w-full items-center justify-between overflow-hidden rounded-lg border px-3 py-2.5 text-left transition ${
                          isWinner
                            ? "border-[#C7F464] bg-[#C7F464]/15"
                            : "border-white/10 bg-[#0B1437] hover:border-[#C7F464]"
                        }`}
                      >
                        <span
                          className="absolute inset-y-0 left-0 bg-[#C7F464]/10"
                          style={{ width: `${o.odds}%` }}
                        />
                        <span className="relative z-10 flex items-center gap-1.5 text-sm font-semibold text-slate-100">
                          {isWinner && <span>🏆</span>}
                          {o.label}
                        </span>
                        <span className="relative z-10 font-mono text-sm font-bold text-[#C7F464]">
                          {o.odds}%
                        </span>
                      </button>
                    );
                  })}
                </div>

                {m.resolved && m.reasoning && (
                  <p className="mt-3 rounded-lg bg-[#0B1437] px-3 py-2 text-[11px] leading-relaxed text-slate-400">
                    {m.reasoning}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-[11px] text-slate-400">
                  <span>{m.options.length} outcomes</span>
                  {!m.resolved && (
                    <button
                      onClick={() => resolveMarket(m.key)}
                      disabled={resolving === m.key}
                      className="rounded-md bg-[#C7F464]/15 px-2.5 py-1 text-[11px] font-bold text-[#C7F464] transition hover:bg-[#C7F464]/25 disabled:opacity-50"
                    >
                      {resolving === m.key ? "resolving…" : "Resolve"}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!loading && visible.length === 0 && (
          <p className="py-20 text-center text-slate-400">
            No markets in this category yet.
          </p>
        )}
        {loading && (
          <p className="py-20 text-center text-slate-400">Loading markets from chain…</p>
        )}
      </main>

      {/* floating create-market button */}
      <button
        onClick={() => setCreating(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-[#C7F464] px-5 py-3.5 font-bold text-[#0B1437] shadow-lg shadow-[#C7F464]/20 transition hover:brightness-105"
      >
        <span className="text-lg leading-none">+</span> Create market
      </button>

      {/* bet slip — slides in from right */}
      <AnimatePresence>
        {selection && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelection(null)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-[#C7F464]/20 bg-[#121d4a] p-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-white">Bet slip</h2>
                <button
                  onClick={() => setSelection(null)}
                  className="text-slate-400 transition hover:text-white"
                  aria-label="Close bet slip"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B1437] p-4">
                <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-semibold text-[#C7F464]">
                  {selection.market.sport}
                </span>
                <p className="mt-2 text-sm font-bold leading-snug text-white">
                  {selection.market.question}
                </p>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-[#C7F464]/10 px-3 py-2">
                  <span className="text-sm font-semibold text-white">
                    {selection.market.options[selection.optionIndex].label}
                  </span>
                  <span className="font-mono font-bold text-[#C7F464]">
                    {selection.market.options[selection.optionIndex].odds}%
                  </span>
                </div>
              </div>

              <label className="mt-6 mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your stake (USD)
              </label>
              <input
                type="number"
                min={0}
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-[#0B1437] px-4 py-3 text-lg font-bold text-white outline-none focus:border-[#C7F464]"
              />

              <div className="mt-2 flex gap-2">
                {[10, 50, 100, 250].map((q) => (
                  <button
                    key={q}
                    onClick={() => setStake(String(q))}
                    className="flex-1 rounded-lg bg-white/5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    ${q}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-slate-400">Potential payout</span>
                <span className="font-mono text-lg font-bold text-[#C7F464]">
                  {potential ? fmt(potential) : "—"}
                </span>
              </div>

              <button
                onClick={placeBet}
                className="mt-auto rounded-xl bg-[#C7F464] py-3.5 font-extrabold text-[#0B1437] transition hover:brightness-105"
              >
                Place bet
              </button>
              <p className="mt-3 text-center text-[10px] text-slate-500">
                Settled on-chain by AI adjudication of the contested call.
              </p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* create-market modal */}
      <AnimatePresence>
        {creating && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && setCreating(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121d4a] p-6"
            >
              <h3 className="mb-4 text-lg font-extrabold text-white">
                Create a market
              </h3>
              <div className="space-y-3">
                <select
                  value={draft.sport}
                  onChange={(e) =>
                    setDraft({ ...draft, sport: e.target.value as Sport })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0B1437] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C7F464]"
                >
                  {SPORTS.map((s) => (
                    <option key={s} className="bg-[#0B1437]">
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  value={draft.question}
                  onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                  placeholder="The subjective question…"
                  className="w-full rounded-xl border border-white/10 bg-[#0B1437] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C7F464]"
                />
                <div className="flex gap-3">
                  <input
                    value={draft.optA}
                    onChange={(e) => setDraft({ ...draft, optA: e.target.value })}
                    placeholder="Option A"
                    className="w-1/2 rounded-xl border border-white/10 bg-[#0B1437] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C7F464]"
                  />
                  <input
                    value={draft.optB}
                    onChange={(e) => setDraft({ ...draft, optB: e.target.value })}
                    placeholder="Option B"
                    className="w-1/2 rounded-xl border border-white/10 bg-[#0B1437] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C7F464]"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setCreating(false)}
                  disabled={submitting}
                  className="rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createMarket}
                  disabled={submitting}
                  className="rounded-xl bg-[#C7F464] px-5 py-2 text-sm font-bold text-[#0B1437] transition hover:brightness-105 disabled:opacity-50"
                >
                  {submitting ? "Launching…" : "Launch market"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
