# PROPOSAL — v0.6: Honest Numbers & Living Markets

Source: first external playtest round (v0.5, post-dashboard UI). This document triages
every piece of feedback into verified bugs, clarity fixes, new mechanics, and balance
work, with concrete starting numbers. All tunables land in `src/lib/game/constants.ts`
per the project's tuning philosophy.

## What players love — protect these

Before changing anything, the things testers called out as the reason the game works:

- **The prestige loop.** "Points feeding into the serial-entrepreneur fantasy is great."
  Runs should keep getting stronger — the fix for tier power creep is pacing, not
  removing the power fantasy.
- **The AGI race clock.** "The 'I have to stop the others from reaching AGI before me'
  concept is the bomb. It makes the whole thing feel alive." Every balance change below
  is checked against one rule: *the rival AGI clock stays the heartbeat of the game.*
  Nothing should make pure idling safe.
- **Short runs.** First run ends in a sale, later runs go further. Keep runs minutes,
  not hours.

---

## 1. Truth in advertising (bugs — fix first)

Every number shown on a button must be computed by the same function that pays it.
Three places currently lie:

### 1.1 Sell company pays half what the button shows

`Header.svelte` advertises `+{sellValue(s)} pts`; `sellCompany()` routes through
`endGame(s, won: false, …)` and `effects.ts:14` pays `floor(sellValue * 0.5)`.
Tester: "button said +16, I got 8."

**Fix (design decision, not just display):** selling is not a loss. The game's own
tagline is "selling is winning, just smaller."

- Introduce an outcome kind: `'agi' | 'consolidation' | 'sale' | 'loss'` on `endGame`.
- Payouts: `sale = sellValue(s)` (full), `loss = floor(sellValue(s) * 0.5)`,
  `agi = sellValue(s) + 100`, `consolidation = sellValue(s) + 50` (see §4.3).
- Add a `settlementPreview(s, kind)` helper in `helpers.ts`; the sell button, the
  end banner, and `endGame` all read from it. No UI number is ever computed twice.

### 1.2 Player monopoly win does not exist

`RaceBoard.svelte` says "any lab reaching 60% share wins outright." The check in
`tickRivals` (`sim.ts:575`) only scans rivals — there is no player-side 60% win at all.

**Fix:** add the player check in `tickSecond`: `share >= MONOPOLY_SHARE` →
`endGame(won, kind: 'consolidation')`. This also becomes one of the three victory
paths (§4.4), so the race board copy becomes true instead of being edited.

### 1.3 Heat accounting is dishonest at the edges

Two mismatches, same root:

- Reductions clamp at 0: at heat 8, "−10 heat" in the log removes 8.
- With Regulatory capture (`heatGainMult = 0.6`), labels like "Ignore them (+8 heat)"
  actually apply +4.8.

**Fix:** `addHeat` returns the applied delta after multiplier and clamping; every log
line and event label that states a heat number is built from real values
(labels showing gains multiply by `s.heatGainMult` at render time). The tester who
"suspected the −x% heat modifier" was wrong about the cause but right that the
numbers don't reconcile — after this they always will.

---

## 2. Clarity & copy (cheap, high value)

| Where | Problem | Change |
|---|---|---|
| `retaliate()` log | "You lose 1.2%." — *1.2% of what?* | "You lose 1.2% market share." Same for undercut/outage/mid-run-strike lines. |
| GPU shortage event | "Prepay supplier" shows no cost (it's dynamic: `800 + revenue×12`), and clicking it while broke gives the *same* −30% shortage as "Ride it out" — a trap. | Event option labels become functions of state: `Prepay supplier ($4,120)`. |
| Acqui-hire event | "($1,800)" — for what? Tester couldn't judge value. | "Acqui-hire — 2 researchers ($1,800)". (It's a good deal: event researchers don't inflate the building cost curve. The label should let players discover that.) |
| Building blurbs | Researcher/lobbyist blurbs show salary; compute blurbs hide opex. Tester: "why did buying a datacenter raise my costs?" | Append opex: "+8 PFLOPs · $3.2/s opex" (from `ECON.groundOpexPerPflop`), all four compute buildings. |
| ComputeCard | Buying compute while serving 100% adds pure cost (revenue is `min(capacity, demand)`) — invisible trap. | When capacity > demand, show "overserving — spare capacity ×1.3" (which the pricing slider, §3.1, turns into a *resource*). |
| AGI run status | "No indication heat will climb during the final run." It does: +0.6/s. | In-run line: "THE FINAL RUN. 43% — heat climbing (+0.45/s net), every rival is coming for you." Pre-run tooltip: "~+34 heat over the run." |
| Sabotage vs retaliation | Tester believed *retaliation* eats run progress. It never does — the separate sabotage roll (20%/5s during runs, 75% blocked by opsec) does. | Distinct phrasing: sabotage lines lead with "SABOTAGE:"; the ModelCard "no opsec team" warning turns `text-warn`. |
| Points everywhere | "Points on win ≠ points displayed." | Covered structurally by §1.1's `settlementPreview`. |

---

## 3. Market dynamics — making share something you *play*

The single loudest theme: "impossible to climb above 5%", "share locks everything."
Root causes verified in code: rivals attack the player regardless of size, retaliation
can exceed what an op gained, the open market is permanently ~0 so Marketing blitz is
dead, and there is no continuous lever on share — only ops. Four changes, designed to
work together:

### 3.1 Pricing slider: `cheap ↔ costly` (tester proposal — adopt it)

A second slider next to training/inference, labeled exactly **cheap** / **costly**.

- `pricing ∈ [0,100]`, default 50 (neutral).
- **Revenue multiplier:** lerp `0.65 → 1.0 → 1.35` across the range.
- **Share drift, cheap side:** up to **+0.05%/s** at full cheap, *only while serving
  ≥ 95% of demand* — you cannot grow on low prices if you're rationing capacity.
  Share is pulled proportionally from alive rivals + open market.
- **Share drift, costly side:** up to **−0.03%/s** at full costly, flowing to rivals.

Why this fixes three complaints at once:

1. It's the active "marketing dimension" the tester asked for — a continuous,
   player-controlled share lever that doesn't poke the retaliation bear.
2. It gives compute purchases a purpose beyond current demand: buy capacity →
   price cheap → grow share → demand grows (share feeds demand at 8%/pt). The
   "why buy a datacenter" confusion becomes a strategy.
3. It cannot be idled to victory: +0.05%/s means a 60% monopoly by pricing alone
   takes ~20 minutes while rival AGI completes in ~9–15. You must still fight.

UI: second slider row in ComputeCard with live readout:
"revenue ×0.78 · +1.9% share/min".

### 3.2 Revive the open market (Marketing blitz is dead)

Verified: `OPEN_MARKET_START = 16` drains in the first minutes (a rival grabs
0.5–1.3% per 5s tick; only smears and folds replenish), so `canRunOp('pr')`'s
`openMarket >= 0.1` gate keeps the button disabled "essentially all the time."

Two changes:

- **Universal churn trickle:** every second, each lab (player included) leaks
  `share × 0.0008` (~0.08%/s of its share) back to the open market — customers
  churn everywhere. Keeps a small contested pool alive for rivals and the player
  to fight over, and gently erodes runaway leaders (helps the "rival at 50%"
  panic window too).
- **Blitz reaches past the pool:** Marketing blitz draws from the open market
  first; any shortfall comes proportionally from rivals at **50% efficiency**.
  The button is always meaningful, but raiding rivals via ads is half as good
  as scooping free customers.

### 3.3 Scale the manual click

`answerPrompt` pays `$3 × incomeMult` forever. Tester: "make it scale — even if
being outscaled by the clanker is thematic." Keep the theme, soften the floor:

- `clickCash × gen × incomeMult` (Gen 4 ≈ $12+ per click before multipliers), and
  the 30% research proc scales to `0.5 × gen`.
- It still becomes irrelevant against hundreds/s of automated revenue — the
  clanker wins, as intended — but it stays a real early-game lever for one more gen.

### 3.4 Rivals ignore labs too small to matter

The fix for "I get spammed by 3 undercut-pricings in 20 seconds at 3% share":

- In `tickRivals`, the attack-the-player branch requires
  `share ≥ ATTACK_SHARE_FLOOR = 8`, ramping to full pressure at 15%
  (`pressure × clamp((share − 8) / 7, 0, 1)`).
- **Exception preserved:** during the AGI run, everyone attacks regardless of size.
  The final run staying a gauntlet is core drama (§ "protect these").
- Thematically free: nobody undercuts a garage nobody.

### 3.5 Retaliation is capped by what you took

`retaliate()` can currently take up to `2.0% × defenseMult` — often more than the
poach gained, which is why testers learned "never touch OpenMind" (55% retaliation).

- Cap: `min(current roll, max(0.5, 0.75 × shareTakenByOp))`.
- Ops that steal no share (spy, sabotage) keep the 0.5% floor — provoking the
  vindictive still carries risk, but an op is never strictly negative-EV.
- Surface the trait: rival row tooltip "vindictive — retaliates 55%".

---

## 4. Acquisitions & victory paths

### 4.1 Gate: nobody sells to a garage nobody

Verified: a fresh Serial-founder run starts with $30k/80 influence and the weakest
rival costs ~$18.5k + 30 influence — "you launch, you buy a competitor, there's no
game." Require **share ≥ 10%** to acquire. Every prestige tier still has to play
the opening.

### 4.2 Escalating antitrust premium

`acquisitionCost` is `weakest.share × defense × 1100` — pennies once rivals shrink.

```
cost = max(weakest.share, 8) × weakest.defense × 1100 × 2^acquisitionsMade
```

- The `max(…, 8)` floor stops dying rivals from being free.
- The `2^n` premium makes the second purchase a decision and the fourth a war chest.
- Each acquisition also adds **+0.05/s permanent passive heat** ("the FTC has a
  whiteboard with your face on it") — consolidation is a strategy you commit to.

### 4.3 Buying the last rival ends the game — as a win

Today, absorbing everyone leaves a dead world: no sabotage, no attacks, no rival AGI,
no monopoly check — uncontested idling to the AGI run. Instead: acquiring the final
rival (or hitting 60% share, §1.2) triggers the **consolidation ending**:

> "There is no industry left. There is only you. The DOJ files something historic."

Pays `sellValue + 50` — above a sale, below AGI's `+100`. To the question
*"do we even want players to be able to buy out everyone?"* — yes, **as a priced
victory, not a state of play**. The premium + heat ramp make it the high-roller path
rather than late-game housekeeping, and ending the run on the last purchase means
the dead-world state is unreachable.

### 4.4 The result: three races against one clock

| Path | Win | Pays |
|---|---|---|
| **Science** | finish the AGI run | `sellValue + 100` |
| **Mafia** | absorb every rival | `sellValue + 50` |
| **Market** | 60% share (pricing + blitz + poach) | `sellValue + 50` |
| **Exit** | sell whenever | `sellValue` |

All three races run against the same rival-AGI clock, which stays untouched.

---

## 5. Prestige curve — "levels are too powerful"

Testers: early runs tedious (addressed by §3), top tier trivial, and: "hardcode a
prestige level toward the middle so it goes *fast* — but not too fast."

- **Five tiers instead of four**, smaller jumps, the big toys arriving last:

  ```
  0   Garage nobody    (as today)
  25  Angel-backed     $2,000 · 8 inf  · 2 researchers
  70  VC darling       $8,000 · 25 inf · 3 researchers · 1 lobbyist · 1 DC   ← the "fast but real" anchor
  140 Unicorn          $16,000 · 45 inf · 4 researchers · 1 lobbyist · 1 DC · defense ×0.75
  240 Serial founder   $22,000 · 60 inf · gen-2 start · defense ×0.5
  ```

  Serial founder keeps the gen-2 start (the fantasy) but loses the instant-acquisition
  wallet — and §4.1 gates it anyway.
- **Soften the global multiplier:** `POINTS_MULT_DIVISOR 150 → 200`, cap the global
  mult at **×3**. It compounds with tier mults; uncapped it's the real power creep.
- **Open question — NG+ pressure:** optionally scale rival `grow` by
  `+8% per tier` so the ecosystem matures alongside you and "there's no game left"
  can't recur. Changes the feel; decide after playtesting the tier rework alone.

---

## 6. Sharing, events, mobile

### 6.1 Shareable result card (tester request, cheap virality)

"Copy result" button on the EndBanner → clipboard:

```
AI Lab Mafia — Run #4 (VC darling)
🏆 AGI ACHIEVED in 11:42 — Gen 4 · 31.5% share · peak heat 87
2 rivals absorbed · +148 founder pts
https://wally869.github.io/AI-Lab-Mafia/
```

Needs three new tracked fields on `GameState`: run duration (have `ticks`), peak
heat, acquisitions count (also needed by §4.2). `navigator.clipboard.writeText`,
no backend.

### 6.2 Events belong near the action

The event toast currently sits bottom-right; the active click-zone (prompt button,
sliders, ops) is the left/middle of the dashboard. Move it **bottom-left**. On
mobile, render it as a full-width bottom bar instead of a floating box so it never
covers the controls it's competing with.

### 6.3 Mobile pass (small)

- `touch-action: manipulation` on `.btn`, sliders, and rival rows — kills the
  double-tap zoom testers hit, without disabling pinch-zoom (a11y).
- Both sliders (alloc + pricing) full-width rows on small screens.
- Defer anything heavier; testers rated mobile "small design work, nothing crazy."

---

## 7. Phasing

Each phase is independently shippable; playtest after 2 and 3.

| Phase | Contents | Size |
|---|---|---|
| **1. Honest numbers** | §1 bugs, §2 copy table, §6.3 touch-action, §6.2 toast move, §3.3 click scaling | S |
| **2. Living market** | §3.1 pricing slider, §3.2 open-market churn + blitz rework, overserve indicator | M |
| **3. Rivals & empires** | §3.4 aggression gate, §3.5 retaliation cap, §4 acquisitions + consolidation/monopoly endings | M |
| **4. Meta & polish** | §5 tier ladder + mult cap, §6.1 share card, README v0.6 | S–M |

## 8. Open questions

1. **Selling pays full value** (§1.1) — confirm the design call, not just the display fix.
2. **Consolidation/market wins at `+50`** — right gap below AGI's `+100`?
3. **NG+ rival scaling** (§5) — include in phase 4 or hold for its own playtest?
4. **Five-tier ladder vs. retuning the existing four** — proposal assumes five.
5. **Pricing slider drift rates** (±0.05/0.03 %/s) — starting points; expect one
   tuning pass against the ~9–15 min rival AGI clock.
