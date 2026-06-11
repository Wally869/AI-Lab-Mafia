/**
 * UI-only state: active tab, open sheet, toast, and presentation settings.
 * Nothing here touches the simulation; it persists separately from founder
 * meta so wiping a save keeps your accent color.
 */
import type { GameController } from './controller.svelte';
import type { OpKey } from './game/types';

export type Tab = 'lab' | 'build' | 'ops' | 'race';

export type SheetState =
  | { kind: 'event' }
  | { kind: 'target'; op: OpKey }
  | { kind: 'company' }
  | { kind: 'settings' }
  | { kind: 'log' }
  | null;

export interface UiSettings {
  /** Accent hue for the oklch terminal color. */
  accH: number;
  juice: 'low' | 'med' | 'high';
  density: 'cozy' | 'compact';
  numfmt: 'short' | 'full';
  cardLayout: 'grid' | 'list';
}

const SETTINGS_KEY = 'ai-lab-mafia.ui';

const DEFAULTS: UiSettings = { accH: 152, juice: 'med', density: 'cozy', numfmt: 'short', cardLayout: 'grid' };

function loadSettings(): UiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UiSettings>) };
  } catch {
    // Private mode or corrupted storage: defaults.
  }
  return { ...DEFAULTS };
}

class UiState {
  settings = $state<UiSettings>(loadSettings());
  tab = $state<Tab>('lab');
  sheet = $state<SheetState>(null);
  toastText = $state<string | null>(null);

  #toastTimer: ReturnType<typeof setTimeout> | undefined;

  set<K extends keyof UiSettings>(key: K, value: UiSettings[K]): void {
    this.settings[key] = value;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Best effort only.
    }
  }

  open(sheet: NonNullable<SheetState>): void {
    this.sheet = sheet;
  }

  close(): void {
    this.sheet = null;
  }

  toast(text: string): void {
    this.toastText = text;
    clearTimeout(this.#toastTimer);
    this.#toastTimer = setTimeout(() => (this.toastText = null), 2600);
  }
}

export const ui = new UiState();

/** Big numbers: 1.23k / 12.3k / 9.11M per the "short" setting, locale-full otherwise. */
export function fmt(n: number): string {
  n = Math.floor(n);
  if (ui.settings.numfmt === 'full') return n.toLocaleString('en-US');
  const a = Math.abs(n);
  if (a >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e4) return (n / 1e3).toFixed(1) + 'k';
  if (a >= 1e3) return (n / 1e3).toFixed(2) + 'k';
  return n.toLocaleString('en-US');
}

/**
 * Per-second flows (revenue, opex): one decimal below 1k so the early game
 * isn't rounded to nothing, short/full formatting above.
 */
export function fmtFlow(n: number): string {
  return Math.abs(n) < 1000 ? n.toFixed(1) : fmt(n);
}

/** Signed cash rate: +$86.1k/s, −$12.4/s (Unicode minus, like the old UI). */
export function fmtCashRate(n: number): string {
  const sign = n >= 0 ? '+' : '−';
  return `${sign}$${fmtFlow(Math.abs(n))}/s`;
}

/**
 * Run a player intent and surface the log line it produced (if any) as a
 * toast — the sim already narrates everything through the wire taps.
 */
export function act(g: GameController, fn: () => void): void {
  const before = g.state.log[0]?.id ?? 0;
  fn();
  const head = g.state.log[0];
  if (head && head.id !== before) ui.toast(head.text);
}
