<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { OP_COOLDOWNS, STRUCTURAL } from '../game/constants';
  import { canBuyStructural, canRunOp } from '../game/sim';
  import type { StructuralKey } from '../game/types';
  import { OP_META, opCostLabel, opHeatLabel, type OpMeta } from '../opmeta';
  import { act, fmt, ui } from '../ui.svelte';

  let { g }: { g: GameController } = $props();

  function tap(op: OpMeta): void {
    if (g.state.cooldowns[op.key] > 0 || g.state.ended) return;
    if (op.target) {
      // Per-op targeting: the picker shows costs even when unaffordable; its
      // TARGET buttons disable until the op can actually run.
      ui.open({ kind: 'target', op: op.key });
    } else {
      act(g, () => g.runOp(op.key));
    }
  }

  interface StructDef {
    key: StructuralKey;
    name: string;
    sub: string;
    cost: string;
    owned: boolean;
  }

  const structs = $derived<StructDef[]>([
    {
      key: 'opsec' as const,
      name: STRUCTURAL.opsec.label,
      sub: 'Blocks most sabotage of YOUR runs',
      cost: `${STRUCTURAL.opsec.influence} inf + $${fmt(STRUCTURAL.opsec.cash)}`,
      owned: g.state.opsec,
    },
    {
      key: 'capture' as const,
      name: STRUCTURAL.capture.label,
      sub: `Needs Gen ${STRUCTURAL.capture.minGen}+ · heat gain −40%, permanent`,
      cost: `${STRUCTURAL.capture.influence} inf`,
      owned: g.state.heatGainMult < 1,
    },
    {
      key: 'cartel' as const,
      name: STRUCTURAL.cartel.label,
      sub: `Needs ${STRUCTURAL.cartel.minShare}%+ share · hardware & opex −30%`,
      cost: `${STRUCTURAL.cartel.influence} inf`,
      owned: g.state.hardwareMult < 1,
    },
  ].filter((x) => !x.owned));

  const grid = $derived(ui.settings.cardLayout === 'grid');
</script>

{#snippet opPrice(op: OpMeta)}
  {@const c = opCostLabel(g.state, op.key)}
  {@const can = canRunOp(g.state, op.key)}
  <span class="price num {c.inf ? 'influence' : ''} {can ? (c.inf ? '' : 'ok') : 'no'}">{c.text}</span>
{/snippet}

{#snippet opHeat(op: OpMeta)}
  {#if op.heat !== undefined}
    <span class="heat-cost {op.heat < 0 ? 'good' : 'bad'}">{opHeatLabel(g.state, op.heat)}</span>
  {/if}
{/snippet}

<section class="section" aria-label="Family business">
  <div class="section-title">Family business</div>
  {#if grid}
    <div class="card-grid">
      {#each OP_META as op (op.key)}
        {@const cd = g.state.cooldowns[op.key]}
        <button class="cell" class:on-cooldown={cd > 0} data-buyable={canRunOp(g.state, op.key) ? '1' : undefined} onclick={() => tap(op)}>
          <div class="cell-head">
            <span class="cell-name">{op.name}</span>
            {#if op.target}<span class="chevron">›</span>{:else if op.tag}<span class="tag">{op.tag}</span>{/if}
          </div>
          <div class="cell-sub">{cd > 0 ? `cooling down · ${cd}s` : op.sub}</div>
          <div class="cell-footer">{@render opPrice(op)}{@render opHeat(op)}</div>
          {#if cd > 0}<span class="cooldown-fill" style:width="{(cd / OP_COOLDOWNS[op.key]) * 100}%"></span>{/if}
        </button>
      {/each}
    </div>
  {:else}
    {#each OP_META as op (op.key)}
      {@const cd = g.state.cooldowns[op.key]}
      <button class="row" class:on-cooldown={cd > 0} data-buyable={canRunOp(g.state, op.key) ? '1' : undefined} onclick={() => tap(op)}>
        <div class="row-main">
          <div class="row-title">{op.name}</div>
          <div class="sub">{cd > 0 ? `cooling down · ${cd}s` : op.sub}</div>
        </div>
        <div class="row-aside">{@render opPrice(op)}{@render opHeat(op)}</div>
        {#if op.target}<span class="chevron">›</span>{:else if op.tag}<span class="owned">{op.tag}</span>{/if}
        {#if cd > 0}<span class="cooldown-fill" style:width="{(cd / OP_COOLDOWNS[op.key]) * 100}%"></span>{/if}
      </button>
    {/each}
  {/if}
</section>

{#if structs.length > 0}
  <section class="section" aria-label="Structure">
    <div class="section-title">Structure<span class="section-meta">one-time · permanent</span></div>
    {#each structs as st (st.key)}
      <button
        class="row"
        data-buyable={canBuyStructural(g.state, st.key) ? '1' : undefined}
        onclick={() => act(g, () => g.buyStructural(st.key))}
      >
        <div class="row-main"><div class="row-title">{st.name}</div><div class="sub">{st.sub}</div></div>
        <div class="row-aside">
          <span class="price num influence {canBuyStructural(g.state, st.key) ? '' : 'no'}">{st.cost}</span>
        </div>
      </button>
    {/each}
  </section>
{/if}
