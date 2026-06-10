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
  <div class="grid grid-cols-2 gap-2 lg:grid-cols-3">
    {#each BUILDINGS as def, i (def.id)}
      <div class="panel flex flex-col justify-between gap-2">
        <div>
          <p class="text-[13px] font-medium">{def.name}</p>
          <p class="text-xs text-mut">
            {def.blurb} · <span class="num">{g.state.buildings[i].count}</span> owned
          </p>
        </div>
        <button
          class="btn"
          onclick={() => g.buyBuilding(i)}
          disabled={g.state.ended || g.state.cash < price(i) || (def.minGen !== undefined && g.state.gen < def.minGen)}
        >
          {#if def.minGen !== undefined && g.state.gen < def.minGen}
            Needs Gen {def.minGen}
          {:else}
            {def.effect === 'researcher' || def.effect === 'lobbyist' ? 'Hire' : def.effect === 'orbital' ? 'Launch' : 'Buy'}
            — $<span class="num">{fmt(price(i))}</span>
          {/if}
        </button>
      </div>
    {/each}
  </div>
</section>
