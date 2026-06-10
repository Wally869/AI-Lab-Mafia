<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { TIERS } from '../game/constants';
  import { settlementPreview, tierIndex } from '../game/helpers';

  let { g }: { g: GameController } = $props();

  const tier = $derived(TIERS[tierIndex(g.meta.points)]);
  const next = $derived(TIERS[tierIndex(g.meta.points) + 1]);
</script>

<header class="mb-3 flex items-center justify-between gap-3">
  <div>
    <h1 class="font-display text-lg font-bold tracking-tight">
      AI Lab Mafia <span class="text-dim">/ race to AGI</span>
    </h1>
    <p class="text-[13px] text-mut">
      <span class="font-medium text-txt">{tier.name}</span>
      · <span class="num">{g.meta.points}</span> founder pts
      · run <span class="num">{g.meta.runs}</span>
      {#if next}· next tier in <span class="num">{next.min - g.meta.points}</span> pts{:else}· max tier{/if}
    </p>
  </div>
  <button class="btn shrink-0" onclick={g.sellCompany} disabled={g.state.ended}>
    Sell company <span class="num text-ok">+{settlementPreview(g.state, 'sale')} pts</span>
  </button>
</header>
