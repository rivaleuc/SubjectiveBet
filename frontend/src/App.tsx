import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";

const CONTRACT = "0x515582F76367150d8d0A6C1eD3FcB5E464dC63D0";

type Sport = "Football" | "Basketball" | "Tennis" | "MMA" | "Cricket";

interface Option {
  label: string;
  odds: number; // implied probability %
}

interface Market {
  id: number;
  sport: Sport;
  question: string;
  closes: string;
  pool: number; // total staked
  options: Option[];
}

interface Selection {
  market: Market;
  optionIndex: number;
}

const SPORTS: Sport[] = ["Football", "Basketball", "Tennis", "MMA", "Cricket"];

let _mid = 100;

const SEED: Market[] = [
  {
    id: 1,
    sport: "Football",
    question: "Was the 89' penalty the correct call?",
    closes: "2h 14m",
    pool: 42100,
    options: [
      { label: "Correct call", odds: 63 },
      { label: "Should've been waved", odds: 37 },
    ],
  },
  {
    id: 2,
    sport: "Basketball",
    question: "Who deserves MVP of tonight's final?",
    closes: "5h 02m",
    pool: 88700,
    options: [
      { label: "Okafor", odds: 48 },
      { label: "Reyes", odds: 34 },
      { label: "Tanaka", odds: 18 },
    ],
  },
  {
    id: 3,
    sport: "MMA",
    question: "Was the late stoppage justified?",
    closes: "41m",
    pool: 15300,
    options: [
      { label: "Justified", odds: 55 },
      { label: "Too late", odds: 45 },
    ],
  },
  {
    id: 4,
    sport: "Tennis",
    question: "Was that baseline shot in or out?",
    closes: "1h 30m",
    pool: 23800,
    options: [
      { label: "In", odds: 71 },
      { label: "Out", odds: 29 },
    ],
  },
  {
    id: 5,
    sport: "Cricket",
    question: "Should the DRS have overturned the LBW?",
    closes: "3h 48m",
    pool: 31500,
    options: [
      { label: "Overturn correct", odds: 52 },
      { label: "Umpire was right", odds: 48 },
    ],
  },
  {
    id: 6,
    sport: "Football",
    question: "Was the disallowed goal actually offside?",
    closes: "22m",
    pool: 67200,
    options: [
      { label: "Clearly offside", odds: 44 },
      { label: "Onside, robbed", odds: 56 },
    ],
  },
];

const fmt = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

function App() {
  const [markets, setMarkets] = useState<Market[]>(SEED);
  const [filter, setFilter] = useState<Sport | "All">("All");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [stake, setStake] = useState("");
  const [creating, setCreating] = useState(false);
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
        m.id === selection.market.id ? { ...m, pool: m.pool + amt } : m
      )
    );
    toast.success(
      `Staked ${fmt(amt)} on "${opt.label}" @ ${opt.odds}% — payout ${fmt(
        Math.round((amt / (opt.odds / 100)) * 100) / 100
      )}`
    );
    setSelection(null);
  };

  const createMarket = () => {
    if (!draft.question.trim() || !draft.optA.trim() || !draft.optB.trim()) {
      toast.error("Question and both options are required.");
      return;
    }
    const market: Market = {
      id: ++_mid,
      sport: draft.sport,
      question: draft.question.trim(),
      closes: "12h 00m",
      pool: 0,
      options: [
        { label: draft.optA.trim(), odds: 50 },
        { label: draft.optB.trim(), odds: 50 },
      ],
    };
    setMarkets((ms) => [market, ...ms]);
    setDraft({ sport: "Football", question: "", optA: "", optB: "" });
    setCreating(false);
    toast.success("Market created and live on the board ⚡");
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
                {markets.length} live markets
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
                key={m.id}
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
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C7F464]" />
                    closes {m.closes}
                  </span>
                </div>

                <h3 className="mb-4 min-h-[48px] text-[15px] font-bold leading-snug text-white">
                  {m.question}
                </h3>

                <div className="mt-auto space-y-2">
                  {m.options.map((o, i) => (
                    <button
                      key={o.label}
                      onClick={() => openSlip(m, i)}
                      className="group relative flex w-full items-center justify-between overflow-hidden rounded-lg border border-white/10 bg-[#0B1437] px-3 py-2.5 text-left transition hover:border-[#C7F464]"
                    >
                      <span
                        className="absolute inset-y-0 left-0 bg-[#C7F464]/10"
                        style={{ width: `${o.odds}%` }}
                      />
                      <span className="relative z-10 text-sm font-semibold text-slate-100">
                        {o.label}
                      </span>
                      <span className="relative z-10 font-mono text-sm font-bold text-[#C7F464]">
                        {o.odds}%
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-[11px] text-slate-400">
                  <span>
                    Pool <span className="font-bold text-slate-200">{fmt(m.pool)}</span>
                  </span>
                  <span>{m.options.length} outcomes</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {visible.length === 0 && (
          <p className="py-20 text-center text-slate-400">
            No markets in this category yet.
          </p>
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
            onClick={() => setCreating(false)}
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
                  className="rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={createMarket}
                  className="rounded-xl bg-[#C7F464] px-5 py-2 text-sm font-bold text-[#0B1437] transition hover:brightness-105"
                >
                  Launch market
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
