<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { TIERS } from '../game/constants';
  import { sellValue, tierIndex } from '../game/helpers';

  let { g }: { g: GameController } = $props();

  const tier = $derived(TIERS[tierIndex(g.meta.points)]);
  const next = $derived(TIERS[tierIndex(g.meta.points) + 1]);
</script>

<header class="mb-1 flex items-center justify-between gap-3">
  <div>
    <h1 class="font-display text-lg font-bold tracking-tight">
      AI Lab Mafia <span class="text-dim">/ race to AGI</span>
    </h1>
    <p class="text-[13px] text-mut">
      <span class="font-medium text-txt">{tier.name}</span>
      · <span class="num">{g.meta.points}</span> founder pts
      · run <span class="num">{g.meta.runs}</span>
    </p>
  </div>
  <button class="btn shrink-0" onclick={g.sellCompany} disabled={g.state.ended}>
    Sell company <span class="num text-ok">+{sellValue(g.state)} pts</span>
  </button>
</header>
<p class="label mb-4">
  Tiers: 0 garage · 30 angel · 90 VC darling · 200 serial founder
  {#if next}— next in {next.min - g.meta.points} pts{:else}— max tier{/if}
</p>
