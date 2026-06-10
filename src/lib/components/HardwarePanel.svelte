<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { BUILDINGS } from '../game/constants';
  import { fmt } from '../game/helpers';

  let { g }: { g: GameController } = $props();

  function price(i: number): number {
    const def = BUILDINGS[i];
    const isHardware = def.effect === 'ground' || def.effect === 'orbital';
    return g.state.buildings[i].cost * (isHardware ? g.state.hardwareMult : 1);
  }
</script>

<section aria-label="Hardware and payroll" class="mb-3">
  <h2 class="label mb-1.5">Hardware &amp; payroll</h2>
  <div class="grid grid-cols-2 gap-2">
    {#each BUILDINGS as def, i (def.id)}
      <button
        class="btn"
        onclick={() => g.buyBuilding(i)}
        disabled={g.state.ended || g.state.cash < price(i) || (def.minGen !== undefined && g.state.gen < def.minGen)}
      >
        <span class="flex items-baseline justify-between gap-2">
          <span class="font-medium">{def.name}</span>
          {#if def.minGen !== undefined && g.state.gen < def.minGen}
            <span class="text-xs text-dim">Needs Gen {def.minGen}</span>
          {:else}
            <span class="num">${fmt(price(i))}</span>
          {/if}
        </span>
        <span class="block text-xs text-mut">
          {def.blurb} · <span class="num">{g.state.buildings[i].count}</span> owned
        </span>
      </button>
    {/each}
  </div>
</section>
