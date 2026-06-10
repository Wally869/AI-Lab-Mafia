import { sellValue } from './helpers';
import type { GameState } from './types';

let logId = 0;

export function pushLog(s: GameState, text: string): void {
  s.log.unshift({ id: ++logId, text });
  if (s.log.length > 40) s.log.pop();
}

export function endGame(s: GameState, won: boolean, text: string): void {
  if (s.ended) return;
  s.ended = true;
  const gained = won ? sellValue(s) + 100 : Math.floor(sellValue(s) * 0.5);
  s.outcome = { won, text, gained, settled: false };
  pushLog(s, won ? 'The last log entry is a victory lap.' : 'The wire goes quiet.');
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function addHeat(s: GameState, amount: number): void {
  const applied = amount > 0 ? amount * s.heatGainMult : amount;
  s.heat = clamp(s.heat + applied, 0, 100);
  if (s.heat >= 100 && !s.ended) {
    endGame(
      s,
      false,
      'Heat hit 100. Federal agents carry your servers out in evidence bags. The perp walk is televised.',
    );
  }
}

/** Move up to `amount` share from a rival to the player. Returns the amount moved. */
export function stealShare(s: GameState, amount: number, from: { share: number }): number {
  const got = Math.min(amount, from.share);
  from.share -= got;
  s.share += got;
  return got;
}
