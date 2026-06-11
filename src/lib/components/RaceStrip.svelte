<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { aliveRivals } from '../game/helpers';

  let { g }: { g: GameController } = $props();

  function ord(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  interface Entry {
    name: string;
    share: number;
    agi: number;
    you: boolean;
  }

  const ranked = $derived<Entry[]>(
    [
      { name: 'you', share: g.state.share, agi: g.state.agiProgress ?? 0, you: true },
      ...aliveRivals(g.state).map((r) => ({ name: r.name, share: r.share, agi: r.agi, you: false })),
    ].sort((a, b) => b.share - a.share),
  );
  const youRank = $derived(ranked.findIndex((l) => l.you) + 1);
  const youLead = $derived(youRank === 1);
  // When a rival is winning, show them as the leader; when you lead, show
  // who's breathing down your neck instead.
  const other = $derived(youLead ? ranked[1] : ranked[0]);
  const otherRank = $derived(other ? ranked.indexOf(other) + 1 : 0);
</script>

<section class="racebar" aria-label="The race">
  <div class="race-cell you">
    <div class="race-head"><span>Your lab — <b>{youLead ? 'leading' : 'chasing'}</b></span><span>{ord(youRank)}</span></div>
    <div class="race-value num">{g.state.share.toFixed(1)}% mkt<small>AGI {Math.floor(g.state.agiProgress ?? 0)}%</small></div>
    <div class="race-bar win-tick"><i style:width="{Math.min(100, Math.max(0, g.state.share))}%"></i></div>
  </div>
  <div class="race-cell">
    <div class="race-head">
      <span>{youLead ? 'Runner-up' : 'Leader'} — <b>{other?.name ?? '—'}</b></span>
      <span>{other ? ord(otherRank) : '—'}</span>
    </div>
    <div class="race-value num">{(other?.share ?? 0).toFixed(1)}% mkt<small>AGI {Math.floor(other?.agi ?? 0)}%</small></div>
    <div class="race-bar win-tick"><i style:width="{Math.min(100, Math.max(0, other?.share ?? 0))}%"></i></div>
  </div>
</section>
