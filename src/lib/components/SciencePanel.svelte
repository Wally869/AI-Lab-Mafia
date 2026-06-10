<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { fmt } from '../game/helpers';

  let { g }: { g: GameController } = $props();
</script>

<section aria-label="Science" class="mb-3">
  <h2 class="label mb-1.5">Science · spend research</h2>
  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
    <button
      class="btn"
      onclick={() => g.buyScience(0)}
      disabled={g.state.ended || g.state.research < g.state.scienceCosts[0]}
    >
      Optimize inference — <span class="num">{fmt(g.state.scienceCosts[0])}</span> res
      <span class="block text-xs text-mut">+10% effective compute · now ×{g.state.computeMult.toFixed(1)}</span>
    </button>
    <button
      class="btn"
      onclick={() => g.buyScience(1)}
      disabled={g.state.ended || g.state.research < g.state.scienceCosts[1]}
    >
      Publish a paper — <span class="num">{fmt(g.state.scienceCosts[1])}</span> res
      <span class="block text-xs text-mut">+10 influence · +0.5% share · −5 heat</span>
    </button>
  </div>
</section>
