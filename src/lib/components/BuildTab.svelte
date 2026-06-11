<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { BUILDINGS } from '../game/constants';
  import type { BuildingDef } from '../game/types';
  import { act, fmt, ui } from '../ui.svelte';

  let { g }: { g: GameController } = $props();

  interface Tile {
    def: BuildingDef;
    i: number;
    price: number;
    locked: boolean;
    can: boolean;
    owned: number;
  }

  function tile(def: BuildingDef, i: number): Tile {
    const isHardware = def.effect === 'ground' || def.effect === 'orbital';
    const price = g.state.buildings[i].cost * (isHardware ? g.state.hardwareMult : 1);
    const locked = def.minGen !== undefined && g.state.gen < def.minGen;
    return {
      def,
      i,
      price,
      locked,
      can: !locked && !g.state.ended && g.state.cash >= price,
      owned: g.state.buildings[i].count,
    };
  }

  const hardware = $derived(BUILDINGS.map(tile).filter((t) => t.def.effect === 'ground' || t.def.effect === 'orbital'));
  const payroll = $derived(BUILDINGS.map(tile).filter((t) => t.def.effect === 'researcher' || t.def.effect === 'lobbyist'));
  const grid = $derived(ui.settings.cardLayout === 'grid');

  const buy = (t: Tile) => {
    if (!t.can) return;
    act(g, () => g.buyBuilding(t.i));
  };
</script>

{#snippet priceTag(t: Tile)}
  {#if t.locked}
    <span class="price no">Needs Gen {t.def.minGen}</span>
  {:else}
    <span class="price num {t.can ? 'ok' : 'no'}">${fmt(t.price)}</span>
  {/if}
{/snippet}

{#snippet tiles(list: Tile[])}
  {#if grid}
    <div class="card-grid">
      {#each list as t (t.def.id)}
        <button class="cell" class:locked={t.locked} data-buyable={t.can ? '1' : undefined} onclick={() => buy(t)}>
          <div class="cell-head"><span class="cell-name">{t.def.name}</span></div>
          <div class="cell-sub">{t.def.blurb}</div>
          <div class="cell-footer">{@render priceTag(t)}<span class="owned">{t.owned} owned</span></div>
        </button>
      {/each}
    </div>
  {:else}
    {#each list as t (t.def.id)}
      <button class="row" class:locked={t.locked} data-buyable={t.can ? '1' : undefined} onclick={() => buy(t)}>
        <div class="row-main"><div class="row-title">{t.def.name}</div><div class="sub">{t.def.blurb}</div></div>
        <div class="row-aside">{@render priceTag(t)}<span class="owned">{t.owned} owned</span></div>
      </button>
    {/each}
  {/if}
{/snippet}

<section class="section" aria-label="Hardware">
  <div class="section-title">Hardware</div>
  {@render tiles(hardware)}
</section>

<section class="section" aria-label="Payroll">
  <div class="section-title">Payroll<span class="section-meta">{g.state.researchers} researchers · {g.state.lobbyists} lobbyists</span></div>
  {@render tiles(payroll)}
</section>
