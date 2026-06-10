<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { fmt, influenceRate, netCashFlow, researchRate } from '../game/helpers';

  let { g }: { g: GameController } = $props();

  const net = $derived(netCashFlow(g.state));
  const heat = $derived(g.state.heat);
  const heatColor = $derived(heat >= 70 ? 'var(--color-bad)' : heat >= 40 ? 'var(--color-warn)' : 'var(--color-ok)');
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

<section aria-label="Resources" class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
  <div class="panel">
    <p class="label">Cash</p>
    <p class="num text-xl font-medium">${fmt(g.state.cash)}</p>
    <p class="num text-xs" style:color={net >= 0 ? 'var(--color-ok)' : 'var(--color-bad)'}>
      {net >= 0 ? '+' : '−'}${fmt(Math.abs(net))}/s
    </p>
  </div>
  <div class="panel">
    <p class="label">Research</p>
    <p class="num text-xl font-medium">{fmt(g.state.research)}</p>
    <p class="num text-xs text-mut">{researchRate(g.state).toFixed(1)}/s</p>
  </div>
  <div class="panel">
    <p class="label">Influence</p>
    <p class="num text-xl font-medium">{fmt(g.state.influence)}</p>
    <p class="num text-xs text-mut">{influenceRate(g.state).toFixed(1)}/s</p>
  </div>
  <div class="panel">
    <p class="label">Heat</p>
    <p class="num text-xl font-medium">{Math.round(heat)}</p>
    <p class="num text-xs text-mut">
      {heat >= 70 ? '−25% revenue!' : heat >= 40 ? '+25% opex!' : '100 = game over'}
    </p>
  </div>
</section>

<div class="mb-4">
  <div class="h-2 overflow-hidden rounded-full bg-raise" role="meter" aria-valuenow={Math.round(heat)} aria-valuemin="0" aria-valuemax="100" aria-label="Regulator heat">
    <div class="h-full transition-all duration-500" style:width="{heat}%" style:background={heatColor}></div>
  </div>
  <p class="mt-1 text-xs text-dim">{heatMsg}</p>
</div>
