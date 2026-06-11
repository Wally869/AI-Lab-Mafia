<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import type { GameController } from '../controller.svelte';
  import { OP_COOLDOWNS, TIERS } from '../game/constants';
  import { EVENTS, optionLabel } from '../game/events';
  import { settlementPreview, tierIndex } from '../game/helpers';
  import { canRunOp } from '../game/sim';
  import { OP_META, opCostLabel, opHeatLabel, pickable } from '../opmeta';
  import { act, ui } from '../ui.svelte';

  let { g }: { g: GameController } = $props();

  const ev = $derived(g.state.event ? EVENTS[g.state.event.index] : null);
  const targetOp = $derived.by(() => {
    const sh = ui.sheet;
    if (sh?.kind !== 'target') return null;
    return OP_META.find((o) => o.key === sh.op) ?? null;
  });

  // Rivals with their original index (setTarget is index-based), alive first by share.
  const rivals = $derived(
    g.state.rivals
      .map((r, i) => ({ r, i }))
      .sort((a, b) => Number(b.r.share > 0.05) - Number(a.r.share > 0.05) || b.r.share - a.r.share),
  );
  const topShare = $derived(Math.max(...g.state.rivals.map((r) => r.share)));

  function pickTarget(i: number): void {
    if (!targetOp) return;
    const key = targetOp.key;
    g.setTarget(i);
    act(g, () => g.runOp(key));
    ui.close();
  }

  const tierIdx = $derived(tierIndex(g.meta.points));
  const nextTier = $derived(TIERS[tierIdx + 1]);

  const HUES: [string, number][] = [
    ['Terminal green', 152],
    ['Cyan', 200],
    ['Amber', 80],
    ['Magenta', 330],
  ];
  const JUICE = [['low', 'Low'], ['med', 'Med'], ['high', 'Juicy']] as const;
  const DENSITY = [['cozy', 'Cozy'], ['compact', 'Compact']] as const;
  const CARDS = [['grid', 'Grid'], ['list', 'List']] as const;
  const NUMFMT = [['short', '9.1M'], ['full', '9,110,610']] as const;
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && ui.close()} />

{#if ui.sheet}
  <div class="scrim" transition:fade={{ duration: 160 }} onclick={() => ui.close()} role="presentation"></div>
  <div class="sheet" transition:fly={{ y: 420, duration: 260 }} role="dialog" aria-modal="true">
    <div class="grab-handle"></div>

    {#if ui.sheet.kind === 'event' && ev && g.state.event}
      <h3>{ev.title}</h3>
      <div class="sheet-sub"><b>{g.state.event.secondsLeft}s</b> to decide — stall and the last option lands on its own.</div>
      {#each ev.options as opt, i (i)}
        <button
          class="btn sm {i === 0 ? 'full' : ''}"
          style="margin-bottom:9px"
          onclick={() => {
            act(g, () => g.resolveEvent(i));
            ui.close();
          }}
        >
          {optionLabel(opt, g.state)}
        </button>
      {/each}
    {:else if ui.sheet.kind === 'target' && targetOp}
      <h3>{targetOp.name} — pick a target</h3>
      <div class="sheet-sub">
        costs <b class="good">{opCostLabel(g.state, targetOp.key).text}</b>
        {#if targetOp.heat !== undefined}· {opHeatLabel(g.state, targetOp.heat)}{/if}
        · {OP_COOLDOWNS[targetOp.key]}s cooldown — {targetOp.sub}
      </div>
      {#each rivals as { r, i } (r.name)}
        {#if r.share > 0.05}
          {@const ok = canRunOp(g.state, targetOp.key) && pickable(targetOp.key, r)}
          <div class="target-row" title="{r.trait} — retaliates {Math.round(r.retaliation * 100)}% of the time, defense ×{r.defense}">
            <div class="target-body">
              <div class="target-name">{r.name}</div>
              <div class="target-sub">
                {r.share.toFixed(1)}% share · AGI {Math.floor(r.agi)}% · {r.trait}{r.share === topShare ? ' — front-runner' : ''}
                {#if targetOp.key === 'sab' && r.agi < 8}<span class="why"> · AGI too low to sabotage</span>{/if}
              </div>
              <div class="target-bar"><i style:width="{Math.min(100, r.share)}%" style:background={r.color}></i></div>
            </div>
            <button class="target-btn" disabled={!ok} onclick={() => pickTarget(i)}>TARGET</button>
          </div>
        {:else}
          <div class="target-row dead">
            <div class="target-body">
              <div class="target-name">{r.name} — gone</div>
              <div class="target-sub">out of the game</div>
            </div>
            <button class="target-btn">TARGET</button>
          </div>
        {/if}
      {/each}
    {:else if ui.sheet.kind === 'company'}
      <h3>{g.meta.labName || 'Your lab'}</h3>
      <div class="sheet-sub">
        {g.state.tierName} · run #{g.state.runNumber}
        {#if nextTier}· next tier at <b class="good">{nextTier.min} pts</b>{:else}· max tier reached{/if}
      </div>
      <div class="stat-boxes">
        <div class="box"><div class="box-label">Founder pts</div><div class="box-value num g">{g.meta.points}</div></div>
        <div class="box"><div class="box-label">This run</div><div class="box-value num">#{g.state.runNumber}</div></div>
        <div class="box"><div class="box-label">Market share</div><div class="box-value num g">{g.state.share.toFixed(1)}%</div></div>
        <div class="box"><div class="box-label">Model</div><div class="box-value num">Gen {g.state.gen}</div></div>
      </div>
      <button
        class="btn full"
        class:disabled={g.state.ended}
        onclick={() => {
          g.sellCompany();
          ui.close();
        }}
      >
        Sell company · bank +{settlementPreview(g.state, 'sale')} founder pts
      </button>
      <div class="sheet-sub" style="margin-top:10px;text-align:center">
        Cash out for prestige and start a fresh, faster run. Founder points carry over and boost every future company.
      </div>
      <div class="tier-note">
        Tiers: <b>0</b> garage · <b>25</b> angel · <b>70</b> VC darling · <b>140</b> unicorn · <b>240</b> serial founder.<br />
        Founder points persist in your browser. Selling is winning, just smaller.
      </div>
    {:else if ui.sheet.kind === 'settings'}
      <h3>Settings</h3>
      <div class="sheet-sub">Tune the build — changes apply live.</div>
      <div class="setting-row">
        <div class="setting-label">Accent<small>terminal hue</small></div>
        <div class="swatches">
          {#each HUES as [label, h] (h)}
            <button
              class="swatch"
              class:on={ui.settings.accH === h}
              style="background:oklch(0.82 0.15 {h})"
              title={label}
              aria-label={label}
              onclick={() => ui.set('accH', h)}
            ></button>
          {/each}
        </div>
      </div>
      <div class="setting-row">
        <div class="setting-label">Juice<small>motion &amp; feedback</small></div>
        <div class="seg">
          {#each JUICE as [v, l] (v)}
            <button class:on={ui.settings.juice === v} onclick={() => ui.set('juice', v)}>{l}</button>
          {/each}
        </div>
      </div>
      <div class="setting-row">
        <div class="setting-label">Density</div>
        <div class="seg">
          {#each DENSITY as [v, l] (v)}
            <button class:on={ui.settings.density === v} onclick={() => ui.set('density', v)}>{l}</button>
          {/each}
        </div>
      </div>
      <div class="setting-row">
        <div class="setting-label">Cards<small>Build &amp; Family business layout</small></div>
        <div class="seg">
          {#each CARDS as [v, l] (v)}
            <button class:on={ui.settings.cardLayout === v} onclick={() => ui.set('cardLayout', v)}>{l}</button>
          {/each}
        </div>
      </div>
      <div class="setting-row">
        <div class="setting-label">Numbers<small>$9.1M vs $9,110,610</small></div>
        <div class="seg">
          {#each NUMFMT as [v, l] (v)}
            <button class:on={ui.settings.numfmt === v} onclick={() => ui.set('numfmt', v)}>{l}</button>
          {/each}
        </div>
      </div>
      <div class="setting-row">
        <div class="setting-label">Run<small>abandon this run, keep founder pts</small></div>
        <button
          class="btn sm"
          style="width:auto;padding:8px 14px"
          onclick={() => {
            g.restart();
            ui.close();
            ui.toast('New company founded. The garage smells of ambition.');
          }}
        >
          Restart run
        </button>
      </div>
    {:else if ui.sheet.kind === 'log'}
      <h3>Wire taps</h3>
      <div class="sheet-sub">Everything the feed picked up this run, newest first.</div>
      <div class="log-card" style="max-height:none" aria-live="polite">
        {#each g.state.log as entry (entry.id)}
          <p>{entry.text}</p>
        {/each}
      </div>
    {/if}
  </div>
{/if}
