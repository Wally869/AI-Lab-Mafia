<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { OP_INFLUENCE_COSTS, STRUCTURAL } from '../game/constants';
  import { acquisitionCost, currentTarget, fmt, prCost } from '../game/helpers';
  import { canBuyStructural, canRunOp } from '../game/sim';
  import type { OpKey } from '../game/types';

  let { g }: { g: GameController } = $props();

  const target = $derived(currentTarget(g.state));

  interface OpRow {
    key: OpKey;
    title: string;
    blurb: string;
    /** Base heat cost, shown after the heat-gain multiplier is applied. */
    heat?: number;
  }

  const ops: OpRow[] = [
    { key: 'pr',    title: 'Marketing blitz', blurb: 'Grab market share, scales with gen', heat: 2 },
    { key: 'poach', title: 'Poach team',      blurb: 'Steal share + research', heat: 6 },
    { key: 'spy',   title: 'Espionage',       blurb: 'Steal research, target AGI −3', heat: 10 },
    { key: 'smear', title: 'Smear',           blurb: 'Target bleeds share', heat: 12 },
    { key: 'sab',   title: 'Sabotage run',    blurb: 'Target AGI −8', heat: 15 },
    { key: 'bribe', title: 'Bribe regulator', blurb: '−30 heat... if it works' },
    { key: 'acq',   title: 'Acquire weakest', blurb: 'Absorb them · needs 10% share · income +15%', heat: 20 },
  ];

  function costLabel(key: OpKey): string {
    if (key === 'pr') return `$${fmt(prCost(g.state))}`;
    if (key === 'acq') return `${OP_INFLUENCE_COSTS.acq} inf + $${fmt(acquisitionCost(g.state))}`;
    return `${OP_INFLUENCE_COSTS[key]} inf`;
  }

  function heatLabel(base: number): string {
    const v = base * g.state.heatGainMult;
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }
</script>

<section aria-label="Family business" class="mb-3">
  <h2 class="label mb-1.5">
    Family business · target:
    <span class="font-medium normal-case tracking-normal text-txt">{target?.name ?? '—'}</span>
  </h2>
  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
    {#each ops as op (op.key)}
      <button class="btn" onclick={() => g.runOp(op.key)} disabled={!canRunOp(g.state, op.key)}>
        {op.title} — <span class="num">{costLabel(op.key)}</span>
        {#if g.state.cooldowns[op.key] > 0}<span class="num text-dim"> ({g.state.cooldowns[op.key]}s)</span>{/if}
        <span class="block text-xs text-mut">
          {op.blurb}{#if op.heat !== undefined}&nbsp;· +{heatLabel(op.heat)} heat{/if}
        </span>
      </button>
    {/each}

    {#if !g.state.opsec}
      <button class="btn" onclick={() => g.buyStructural('opsec')} disabled={!canBuyStructural(g.state, 'opsec')}>
        {STRUCTURAL.opsec.label} — <span class="num">{STRUCTURAL.opsec.influence} inf + ${fmt(STRUCTURAL.opsec.cash)}</span>
        <span class="block text-xs text-mut">Blocks most sabotage of YOUR runs</span>
      </button>
    {/if}
    {#if g.state.heatGainMult >= 1}
      <button class="btn" onclick={() => g.buyStructural('capture')} disabled={!canBuyStructural(g.state, 'capture')}>
        {STRUCTURAL.capture.label} — <span class="num">{STRUCTURAL.capture.influence} inf</span>
        <span class="block text-xs text-mut">Needs Gen {STRUCTURAL.capture.minGen}+ · heat gain −40%, permanent</span>
      </button>
    {/if}
    {#if g.state.hardwareMult >= 1}
      <button class="btn" onclick={() => g.buyStructural('cartel')} disabled={!canBuyStructural(g.state, 'cartel')}>
        {STRUCTURAL.cartel.label} — <span class="num">{STRUCTURAL.cartel.influence} inf</span>
        <span class="block text-xs text-mut">Needs {STRUCTURAL.cartel.minShare}%+ share · hardware &amp; opex −30%</span>
      </button>
    {/if}
  </div>
</section>
