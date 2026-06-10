# AI Lab Mafia — race to AGI

An idle/strategy game: grow an AI lab from a garage to an empire, balance inference
revenue against training progress, run dirty ops on rival labs, and finish your AGI
run before anyone else finishes theirs. Selling out is winning, just smaller.

Built with Svelte 5 (runes), TypeScript, Tailwind CSS v4, and Vite.

## Run it

```bash
npm install
npm run dev      # dev server
npm run check    # svelte-check + TypeScript
npm run build    # production build to dist/
```

## Architecture

The simulation is deliberately split from the UI so the core can later be ported to
an authoritative server (e.g. the planned Rust multiplayer backend):

```
src/lib/game/          Pure simulation — no DOM, no timers, no Svelte
  types.ts             GameState, Rival, FounderMeta, ...
  constants.ts         All balance numbers in one place
  helpers.ts           Pure derived values (revenue, opex, demand, sell value, ...)
  effects.ts           Mutation primitives (log, heat, endGame, stealShare)
  events.ts            Choice-event table with effects
  sim.ts               createGame, player actions, tickSecond, tickRivals

src/lib/controller.svelte.ts   Svelte 5 runes wrapper: owns reactive state,
                               drives the three interval loops, persists founder
                               points to localStorage, settles run outcomes

src/lib/components/    Dumb view components; render state, forward intents
src/App.svelte         Layout
```

Every sim function has the shape `(state: GameState, ...args) => void` and mutates
the state it is given. The controller owns the only `$state` instance, so Svelte's
deep reactivity picks up every mutation. For multiplayer, the same functions become
the server tick: clients send intents (`runOp`, `buyBuilding`, ...), the server
applies them and broadcasts state. The only nondeterminism is `Math.random()`;
swap it for a seeded RNG carried on `GameState` if you need replay/verification.

## Game systems (v0.6)

- Three currencies: cash (operations), research (progress), influence (dirty ops)
- Compute allocation slider: inference (revenue) vs training (research)
- Pricing slider: cheap (grow share, needs spare capacity) vs costly (max margin)
- Demand scales with model generation and market share; under-serving causes churn,
  and every lab leaks a trickle of share back to the contested open market
- Model generations as committed training runs that lock compute; Gen 4 unlocks the AGI run
- Heat: ops raise it, size and acquisitions raise it passively; 40+ taxes opex,
  70+ taxes revenue, 100 = raid
- Rivals with traits, capped retaliation, AGI progress, bankruptcy, and sabotage of
  your runs; they ignore labs below 8% share (except during your AGI run)
- Risky bribery (catch chance scales with heat), choice events, structural buys
- Acquisitions gated at 10% share with an escalating antitrust premium
- Founder points prestige: garage nobody → angel-backed → VC darling → unicorn → serial founder
- Three ways to win, all racing the rival AGI clock: finish the AGI run (+100 pts),
  consolidate the industry by acquisition or 60% share (+50 pts), or sell out (full value)
- Loss conditions: rival AGI, rival 60% monopoly, bankruptcy, heat 100

## Tuning

All balance lives in `src/lib/game/constants.ts`. The intent: a first run usually
ends in a sale, and tiers + the per-point global multiplier compound until the AGI
run is genuinely winnable.
