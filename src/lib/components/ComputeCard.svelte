<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { GENS } from '../game/constants';
  import {
    demand,
    fmt,
    lockFraction,
    opex,
    researchRate,
    revenue,
    servedFraction,
    shareDemandBonus,
    totalCompute,
  } from '../game/helpers';

  let { g }: { g: GameController } = $props();

  const served = $derived(servedFraction(g.state));
  const lock = $derived(lockFraction(g.state));
</script>

<section class="panel mb-3" aria-label="Compute allocation">
  <div class="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
    <span class="font-medium">
      Compute: <span class="num">{fmt(totalCompute(g.state))}</span> PFLOPs
      {#if g.state.computeMult > 1}<span class="text-mut">(×{g.state.computeMult.toFixed(1)} optimized)</span>{/if}
      {#if g.state.orbitalCompute > 0}<span class="text-mut">· {fmt(g.state.orbitalCompute)} in orbit</span>{/if}
    </span>
    <span class="num text-xs text-mut">
      {#if lock > 0}{Math.round(lock * 100)}% locked ·{/if}
      {#if g.state.shortageT > 0}shortage −30% ·{/if}
      ${opex(g.state).toFixed(1)}/s opex
    </span>
  </div>

  <div class="flex items-center gap-3">
    <span class="label">Training</span>
    <input
      type="range"
      min="0"
      max="100"
      step="1"
      bind:value={g.state.alloc}
      class="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-raise accent-(--color-you)"
      aria-label="Compute allocation between training and inference"
    />
    <span class="label">Inference</span>
  </div>

  <div class="mt-2 flex flex-wrap justify-between gap-2 text-xs text-mut">
    <span class="num">{researchRate(g.state).toFixed(1)} research/s</span>
    <span class="num" style:color={served < 0.65 ? 'var(--color-bad)' : undefined}>
      serving {Math.round(served * 100)}% of demand
    </span>
    <span class="num">${revenue(g.state).toFixed(1)}/s revenue</span>
  </div>
  <p class="mt-1 text-xs text-dim">
    Demand: {fmt(demand(g.state))} PFLOPs = {GENS[g.state.gen - 1].demand} base (Gen {g.state.gen})
    +{Math.round(shareDemandBonus(g.state) * 100)}% from your {g.state.share.toFixed(1)}% market share.
  </p>
</section>
