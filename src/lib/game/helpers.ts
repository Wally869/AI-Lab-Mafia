import { ECON, GENS, POINTS_MULT_CAP, POINTS_MULT_DIVISOR, TIERS } from './constants';
import type { GameState, OutcomeKind } from './types';

export function tierIndex(points: number): number {
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (points >= TIERS[i].min) idx = i;
  }
  return idx;
}

export function pointsMult(points: number): number {
  return Math.min(POINTS_MULT_CAP, 1 + points / POINTS_MULT_DIVISOR);
}

export function totalCompute(s: GameState): number {
  return s.groundCompute + s.orbitalCompute;
}

export function lockFraction(s: GameState): number {
  return (s.training?.lock ?? 0) + (s.agiProgress !== null ? 0.7 : 0);
}

export function effectiveCompute(s: GameState): number {
  const base = totalCompute(s) * s.computeMult * (1 - lockFraction(s));
  return s.shortageT > 0 ? base * 0.7 : base;
}

export function shareDemandBonus(s: GameState): number {
  return s.share * ECON.shareDemandBonus;
}

export function demand(s: GameState): number {
  return GENS[s.gen - 1].demand * (1 + shareDemandBonus(s));
}

export function inferenceCapacity(s: GameState): number {
  return (effectiveCompute(s) * s.alloc) / 100;
}

export function servedFraction(s: GameState): number {
  const d = demand(s);
  return d > 0 ? Math.min(1, inferenceCapacity(s) / d) : 1;
}

/** Revenue multiplier from the cheap↔costly pricing slider. */
export function priceMult(s: GameState): number {
  return ECON.pricingRevenueMin + (s.pricing / 100) * (ECON.pricingRevenueMax - ECON.pricingRevenueMin);
}

/**
 * Passive market-share drift per second from pricing. Cheap pricing only
 * attracts customers while you can actually serve them (≥ pricingServeFloor).
 */
export function pricingShareDrift(s: GameState): number {
  if (s.pricing < 50) {
    if (servedFraction(s) < ECON.pricingServeFloor) return 0;
    return ((50 - s.pricing) / 50) * ECON.pricingCheapDriftMax;
  }
  if (s.pricing > 50) {
    return -((s.pricing - 50) / 50) * ECON.pricingCostlyDriftMax;
  }
  return 0;
}

export function revenue(s: GameState): number {
  const base =
    Math.min(inferenceCapacity(s), demand(s)) * GENS[s.gen - 1].price * s.incomeMult * priceMult(s);
  return s.heat >= ECON.heatRevenueThreshold ? base * ECON.heatRevenuePenalty : base;
}

export function opex(s: GameState): number {
  const base =
    (s.groundCompute * ECON.groundOpexPerPflop + s.orbitalCompute * ECON.orbitalOpexPerPflop) * s.opexMult +
    s.researchers * ECON.researcherSalary +
    s.lobbyists * ECON.lobbyistSalary;
  return s.heat >= ECON.heatOpexThreshold ? base * ECON.heatOpexPenalty : base;
}

export function netCashFlow(s: GameState): number {
  return revenue(s) - opex(s);
}

export function researchRate(s: GameState): number {
  const fromCompute = (effectiveCompute(s) * (1 - s.alloc / 100)) * ECON.trainingResearchPerPflop;
  const base = (fromCompute + s.researchers) * s.researchMult;
  return s.brainDrainT > 0 ? base * 0.5 : base;
}

export function influenceRate(s: GameState): number {
  return s.lobbyists * ECON.lobbyistInfluence;
}

export function sellValue(s: GameState): number {
  return Math.floor(
    s.share * 1.5 +
      (s.gen - 1) * 15 +
      Math.min(s.cash / 4000, 50) +
      (s.agiProgress ?? 0) * 0.3,
  );
}

/**
 * Founder points paid for ending a run a given way. The single source of
 * truth: every button preview and endGame() payout reads from here.
 */
export function settlementPreview(s: GameState, kind: OutcomeKind): number {
  switch (kind) {
    case 'agi':
      return sellValue(s) + 100;
    case 'consolidation':
      return sellValue(s) + 50;
    case 'sale':
      return sellValue(s);
    case 'loss':
      return Math.floor(sellValue(s) * 0.5);
  }
}

export function prCost(s: GameState): number {
  return 400 * s.gen * Math.pow(1.1, s.prUses);
}

export function aliveRivals(s: GameState) {
  return s.rivals.filter((r) => r.share > 0.05);
}

export function currentTarget(s: GameState) {
  const direct = s.rivals[s.targetIdx];
  if (direct && direct.share > 0.05) return direct;
  const a = aliveRivals(s);
  if (a.length === 0) return null;
  return a.reduce((x, y) => (x.share > y.share ? x : y));
}

export function weakestRival(s: GameState) {
  const a = aliveRivals(s);
  if (a.length === 0) return null;
  return a.reduce((x, y) => (x.share < y.share ? x : y));
}

export function acquisitionCost(s: GameState): number {
  const w = weakestRival(s);
  if (!w) return 0;
  // Floor stops dying rivals from being free; 2^n is the antitrust premium.
  return Math.floor(
    Math.max(w.share, ECON.acqCostShareFloor) * w.defense * 1100 * Math.pow(2, s.acquisitions),
  );
}

export const fmt = (n: number): string => Math.floor(n).toLocaleString('en-US');
