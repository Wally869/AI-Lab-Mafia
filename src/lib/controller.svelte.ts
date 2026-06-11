import { EVENT_TICK_MS, RIVAL_TICK_MS, TICK_MS } from './game/constants';
import {
  answerPrompt,
  buyBuilding,
  buyScience,
  buyStructural,
  createGame,
  maybeSpawnEvent,
  resolveEvent,
  runOp,
  sellCompany,
  startTraining,
  tickRivals,
  tickSecond,
} from './game/sim';
import type { FounderMeta, GameState, OpKey, StructuralKey } from './game/types';

const STORAGE_KEY = 'ai-lab-mafia.founder';
const RUN_KEY = 'ai-lab-mafia.run';
/** Bump when GameState's shape changes so stale saves are discarded. */
const RUN_VERSION = 1;
const RUN_SAVE_MS = 5000;

function loadMeta(): FounderMeta {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FounderMeta>;
      if (typeof parsed.points === 'number') {
        return {
          points: parsed.points,
          runs: parsed.runs ?? 1,
          labName: typeof parsed.labName === 'string' ? parsed.labName : '',
        };
      }
    }
  } catch {
    // Private mode or corrupted storage: fall through to defaults.
  }
  return { points: 0, runs: 1, labName: '' };
}

function saveMeta(meta: FounderMeta): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Best effort only.
  }
}

/** Restore a mid-run autosave, or null if absent, stale, or already over. */
function loadRun(): GameState | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: number; state?: GameState };
    if (parsed.v !== RUN_VERSION) return null;
    const s = parsed.state;
    if (!s || typeof s.cash !== 'number' || s.ended) return null;
    return s;
  } catch {
    return null;
  }
}

function saveRun(state: GameState): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify({ v: RUN_VERSION, state }));
  } catch {
    // Best effort only.
  }
}

function clearRun(): void {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    // Best effort only.
  }
}

/**
 * Wipe persisted founder progress and restart fresh. Exposed on `window` as
 * a dev helper; also reachable via the `?reset` URL param. Navigates to the
 * bare path (rather than reloading) so `?reset` can't loop.
 */
export function resetFounder(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RUN_KEY);
  location.replace(location.pathname);
}

export class GameController {
  meta = $state<FounderMeta>(loadMeta());
  state = $state<GameState>(loadRun() ?? createGame(loadMeta()));
  /** True until the lab is named; also reopenable later as a help panel. */
  showOnboarding = $state(loadMeta().labName === '');

  #timers: ReturnType<typeof setInterval>[] = [];
  #persistRun = (): void => {
    if (!this.state.ended) saveRun($state.snapshot(this.state));
  };

  start(): void {
    this.stop();
    this.#timers = [
      setInterval(() => this.#withSettle(tickSecond), TICK_MS),
      setInterval(() => this.#withSettle(tickRivals), RIVAL_TICK_MS),
      setInterval(() => this.#withSettle(maybeSpawnEvent), EVENT_TICK_MS),
      setInterval(this.#persistRun, RUN_SAVE_MS),
    ];
    window.addEventListener('pagehide', this.#persistRun);
  }

  stop(): void {
    for (const t of this.#timers) clearInterval(t);
    this.#timers = [];
    window.removeEventListener('pagehide', this.#persistRun);
  }

  /** Apply the run's outcome to founder meta exactly once. */
  #settle(): void {
    const o = this.state.outcome;
    if (o && !o.settled) {
      o.settled = true;
      this.meta.points += o.gained;
      this.meta.runs += 1;
      saveMeta(this.meta);
      // The run is over: a reload should start fresh, not replay the ending.
      clearRun();
    }
  }

  #withSettle(fn: (s: GameState) => void): void {
    fn(this.state);
    this.#settle();
  }

  // Intents forwarded to the pure sim.
  answerPrompt = () => this.#withSettle(answerPrompt);
  buyBuilding = (i: number) => this.#withSettle((s) => buyBuilding(s, i));
  buyScience = (i: 0 | 1) => this.#withSettle((s) => buyScience(s, i));
  startTraining = () => this.#withSettle(startTraining);
  runOp = (key: OpKey) => this.#withSettle((s) => runOp(s, key));
  buyStructural = (key: StructuralKey) => this.#withSettle((s) => buyStructural(s, key));
  sellCompany = () => this.#withSettle(sellCompany);
  resolveEvent = (i: number) => this.#withSettle((s) => resolveEvent(s, i));
  setTarget = (i: number) => {
    this.state.targetIdx = i;
  };

  restart = (): void => {
    clearRun();
    this.state = createGame(this.meta);
  };

  /** Name (or rename) the lab and make sure the sim is running. */
  completeOnboarding = (name: string): void => {
    const trimmed = name.trim().slice(0, 24);
    if (trimmed.length === 0) return;
    const renamed = trimmed !== this.meta.labName;
    this.meta.labName = trimmed;
    saveMeta(this.meta);
    // Before the first tick, regenerate so the founding log carries the name.
    if (renamed && this.state.ticks === 0 && !this.state.ended) {
      this.state = createGame(this.meta);
    }
    this.showOnboarding = false;
    this.start();
  };
}
