<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { MONOPOLY_SHARE } from '../game/constants';

  let { g }: { g: GameController } = $props();

  interface Lab {
    name: string;
    sub: string;
    danger: boolean;
    tip?: string;
    color?: string;
    share: number;
    agi: number;
    alive: boolean;
    you: boolean;
  }

  const labs = $derived<Lab[]>(
    [
      {
        name: g.meta.labName || 'Your lab',
        sub: `gen ${g.state.gen}${g.state.opsec ? ' · opsec' : ''}`,
        danger: false,
        share: g.state.share,
        agi: g.state.agiProgress ?? 0,
        alive: true,
        you: true,
      },
      ...g.state.rivals.map((r) => {
        const dead = r.share <= 0.05;
        return {
          name: r.name,
          sub: dead
            ? 'gone'
            : r.share >= 50
              ? `DANGER: ${(MONOPOLY_SHARE - r.share).toFixed(1)}% from victory`
              : r.trait,
          danger: !dead && r.share >= 50,
          tip: `${r.trait} — retaliates ${Math.round(r.retaliation * 100)}% of the time, defense ×${r.defense}`,
          color: r.color,
          share: r.share,
          agi: r.agi,
          alive: !dead,
          you: false,
        };
      }),
    ].sort((a, b) => Number(b.alive) - Number(a.alive) || b.share - a.share),
  );

  const pct = (v: number) => Math.max(0, Math.min(100, v));
</script>

<section class="section" aria-label="The AGI race">
  <div class="section-title">The AGI race<span class="section-alert">First to {MONOPOLY_SHARE}% market share wins</span></div>
  <div class="card">
    {#each labs as l, i (l.name)}
      <div class="rival-row" class:you={l.you} class:dead={!l.alive} title={l.tip}>
        <span class="rival-rank num">{l.alive ? i + 1 : '—'}</span>
        <div class="rival-body">
          <div class="rival-head">
            <span class="rival-name">{l.name} <small class:danger={l.danger}>· {l.sub}</small></span>
            <span class="rival-stats num">{l.share.toFixed(1)}% · AGI {Math.floor(l.agi)}%</span>
          </div>
          <div class="share-bar win-tick">
            <i style:width="{l.alive ? pct(l.share) : 0}%" style:background={l.alive ? l.color : undefined}></i>
          </div>
          <div class="agi-bar"><i style:width="{l.alive ? pct(l.agi) : 0}%"></i></div>
        </div>
      </div>
    {/each}
    <div class="rival-row open-market">
      <span class="rival-rank num">~</span>
      <div class="rival-body">
        <div class="rival-head">
          <span class="rival-name">Open market <small>· up for grabs</small></span>
          <span class="rival-stats num">{g.state.openMarket.toFixed(1)}%</span>
        </div>
        <div class="share-bar"><i style:width="{pct(g.state.openMarket)}%"></i></div>
      </div>
    </div>
  </div>
  <div class="win-note">
    ⚑ Thick bar = market share (tick = {MONOPOLY_SHARE}% win line) · thin bar = AGI progress · first to <b>AGI 100%</b> or <b>{MONOPOLY_SHARE}% share</b> takes it all
  </div>
</section>
