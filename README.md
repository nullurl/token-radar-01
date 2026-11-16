# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/nullurl/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/nullurl/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar (model radar-2): ranks pre-token protocols by implied launch value from a sealed DefiLlama snapshot (758 protocols, 2026-11-14). The board covers all 40 watchlist protocols plus 160 early-radar rows below the $50M floor, picked by implied value.

## The model

The multiple is the market's own pricing, learned from the snapshot: each category's median market-cap / TVL over its live-token protocols (at least 3; fewer, and the global median is used), clamped to [0.05, 1.0]. Implied value is:

```
implied = round( tvl_usd x category_multiple
  x (1 + clamp(change_7d, -60, 120) / 100 x 0.5)
  x (0.6 + min(age_days, 1095) / 1095 x 0.4)
  x (1 + 0.04 x min(chains - 1, 4)) )
```

No protocol name is special-cased; the same function scores every row, and the dashboard recomputes each row from the same figures and checks the number board.json carries. The category multiples the snapshot taught (14 categories, with the live-protocol count behind each) are shown in the dashboard's model panel.

## The dashboard

A static page (no network, no framework) that shows the ranked board with search, category and chain filters, a watchlist toggle, a top-3 spotlight, and a per-protocol detail drawer with the full model breakdown and a 7-step farm plan (action, cost, time, and a risk line derived from the protocol's own record). It also has:

- a **model sandbox**: change the growth weight, the multiple scale and the breadth step and the board re-ranks in the browser. The sandbox never touches board.json; the canonical board stays as the model scored it.
- a **CSV export** of the rows on screen, in the order on screen.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input path/to/snapshot.json
```

`--model key=value,...` overrides model constants for an experiment run (for example `--model growth_weight=1,multiple_cap=0.5`); overrides are validated and refused when they leave the sane ranges. The run prints the multiples learned and the top 3, and warns when a screenshot falls outside the dossier's 300–350 KB guidance.

## Layout

- `main.ts` — the entrypoint: reads the snapshot, scores the board, writes `board.json`, `data.js`, the dashboard, the screenshots and `dossier.json`.
- `lib/model.ts` — the model, the board builder, the farm plans and the snapshot parser.
- `dashboard/` — the static page (`index.html`, `app.css`, `app.js`).
- `screenshots/` — three real renders of the page: the board, a detail view, a filtered view.
- `vendor/makefun-board.ts` — the kit's vendored dossier builder, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=9xrvxpg6&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
