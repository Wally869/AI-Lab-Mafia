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
  }

  const ops: OpRow[] = [
    { key: 'pr',    title: 'Marketing blitz', blurb: 'Grab open market, scales with gen · +2 heat' },
    { key: 'poach', title: 'Poach team',      blurb: 'Steal share + research · +6 heat' },
    { key: 'spy',   title: 'Espionage',       blurb: 'Steal research, target AGI −3 · +10 heat' },
    { key: 'smear', title: 'Smear',           blurb: 'Target bleeds share · +12 heat' },
    { key: 'sab',   title: 'Sabotage run',    blurb: 'Target AGI −8 · +15 heat' },
    { key: 'bribe', title: 'Bribe regulator', blurb: '−30 heat... if it works' },
    { key: 'acq',   title: 'Acquire weakest', blurb: 'Absorb them · +20 heat · income +15%' },
  ];

  function costLabel(key: OpKey): string {
    if (key === 'pr') return `$${fmt(prCost(g.state))}`;
    if (key === 'acq') return `${OP_INFLUENCE_COSTS.acq} inf + $${fmt(acquisitionCost(g.state))}`;
    return `${OP_INFLUENCE_COSTS[key]} inf`;
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
        <span class="block text-xs text-mut">{op.blurb}</span>
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
