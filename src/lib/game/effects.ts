import { settlementPreview } from './helpers';
import type { GameState, OutcomeKind } from './types';

let logId = 0;

export function pushLog(s: GameState, text: string): void {
  s.log.unshift({ id: ++logId, text });
  if (s.log.length > 40) s.log.pop();
}

export function endGame(s: GameState, kind: OutcomeKind, text: string): void {
  if (s.ended) return;
  s.ended = true;
  s.outcome = { won: kind !== 'loss', kind, text, gained: settlementPreview(s, kind), settled: false };
  pushLog(s, kind === 'loss' ? 'The wire goes quiet.' : 'The last log entry is a victory lap.');
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Apply a heat change and return the delta that actually landed, after the
 * heat-gain multiplier and the [0,100] clamp. Log lines that quote a heat
 * number must use this return value, never the requested amount.
 */
export function addHeat(s: GameState, amount: number): number {
  const before = s.heat;
  const applied = amount > 0 ? amount * s.heatGainMult : amount;
  s.heat = clamp(s.heat + applied, 0, 100);
  if (s.heat > s.peakHeat) s.peakHeat = s.heat;
  if (s.heat >= 100 && !s.ended) {
    endGame(
      s,
      'loss',
      'Heat hit 100. Federal agents carry your servers out in evidence bags. The perp walk is televised.',
    );
  }
  return s.heat - before;
}

/** Format an applied heat delta for log lines, e.g. "+4.8 heat" / "−8 heat". */
export function heatStr(applied: number): string {
  const v = Math.abs(applied);
  const num = Number.isInteger(v) ? String(v) : v.toFixed(1);
  return `${applied < 0 ? '−' : '+'}${num} heat`;
}

/** Move up to `amount` share from a rival to the player. Returns the amount moved. */
export function stealShare(s: GameState, amount: number, from: { share: number }): number {
  const got = Math.min(amount, from.share);
  from.share -= got;
  s.share += got;
  return got;
}
