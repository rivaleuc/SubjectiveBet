import { useState } from 'react'
import { motion } from 'framer-motion'
import { Toaster, toast } from 'sonner'

const CONTRACT = '0x515582F76367150d8d0A6C1eD3FcB5E464dC63D0'

type MarketOption = { label: string; odds: string; pct: number }
type Market = {
  league: string
  question: string
  status: 'LIVE' | 'CLOSING' | 'OPEN'
  pool: string
  options: MarketOption[]
}

const MARKETS: Market[] = [
  {
    league: 'UCL · Final',
    question: 'Who wins Man of the Match?',
    status: 'LIVE',
    pool: '142.8 ETH',
    options: [
      { label: 'Bellingham', odds: '2.10x', pct: 47 },
      { label: 'Vinícius Jr', odds: '3.40x', pct: 29 },
      { label: 'Rodri', odds: '4.25x', pct: 24 },
    ],
  },
  {
    league: 'Premier League',
    question: 'Will the late penalty be overturned by VAR?',
    status: 'CLOSING',
    pool: '88.3 ETH',
    options: [
      { label: 'Overturned', odds: '1.75x', pct: 57 },
      { label: 'Stands', odds: '2.30x', pct: 43 },
    ],
  },
  {
    league: 'NBA · Playoffs',
    question: 'Was the final possession a clean block or a foul?',
    status: 'OPEN',
    pool: '61.5 ETH',
    options: [
      { label: 'Clean Block', odds: '1.95x', pct: 51 },
      { label: 'Shooting Foul', odds: '2.05x', pct: 49 },
    ],
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Pick a Subjective Call',
    body: 'Browse live markets on the moments analysts argue about — MOTM, ref decisions, contested calls.',
  },
  {
    n: '02',
    title: 'Stake Your Read',
    body: 'Back your opinion with crypto. Odds shift in real time as the crowd weighs in.',
  },
  {
    n: '03',
    title: 'Crowd Oracle Settles',
    body: 'A decentralized panel of stakers resolves the outcome — no single referee, no central authority.',
  },
  {
    n: '04',
    title: 'Claim Your Winnings',
    body: 'Correct calls get paid out instantly from the pool, straight to your wallet.',
  },
]

const FEATURES = [
  {
    icon: '🏟️',
    title: 'Subjective Markets',
    body: 'The first venue built for opinion-based sports questions, not just final scores.',
  },
  {
    icon: '⚡',
    title: 'Live Odds Engine',
    body: 'Dynamic pricing reacts to every stake the moment it lands on-chain.',
  },
  {
    icon: '🛡️',
    title: 'Decentralized Oracle',
    body: 'Disputes resolved by a staked panel, so no referee can rig the result.',
  },
  {
    icon: '💧',
    title: 'Deep Liquidity Pools',
    body: 'Shared pools keep spreads tight and payouts fast across every market.',
  },
  {
    icon: '🔐',
    title: 'Non-Custodial',
    body: 'Your funds stay in your wallet until the moment a position is opened.',
  },
  {
    icon: '📊',
    title: 'Transparent Settlement',
    body: 'Every stake, odd, and payout is verifiable on-chain. No hidden books.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
}

function App() {
  const [team, setTeam] = useState('')
  const [player, setPlayer] = useState('')
  const [stake, setStake] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!team || !player || !stake) {
      toast.error('Fill in the match, your pick, and a stake to simulate.')
      return
    }
    setLoading(true)
    toast.loading('Locking your position on-chain...', { id: 'bet' })
    setTimeout(() => {
      setLoading(false)
      const won = Math.random() > 0.45
      const payout = (parseFloat(stake) * (won ? 2.1 : 0)).toFixed(3)
      if (won) {
        toast.success(`Settled! "${player}" hit — you won ${payout} ETH 🎉`, {
          id: 'bet',
        })
      } else {
        toast.error(`Tough beat. "${player}" missed this time. Better read next round.`, {
          id: 'bet',
        })
      }
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-[#0B1437] text-white font-sans antialiased selection:bg-[#C7F464] selection:text-[#0B1437]">
      <Toaster theme="dark" position="top-right" richColors />

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B1437]/80 border-b border-white/10">
        <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 font-black text-xl tracking-tight">
            <span className="grid place-items-center h-9 w-9 rounded-lg bg-[#C7F464] text-[#0B1437] text-lg">
              ◎
            </span>
            <span>
              Subjective<span className="text-[#C7F464]">Bet</span>
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#markets" className="hover:text-[#C7F464] transition">Markets</a>
            <a href="#how" className="hover:text-[#C7F464] transition">How it Works</a>
            <a href="#features" className="hover:text-[#C7F464] transition">Features</a>
            <a href="#demo" className="hover:text-[#C7F464] transition">Demo</a>
          </div>
          <a
            href="#demo"
            className="rounded-full bg-[#C7F464] px-5 py-2 text-sm font-bold text-[#0B1437] hover:brightness-95 transition"
          >
            Launch App
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(199,244,100,0.18), transparent)' }}
        />
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 text-center relative">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#C7F464]/40 bg-[#C7F464]/10 px-4 py-1.5 text-xs font-semibold text-[#C7F464] uppercase tracking-widest"
          >
            <span className="h-2 w-2 rounded-full bg-[#C7F464] animate-pulse" />
            Live on-chain · {MARKETS.length} markets open
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-5xl md:text-7xl font-black leading-[0.95] tracking-tight"
          >
            Bet on the calls
            <br />
            <span className="text-[#C7F464]">the refs argue about.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-white/70"
          >
            The first prediction market for subjective sports moments. Man of the Match,
            contested penalties, clutch fouls — stake your read and let the crowd oracle settle it.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#markets"
              className="w-full sm:w-auto rounded-full bg-[#C7F464] px-8 py-4 font-bold text-[#0B1437] hover:brightness-95 transition"
            >
              Explore Markets
            </a>
            <a
              href="#how"
              className="w-full sm:w-auto rounded-full border border-white/20 px-8 py-4 font-bold text-white hover:border-[#C7F464] hover:text-[#C7F464] transition"
            >
              How it Works
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-14 grid grid-cols-3 max-w-2xl mx-auto gap-6 text-center"
          >
            {[
              ['$4.2M', 'Volume settled'],
              ['18.6k', 'Active stakers'],
              ['99.4%', 'Oracle accuracy'],
            ].map(([stat, label]) => (
              <div key={label}>
                <div className="text-3xl md:text-4xl font-black text-[#C7F464]">{stat}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="mx-auto max-w-7xl px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-black">Live Markets</h2>
            <p className="mt-2 text-white/60">Real questions. Real odds. Settled by the crowd.</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MARKETS.map((m, i) => (
            <motion.div
              key={m.question}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-[#C7F464]/50 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  {m.league}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                    m.status === 'LIVE'
                      ? 'bg-[#C7F464] text-[#0B1437]'
                      : m.status === 'CLOSING'
                        ? 'bg-orange-400/20 text-orange-300'
                        : 'bg-white/10 text-white/60'
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold leading-snug">{m.question}</h3>

              <div className="mt-5 space-y-3">
                {m.options.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => toast(`Tapped "${o.label}" @ ${o.odds}`, { icon: '🎯' })}
                    className="w-full text-left rounded-xl border border-white/10 bg-[#0B1437] px-4 py-3 hover:border-[#C7F464] transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{o.label}</span>
                      <span className="font-black text-[#C7F464]">{o.odds}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C7F464]"
                        style={{ width: `${o.pct}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between text-sm text-white/50">
                <span>Pool</span>
                <span className="font-bold text-white">{m.pool}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-black text-center"
          >
            How it <span className="text-[#C7F464]">Works</span>
          </motion.h2>

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-2xl border border-white/10 p-6"
              >
                <div className="text-5xl font-black text-[#C7F464]/30">{s.n}</div>
                <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-black text-center"
        >
          Built for <span className="text-[#C7F464]">degens with takes.</span>
        </motion.h2>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo Form */}
      <section id="demo" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-[#C7F464]/30 bg-gradient-to-b from-[#C7F464]/[0.08] to-transparent p-8 md:p-10"
          >
            <h2 className="text-3xl font-black">Try a Simulated Bet</h2>
            <p className="mt-2 text-white/60">
              Place a mock position. We&apos;ll simulate an on-chain settlement in 3 seconds.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">Match</label>
                <input
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="e.g. Real Madrid vs City"
                  className="w-full rounded-xl border border-white/15 bg-[#0B1437] px-4 py-3 outline-none focus:border-[#C7F464] transition placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">
                  Your MOTM pick
                </label>
                <input
                  value={player}
                  onChange={(e) => setPlayer(e.target.value)}
                  placeholder="e.g. Bellingham"
                  className="w-full rounded-xl border border-white/15 bg-[#0B1437] px-4 py-3 outline-none focus:border-[#C7F464] transition placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">
                  Stake (ETH)
                </label>
                <input
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.25"
                  className="w-full rounded-xl border border-white/15 bg-[#0B1437] px-4 py-3 outline-none focus:border-[#C7F464] transition placeholder:text-white/30"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#C7F464] px-6 py-4 font-bold text-[#0B1437] hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Settling on-chain…' : 'Place Simulated Bet'}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-black text-lg">
              <span className="grid place-items-center h-8 w-8 rounded-lg bg-[#C7F464] text-[#0B1437]">
                ◎
              </span>
              Subjective<span className="text-[#C7F464]">Bet</span>
            </div>
            <div className="text-sm text-white/50 text-center">
              Contract:{' '}
              <code className="text-[#C7F464] break-all">{CONTRACT}</code>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/40">
            © {new Date().getFullYear()} SubjectiveBet. Markets are illustrative. Bet responsibly.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
