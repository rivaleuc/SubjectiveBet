# SubjectiveBet

**A prediction market for questions with no scoreboard — settled by AI consensus, not an oracle feed.**

SubjectiveBet handles the bets that classic oracles can't: "Who was the MVP?", "Was that a fair red card?", "Who really won the exchange?" Anyone creates a market with a question and options; bettors pick a side; when it's time to settle, GenLayer validators crawl sports coverage, weigh expert consensus, and agree on the winning outcome on-chain — no single referee, no centralized data provider.

- **Contract (Bradbury, chain 4221):** `0x46E47aEb46e9241CB0d2445760c6f5FD8Dba572B`
- **Explorer:** https://explorer-bradbury.genlayer.com/contract/0x46E47aEb46e9241CB0d2445760c6f5FD8Dba572B
- **Live app:** https://subjectivebet.pages.dev

## What it does

The lifecycle is **create → bet → resolve → read outcome**:

1. **`create_market(question, sport, match_info, options_json)`** — anyone opens a market. `options_json` must be a JSON array of at least two outcomes. Stored as JSON in `markets: TreeMap[str, str]`, keyed by an incrementing `market_count`, with `resolved=False` and `winning_index=-1`.
2. **`place_bet(market_key, option_index)`** — a bettor stakes on an option by index (validated against the option count); rejected once the market is resolved. Bets are appended to the market's `bets` list.
3. **`resolve_market(market_key)`** — triggers AI adjudication via the internal `_judge`, then writes `resolved=True`, `winning_index`, and the judge's `reasoning` back to storage.
4. **Adjudication (the core).** Inside `_judge`, a `leader_fn` crawls evidence with **`gl.nondet.web.render(google_search_url, mode="text", wait_after_loaded="2s")`** — a search built from `sport + match_info + question` — to pull live sports news and analysis. That evidence plus the enumerated options goes into **`gl.nondet.exec_prompt(prompt, response_format="json")`**, which is told to follow expert/majority consensus for subjective calls and reply `{"winning_index", "reasoning"}`.
5. **Consensus.** The verdict is finalized through **`gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`**. The `validator_fn` re-checks the leader's `gl.vm.Return.calldata` for *structure*: `winning_index` is an int within `[0, len(options))` and `reasoning` is a string. Validators agree the pick is well-formed and in range, not that their prose matches.
6. **`read_outcome(market_key)`** — the settlement resolver: returns `resolved`, `winning_index`, `winning_label`, and `reasoning`. `get_market` and `stats` are views.

## Why GenLayer

A deterministic EVM cannot settle a subjective question. There is no opcode to read ESPN, no canonical on-chain feed for "who deserved MVP," and a hardcoded oracle would just relocate the trust to whoever controls it. Two nodes querying live news at different moments would also see different pages and break consensus. Settling these markets requires reading messy, real-world coverage and forming a judgement — and doing it across many independent nodes so no one referee decides the payout.

GenLayer's **Optimistic Democracy** is the mechanism: a leader validator proposes the winning outcome, others re-evaluate it against their own crawl, and the result finalizes when a supermajority agrees it is *reasonable*. Disagreement triggers an appeal rather than a silent override.

**Use GenLayer when** resolution is inherently subjective or depends on off-chain consensus and you still want a trustless, on-chain settlement. **Use a plain backend when** the outcome is objective and already on-chain (a final score posted by a trusted feed) — that doesn't need a democracy of validators.

## Architecture

| Intelligent contract (GenLayer) | Frontend dir | EVM / off-chain |
| --- | --- | --- |
| `engine/subjective_bet.py` — `SubjectiveBet(gl.Contract)`: `create_market`, `place_bet`, `resolve_market`, `read_outcome`, AI resolution via `run_nondet_unsafe` | `frontend/` (Vite + React + TS) | `solidity/BetPool.sol` (Hardhat) for pooled stakes; sports news crawled off-chain by validators |

## Tech

**Contract** — GenVM Python, pinned to `py-genlayer:1jb45aa8…jpz09h6` via the `# { "Depends": ... }` header. State is a single `markets: TreeMap[str, str]` store with a `u256 market_count`; each market is a JSON blob holding options, bets, and the resolved verdict. Resolution runs as a `leader_fn`/`validator_fn` pair through `gl.vm.run_nondet_unsafe`, with evidence crawled via `gl.nondet.web.render`.

**Frontend** — Vite + React 19 + TypeScript with Tailwind v4, `framer-motion`, and `sonner`. `src/genlayer.ts` wraps `genlayer-js`: reads via `createClient({ chain: testnetBradbury }).readContract`; writes connect MetaMask (`eth_requestAccounts`), switch the wallet to chain `0x107d` (4221) via `wallet_switchEthereumChain`/`wallet_addEthereumChain` (no GenLayer snap required), then `writeContract` and await a `FINALIZED` receipt. The UI is a dark navy / lime **market board**: sport-filter tabs, a responsive grid of market cards with per-option odds bars, a slide-in **bet slip** with stake quick-picks and a payout estimate, a floating create-market modal that calls `create_market`, and a per-card **Resolve** action that fires `resolve_market` and surfaces the winning label + reasoning. Markets and `stats` load from chain on mount.

## Project structure

```
SubjectiveBet/
├── engine/
│   └── subjective_bet.py     # SubjectiveBet(gl.Contract) — intelligent contract
├── solidity/
│   ├── contracts/BetPool.sol # EVM pooled-stake contract (Hardhat)
│   └── hardhat.config.js
├── utils/market.js           # helper
├── frontend/                 # frontend (Vite + React + TS)
│   ├── src/
│   │   ├── App.tsx           # market board + bet slip
│   │   ├── genlayer.ts       # genlayer-js reads + MetaMask writes
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## Develop

```bash
cd frontend
npm install
npm run dev      # local dev server
npm run build    # tsc -b && vite build → dist/
```

## Deploy the frontend

Deployed on **Cloudflare Pages**:

- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment:** `NODE_VERSION=20`

## Why GenLayer (engineering notes)

- **No floats.** `winning_index` and `market_count` are integers (`u256`). Odds and payout math in the UI are cosmetic; any on-chain proportional settlement should use integer basis points, never floats.
- **Validate structure, not exact match.** `validator_fn` only confirms `winning_index` is an int within range and `reasoning` is a string. It never compares the leader's explanation to its own — non-deterministic LLM prose can't be matched exactly, so consensus checks the *shape* of the answer.
- **ACCEPTED ≠ executed.** A finalized `resolve_market` means validators agreed the chosen outcome is reasonable; downstream payouts must read `read_outcome` and settle separately.
- **Optimistic finality paces writes.** A resolution is only trustworthy after the appeal window — the frontend waits for a `FINALIZED` receipt (retries 60 × 5s), so resolving takes ~30–60s. Don't pay out before finality.
- **Evidence is untrusted / greybox.** Crawled search results are open-web input: pages can be SEO-spam, contradictory, or unreachable. The prompt leans on expert/majority consensus and the fetched text is capped; treat every crawled page as hostile and bound it.

## License

MIT
