<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { ECON } from '../game/constants';
  import { influenceRate, netCashFlow, researchRate, totalCompute } from '../game/helpers';
  import { fmt, fmtCashRate } from '../ui.svelte';

  let { g }: { g: GameController } = $props();

  const net = $derived(netCashFlow(g.state));
  const heat = $derived(g.state.heat);
  const heatClass = $derived(heat >= ECON.heatRevenueThreshold ? 'hot' : heat >= ECON.heatOpexThreshold ? 'warm' : 'cool');
  // Same four states the old UI explained in its tooltip — kept as title AND
  // condensed into the visible malus line.
  const heatMsg = $derived(
    heat >= 70
      ? 'Under investigation: revenue −25%, rivals smell blood, heat decays slowly.'
      : heat >= 40
        ? 'Compliance audits: opex +25%. Regulators are circling.'
        : g.state.share > 30
          ? 'Your size alone draws scrutiny now. Heat accrues passively.'
          : "Regulators aren't watching. Yet.",
  );
</script>

<section class="resources" aria-label="Resources">
  <div class="stat">
    <div class="stat-label">Cash</div>
    <div class="stat-value num">${fmt(g.state.cash)}</div>
    <div class="stat-delta {net < 0 ? 'neg' : ''}">{fmtCashRate(net)}</div>
  </div>
  <div class="stat">
    <div class="stat-label">Research</div>
    <div class="stat-value num">{fmt(g.state.research)}</div>
    <div class="stat-delta">+{researchRate(g.state).toFixed(1)}/s</div>
  </div>
  <div class="stat">
    <div class="stat-label">Influence</div>
    <div class="stat-value num">{fmt(g.state.influence)}</div>
    <div class="stat-delta">+{influenceRate(g.state).toFixed(1)}/s</div>
  </div>
  <div class="stat">
    <div class="stat-label">PFLOPs</div>
    <div class="stat-value num">{fmt(totalCompute(g.state))}</div>
    {#if g.state.orbitalCompute > 0}
      <div class="stat-delta">{fmt(g.state.groundCompute)} gnd · {fmt(g.state.orbitalCompute)} orb</div>
    {:else if g.state.computeMult > 1}
      <div class="stat-delta">×{g.state.computeMult.toFixed(1)} optimized</div>
    {/if}
  </div>
  <div class="stat heat" title={heatMsg}>
    <div class="stat-label">Heat</div>
    <div class="heat-row"><span class="heat-value num {heatClass}">{Math.round(heat)}</span><span class="heat-cap">/100</span></div>
    <div
      class="heat-bar"
      role="meter"
      aria-valuenow={Math.round(heat)}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Regulator heat"
    >
      <i class={heatClass} style:width="{heat}%"></i>
    </div>
    {#if heat >= ECON.heatRevenueThreshold}
      <div class="heat-status">−25% rev · +25% opex</div>
    {:else if heat >= ECON.heatOpexThreshold}
      <div class="heat-status">+25% opex</div>
    {:else if g.state.share > 30}
      <div class="heat-status quiet">size draws scrutiny</div>
    {:else}
      <div class="heat-status quiet">stable · 100 = raid</div>
    {/if}
  </div>
</section>
