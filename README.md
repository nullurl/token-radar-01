# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/nullurl/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/nullurl/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar (model radar-2): ranks pre-token protocols by implied launch value from a sealed DefiLlama snapshot (758 protocols, 2026-11-14). The board covers all 40 watchlist protocols plus 160 early-radar rows below the $50M floor, picked by implied value.

The multiple is the market's own pricing, learned from the snapshot: each category's median market-cap / TVL over its live-token protocols (at least 3; fewer, and the global median is used), clamped to [0.05, 1.0]. Implied value is TVL × multiple × a growth factor (7-day change, clamped) × a maturity factor (time listed with no token) × a chain-breadth factor. No protocol name is special-cased; the same function scores every row, and the dashboard recomputes each row from the same figures.

The static dashboard (no network) shows the ranked board with search, category and chain filters, a watchlist toggle, a top-3 spotlight, the category multiples table, and a per-protocol detail drawer with the full model breakdown and a 7-step farm plan (action, cost, time, and a risk line derived from the protocol's own record).

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input path/to/snapshot.json
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=9xrvxpg6&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
