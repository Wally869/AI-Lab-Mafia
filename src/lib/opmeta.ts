/** Display metadata for dirty ops, shared by the Ops tab and the target picker. */
import { OP_INFLUENCE_COSTS } from './game/constants';
import { acquisitionCost, prCost } from './game/helpers';
import type { GameState, OpKey, Rival } from './game/types';
import { fmt } from './ui.svelte';

export interface OpMeta {
  key: OpKey;
  name: string;
  sub: string;
  /** Base heat, shown after the heat-gain multiplier. Negative = cools you. */
  heat?: number;
  /** Whether the op needs a rival picked first. */
  target: boolean;
  tag?: string;
}

export const OP_META: OpMeta[] = [
  { key: 'pr',    name: 'Marketing blitz', sub: 'grab share — open market first, then rivals',  heat: 2,  target: false, tag: 'instant' },
  { key: 'poach', name: 'Poach team',      sub: 'steal share + research',                       heat: 6,  target: true },
  { key: 'spy',   name: 'Espionage',       sub: 'steal research, target AGI −3',                heat: 10, target: true },
  { key: 'smear', name: 'Smear',           sub: 'target bleeds share',                          heat: 12, target: true },
  { key: 'sab',   name: 'Sabotage run',    sub: 'target AGI −8 · needs target AGI ≥8',          heat: 15, target: true },
  { key: 'bribe', name: 'Bribe regulator', sub: '−30 heat... if it works',                                target: false, tag: 'self' },
  { key: 'acq',   name: 'Acquire weakest', sub: 'absorb them · needs 10% share · income +15%',  heat: 20, target: false, tag: 'auto' },
];

export function opCostLabel(s: GameState, key: OpKey): { text: string; inf: boolean } {
  if (key === 'pr') return { text: `$${fmt(prCost(s))}`, inf: false };
  if (key === 'acq') return { text: `${OP_INFLUENCE_COSTS.acq} inf + $${fmt(acquisitionCost(s))}`, inf: true };
  return { text: `${OP_INFLUENCE_COSTS[key]} inf`, inf: true };
}

/** Heat number after the heat-gain multiplier, formatted like the old UI. */
export function opHeatLabel(s: GameState, base: number): string {
  const v = base > 0 ? base * s.heatGainMult : base;
  const a = Math.abs(v);
  return `${v < 0 ? '−' : '+'}${Number.isInteger(a) ? a : a.toFixed(1)} heat`;
}

/** Whether a specific rival is a valid pick for a targeted op. */
export function pickable(key: OpKey, r: Rival): boolean {
  if (r.share <= 0.05) return false;
  if (key === 'sab') return r.agi >= 8;
  return true;
}
