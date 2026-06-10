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

function loadMeta(): FounderMeta {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FounderMeta>;
      if (typeof parsed.points === 'number') {
        return { points: parsed.points, runs: parsed.runs ?? 1 };
      }
    }
  } catch {
    // Private mode or corrupted storage: fall through to defaults.
  }
  return { points: 0, runs: 1 };
}

function saveMeta(meta: FounderMeta): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Best effort only.
  }
}

export class GameController {
  meta = $state<FounderMeta>(loadMeta());
  state = $state<GameState>(createGame(loadMeta()));

  #timers: ReturnType<typeof setInterval>[] = [];

  start(): void {
    this.stop();
    this.#timers = [
      setInterval(() => this.#withSettle(tickSecond), TICK_MS),
      setInterval(() => this.#withSettle(tickRivals), RIVAL_TICK_MS),
      setInterval(() => this.#withSettle(maybeSpawnEvent), EVENT_TICK_MS),
    ];
  }

  stop(): void {
    for (const t of this.#timers) clearInterval(t);
    this.#timers = [];
  }

  /** Apply the run's outcome to founder meta exactly once. */
  #settle(): void {
    const o = this.state.outcome;
    if (o && !o.settled) {
      o.settled = true;
      this.meta.points += o.gained;
      this.meta.runs += 1;
      saveMeta(this.meta);
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
    this.state = createGame(this.meta);
  };
}
