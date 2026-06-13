# SubjectiveBet

Subjective sports prediction market on GenLayer. Bet on opinions — ref decisions, MVP picks, match ratings — resolved by AI consensus, not oracles.

## Why this exists

Regular prediction markets handle objective outcomes: "who won the match?" That's easy — any oracle can report a score. But the most interesting sports debates are subjective: "Was the ref wrong on that penalty?", "Who deserved man of the match?", "Was that a red card offense?" No oracle can settle these. Today they just stay arguments on Twitter. SubjectiveBet makes them tradeable.

## Why GenLayer

Subjective sports outcomes are the purest case for GenLayer's architecture:

- **No oracle can report an opinion.** Chainlink can tell you the score, but it can't tell you if the ref made the right call. This requires judgment, not data feeds.
- **AI validators watch the evidence.** They fetch match reports, highlight coverage, and expert analysis from sports websites — then form their own judgment.
- **Consensus across diverse models prevents bias.** One model might favor attackers for MVP, another might favor defenders. When 5 different validators agree, the judgment is robust.
- **Disagreement is legitimate.** If validators genuinely split 3-2, that's a real signal that the question is contested. The protocol handles this gracefully.
- **No single judge to bribe.** Unlike a centralized prediction market resolver, there's no one person or feed to compromise.

The EVM holds the bets and pays winners. GenLayer provides the judgment that no deterministic chain can make.

## Structure

```
SubjectiveBet/
├── engine/
│   └── subjective_bet.py     ← GenLayer intelligent contract
├── solidity/
│   ├── contracts/
│   │   └── BetPool.sol       ← ETH betting pool
│   ├── hardhat.config.js
│   └── package.json
├── frontend/
│   └── index.html            ← Preact + htm (no bundler)
├── utils/
│   └── helpers.js            ← Plain JS utilities
└── README.md
```

No root package.json. No monorepo. `engine/` for GenLayer, `solidity/` is its own Hardhat project, `frontend/` opens directly in browser.

## How it works

1. **Create a market** — "Who was MOTM in Real Madrid vs Barcelona?"  with options ["Vinicius", "Bellingham", "Yamal"]
2. **Place bets** — players stake ETH on their chosen option
3. **Resolve** — AI validators fetch post-match analysis, judge which option wins
4. **Winners collect** — pool split proportionally among correct bettors

## Deploy

```bash
# GenLayer contract
genlayer deploy --contract engine/subjective_bet.py

# Solidity
cd solidity && npm install && npx hardhat compile
```

## Frontend

Open `frontend/index.html` in a browser. No build step needed.
