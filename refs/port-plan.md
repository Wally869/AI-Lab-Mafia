# UI Port Plan — Max's mobile design → responsive webapp

**Contract:** the existing UI's behavior is the spec; `refs/from_max/` is the skin.
Nothing below in PRESERVED/ADAPTED may be dropped during implementation. FLAGGED
rows need a decision before the affected component is built.

Hard rules:
- `src/lib/game/` — **zero edits**. The event timer total (18s) is mirrored as a
  UI-side constant with a comment pointing at `maybeSpawnEvent` (FLAG-7 if you
  prefer the named constant in the sim instead).
- Toolchain untouched: Tailwind stays installed; the design CSS is added alongside.
- Incremental: one component group at a time, app working after every step.

---

## 1. Layout spec

### Mobile (<768px) — full-bleed, no fake phone chrome
- Vertical stack: app bar · resource strip · race strip · ticker · tabbed body
  (Lab / Build / Ops / Race) · dock (prompt + event) · tab bar.
- Bottom sheets: event, company, settings, full wire-taps feed (tap the ticker).
- Safe-area insets honored top/bottom.

### Desktop (≥768px) — multi-column webapp, same design language
- Header: app bar row, then **one merged 6-cell strip** (Cash · Research ·
  Influence · Heat · Your lab · Leader). No ticker.
- Body ≥1200px: **4 columns** — `Lab+dock | Build | Ops | Race + wire-taps log`.
  Height-locked: the page never scrolls; columns scroll internally on short
  windows; the log panel fills its column's remaining height (old LogPanel
  min/max-height behavior, scaled up).
- 768–1199px: 2 columns, page scroll allowed.
- Sheets render as centered modals (same content). Tab bar hidden. Dock is a slim
  horizontal row at the top of the Lab column.
- Hover states under `@media (hover:hover)`; `:active` press feedback stays.

### Cross-cutting display fixes (vs. the first attempt)
- Share bars at **true 0–100% scale** with a thin amber tick at 60% (win line)
  on bars that race toward monopoly. (Matches old RaceBoard scale — inventory
  row RaceBoard#36.)
- Race strip cell 2: **"Leader — {name}"** when a rival is #1 by share;
  **"Runner-up — {name}"** when you lead. Never "Closest".
- Op captions describe *our* sim, not the mock (e.g. blitz: "grab share — open
  market first, then rivals").

### New capabilities from the refs design (additive, not replacing anything)
- Settings sheet: accent hue (4 swatches), juice (low/med/high), density
  (cozy/compact), cards (grid/list for Build+Ops), numbers (short 9.1M / full
  9,110,610). Persisted under `ai-lab-mafia.ui` (separate from founder meta).
- Toasts: player intents surface the log line they generated (`act()` wrapper
  compares `log[0].id` before/after).
- Tap-to-earn float fx (+$N) on the prompt button, gated by juice setting.
- Number formatting: `short` k/M/B applies to big UI numbers; **cost labels
  inside sim-generated strings (events, log) stay locale-full as the sim writes
  them.**

---

## 2. Parity mapping, per component

Legend: ✅ preserved as-is (reskinned only) · 🔁 adapted (how, stated) · 🚩 flagged.

### Header.svelte → AppBar + company sheet
| Old row | Disposition |
|---|---|
| Title "AI Lab Mafia / race to AGI" | 🔁 App bar shows **lab name** (design); game title lives in onboarding h3. |
| Tier name · founder pts · run N · "next tier in X pts" / "max tier" | ✅ App bar subtitle + pts chip (chip opens company sheet). |
| Sell company button + live `settlementPreview(state,'sale')` | 🚩 **FLAG-1** below. |
| "?" how-to button (`aria-label="How to play"`) | ✅ Second icon button in app bar (next to gear), both breakpoints → reopens onboarding. |
| Max-tier edge case | ✅ |

### Metrics.svelte → ResourceBar
| Old row | Disposition |
|---|---|
| Cash `$fmt` + net `±$X/s` (green/red, Unicode −) | ✅ (rate via short fmt when setting=short). |
| Research value + `rate.toFixed(1)/s`; Influence value + `rate.toFixed(1)/s` | ✅ |
| Heat number (rounded), color thresholds 40/70 (ok/warn/bad → cool/warm/hot) | ✅ |
| Heat meter bar + `role="meter"` aria-valuenow/min/max + label | ✅ Thin bar added under the heat number in the new stat cell (design-styled), aria kept. |
| Inline annotation: ≥70 "−25% revenue!", ≥40 "+25% opex!", else "100 = game over" | 🔁 Becomes the stat's malus line: ≥70 "−25% rev +25% opex" (both penalties active), 40–69 "+25% opex", <40 & share>30 "size draws scrutiny", else "stable · 100 = raid". All four tooltip states (next row) become *visible* text. |
| 4-variant heat `title` tooltip (investigation / audits / passive scrutiny / "not watching yet") | ✅ Kept as `title` on the cell **and** condensed into the visible malus line above. |
| `aria-label="Resources"`; 2→4 col responsive grid | ✅ (strip is 4-col, merges to 6-cell row on desktop). |

### ComputeCard.svelte → Lab compute card
| Old row | Disposition |
|---|---|
| "Compute: X PFLOPs", "(×Y optimized)" iff mult>1, "· Z in orbit" iff orbital>0 | ✅ Card header `k` + `kr`. |
| "X% locked ·" iff lock>0; "shortage −30% ·" iff shortageT>0; "$X/s opex" (toFixed 1) | ✅ |
| Training/Inference slider (alloc 0–100, aria-label) · Cheap/Costly slider (pricing, aria-label) | ✅ Range inputs styled to design; distinct accent per slider kept (green vs amber knob). |
| "revenue ×X.XX" · drift "+X%/min" green / "−X%/min" red / warn "no share growth — serving under 95% of demand" / "share steady" | ✅ |
| "X research/s" (toFixed 1) | ✅ cmpout cell. |
| **Overserving: "overserving ×X — spare capacity for cheap pricing"** iff capacity>demand, else "serving X% of demand" (red <65%) | ✅ cmpsub line, both branches. |
| **Demand breakdown: "Demand: X PFLOPs = Y base (Gen Z) +W% from your V% market share."** | ✅ Second cmpsub line. |
| demand=0 division guard | ✅ |

### ModelCard.svelte → Lab model card
All rows ✅: Gen display; Train button with `fmt` costs + disabled guard; AGI RUN
button (distinct accent style) with costs + guard; AGI state ("THE FINAL RUN.
X% — heat climbing +0.6/s, every rival is coming for you." + bar); training
state ("Training Gen X... Ys left." + **"Vulnerable to sabotage — no opsec
team."** iff !opsec + bar); idle info lines (lock %/seconds, AGI description);
TRAIN_RUNS indexing edge case.

### SciencePanel.svelte → Lab science chips
All rows ✅: both labels, live escalating costs, "+10% effective compute · now
×Y", "+10 influence · +0.5% share · −5 heat", disabled guards, 2-col grid.

### HardwarePanel.svelte → Build tab/column
All rows ✅: 6 buildings in order; price = `cost × hardwareMult` for
ground/orbital only; "Needs Gen 3" locked state (rendered + disabled); blurb +
owned count; ended-game disable; grid layout (+ grid/list setting). Sections
split Hardware / Payroll with PFLOPs and staff counts in headers (additive).

### OpsPanel.svelte → Ops tab/column
| Old row | Disposition |
|---|---|
| Header "Family business · target: {name|—}" (`currentTarget`) | ✅ Section header keeps live target name — see FLAG-2 for the targeting mechanic. |
| 7 ops: titles, blurbs (reworded to match sim where mock text lied), costLabel (pr→`$prCost`, acq→`30 inf + $acqCost`, others `N inf`), heat × heatGainMult (int or .1f), cooldown "(Ns)" | ✅ Tiles (grid/list setting) with cooldown progress bar (additive). |
| `canRunOp` disabled guards incl. sab needs target.agi≥8, acq needs share≥10 + cash | ✅ |
| Structurals: opsec / capture / cartel — labels, costs, blurbs, visibility (hide once owned), `canBuyStructural` guards | ✅ "Structure" section under ops. |

### RaceBoard.svelte → Race tab/column
| Old row | Disposition |
|---|---|
| Header warning "any lab reaching 60% share wins outright" (red) | ✅ `k` header + wincond banner. |
| Player row: name, "· gen N", "· opsec" badge, share `toFixed(1)`%, "AGI X%", **share bar (—you color)** + **AGI bar (warn color)** | ✅ Both bars per row, true scale + 60% tick on share bar. |
| Rival rows: name, sub = "gone" / **"DANGER: X% from victory"** (share≥50) / trait; share+AGI values; **share bar in rival.color**, AGI bar warn | ✅ Per-rival colors kept. |
| Click rival → `setTarget(i)`, `aria-pressed`, selected border, dead disabled | 🚩 **FLAG-2**. |
| `title` tooltip "trait — retaliates X% of the time, defense ×Y" | ✅ |
| Dead: strikethrough + dim + disabled | ✅ |
| Open market row: label, %, dim bar, non-interactive | ✅ |
| Bars clamped 0–100 true scale | ✅ |

### LogPanel.svelte → desktop log panel + mobile ticker/sheet
| Old row | Disposition |
|---|---|
| "Wire taps" heading, `aria-live="polite"`, 12 entries, min/max height + scroll | 🔁 Desktop: panel fills Race column remainder, internal scroll, full 40-entry log. Mobile: ticker (ambient, newest 6) + tap → bottom sheet with full feed. 🚩 **FLAG-3** confirms mobile shape. |

### App.svelte → responsive shell
| Old row | Disposition |
|---|---|
| Sim gating (start only after onboarding), triple timers, cleanup | ✅ Untouched controller. |
| Prompt button: label, `+$round(3 × gen × incomeMult)` preview, disabled on ended | ✅ Dock (mobile bottom / desktop slim row in Lab column) + float fx (additive). |
| 3-col composition | 🔁 4-col desktop spec above. |
| **Footer: "Tiers: 0 garage · 25 angel · 70 VC darling · 140 unicorn · 240 serial founder. Founder points persist in localStorage. Selling is winning, just smaller."** | 🔁 Tier ladder + persistence note move into the **company sheet** (with the player's current tier highlighted). 🚩 **FLAG-4** if you want the desktop footer too. |

### EventCard.svelte → dock event button + event sheet/modal
| Old row | Disposition |
|---|---|
| Renders iff event; `aria-live="polite"` + "Decision required" | ✅ Dock button region gets aria-live; sheet is the detail view. |
| Title (warn color), countdown "(Ns)" live | ✅ Button shows countdown + draining bar; sheet header shows live seconds. |
| Options call `resolveEvent(i)`; **dynamic labels** via `optionLabel` (heat × heatGainMult, prepay $ from live revenue) | ✅ |
| Timer-expiry auto-resolves **last** option (sim-side) | ✅ Sheet auto-closes when event resolves; sheet copy says the last option lands on timeout. |
| Old card was non-blocking (fixed corner, game visible) | 🔁 Mobile sheet partially covers; desktop modal blocks. 🚩 **FLAG-5**. |

### EndBanner.svelte → end overlay
All rows ✅: win/lose tones; `role="status"`; outcome text + "(+N founder pts)";
"Found a new company" → restart; "Copy result"/"Copied!" 2s toggle; share text
all four lines verbatim (headlines **with emoji** 🏆🏛️💰💀, mm:ss, gen, share,
peak heat, acquisitions pluralization, URL). 🔁 Form: full-screen overlay
(design) instead of inline banner — game state remains visible underneath at
reduced opacity.

### Onboarding.svelte → reskinned dialog
All rows ✅ verbatim: title, tagline, all four bullets, label+input (`id`,
`maxlength=24`), dice button + name pools, disabled guard, "Found {name}",
footer note, dialog aria, focus rings, rename-regenerates-state edge case.

### controller / main.ts / persistence
✅ Untouched: storage key, meta shape, settle-once, `?reset`, `window.resetFounder`,
private-mode fallbacks, `setTarget`.

### app.css / index.html
| Old row | Disposition |
|---|---|
| Palette + Space Grotesk / IBM Plex Mono | 🔁 **Replaced** by refs design system (oklch green terminal, JetBrains Mono + Space Mono) — this is the redesign itself. Rival colors (RIVAL_DEFS) kept for race bars. |
| `.num` tabular-nums; `touch-action: manipulation`; reduced-motion kill-switch; focus-visible rings | ✅ Carried into the new stylesheet. |
| Title/meta/lang | ✅ (+ `viewport-fit=cover` for safe areas). |

---

## 3. Flagged decisions (need your call)

- **FLAG-1 · Sell button placement.** Old: one-click in header with live +pts
  preview. Mock: inside company sheet only. **Proposal:** desktop app bar keeps
  a compact "Sell +Xpts" button; mobile gets it via the pts chip → company
  sheet (one extra tap). Alternative: sheet-only on both.
- **FLAG-2 · Targeting mechanic.** Old: persistent target — click a rival on the
  race board (`setTarget`), all targeted ops hit them instantly; ops header
  shows the target. Mock: pick a target per op via sheet. **Proposal: keep the
  old persistent mechanic exactly** (race rows stay clickable, aria-pressed,
  selected border; ops run instantly on the current target). The per-op picker
  is dropped. Alternative: hybrid (persistent default + a small "switch target"
  affordance on op tiles).
- **FLAG-3 · Mobile wire taps.** Proposal: ticker + tap-for-full-feed sheet (no
  log section in the Race tab). Alternative: keep a log section in the Race tab
  instead of the sheet.
- **FLAG-4 · Tier ladder text.** Proposal: company sheet only. Alternative: also
  keep the old footer line on desktop.
- **FLAG-5 · Event presentation.** Old card was non-blocking. Proposal: dock
  button (non-blocking, pulsing, countdown) + opt-in sheet/modal for choices —
  net less intrusive than the old fixed card. Alternative: desktop keeps a
  corner card like the old one instead of a modal.
- **FLAG-6 · App title on desktop.** Lab name replaces "AI Lab Mafia" in the app
  bar. OK, or keep the game title visible somewhere on desktop?
- **FLAG-7 · Event timer constant.** UI mirrors `18` with a comment, or the sim
  gets `EVENT_SECONDS = 18` extracted (behavior-identical, 3-line diff). Default:
  UI-side mirror, sim untouched.

---

## 4. Implementation order (tasks #14–#19)

1. Shell + design CSS alongside Tailwind (app keeps rendering old components).
2. Lab column (compute / model / science / dock).
3. Build + Ops.
4. Race board + wire taps.
5. Events, sheets, overlays, onboarding.
6. Verification: every table row above ticked on both breakpoints; screenshots
   mobile 390 / 1440×900 / 1920×1080 with console-error trap; injected probe
   asserting no desktop page scroll; `svelte-check` + production build clean.
