<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { AGI_RUN, GENS, TRAIN_RUNS } from '../game/constants';
  import {
    demand,
    inferenceCapacity,
    lockFraction,
    opex,
    priceMult,
    pricingShareDrift,
    researchRate,
    revenue,
    servedFraction,
    shareDemandBonus,
    totalCompute,
  } from '../game/helpers';
  import { act, fmt, fmtFlow } from '../ui.svelte';

  let { g }: { g: GameController } = $props();

  const s = $derived(g.state);
  const next = $derived(s.gen < 4 ? TRAIN_RUNS[s.gen] : null);
  const served = $derived(servedFraction(s));
  const lock = $derived(lockFraction(s));
  const drift = $derived(pricingShareDrift(s));
  const capacityRatio = $derived(demand(s) > 0 ? inferenceCapacity(s) / demand(s) : 0);

  const track = (v: number) =>
    `linear-gradient(to right, color-mix(in oklab, var(--green-d), transparent 50%) ${v}%, var(--line2) ${v}%)`;
</script>

<div class="section">
  <div class="card" aria-label="Compute allocation">
    <div class="section-title">
      Compute · {fmt(totalCompute(s))} PFLOPs
      <span class="section-meta">
        {#if s.computeMult > 1}×{s.computeMult.toFixed(1)} optimized{/if}
        {#if s.orbitalCompute > 0}· {fmt(s.orbitalCompute)} in orbit{/if}
        {#if lock > 0}· {Math.round(lock * 100)}% locked{/if}
        {#if s.shortageT > 0}· shortage −30%{/if}
      </span>
    </div>
    <div class="slider-labels"><span>◂ <b>Training</b> {100 - s.alloc}%</span><span>{s.alloc}% <b>Inference</b> ▸</span></div>
    <input
      type="range"
      class="slider"
      min="0"
      max="100"
      step="1"
      bind:value={g.state.alloc}
      style:background={track(s.alloc)}
      aria-label="Compute allocation between training and inference"
    />
    <div class="slider-labels" style="margin-top:12px"><span>◂ <b>Cheap</b> grow share</span><span>max margin <b>Costly</b> ▸</span></div>
    <input
      type="range"
      class="slider amber"
      min="0"
      max="100"
      step="1"
      bind:value={g.state.pricing}
      style:background={track(s.pricing)}
      aria-label="Pricing between cheap and costly"
    />
    <div class="sub">
      revenue ×{priceMult(s).toFixed(2)} ·
      {#if drift > 0}
        <span class="good">+{(drift * 60).toFixed(1)}% share/min</span>
      {:else if drift < 0}
        <span class="bad">−{(-drift * 60).toFixed(1)}% share/min</span>
      {:else if s.pricing < 50}
        <span class="warn">no share growth — serving under 95% of demand</span>
      {:else}
        share steady
      {/if}
    </div>
    <div class="compute-stats">
      <div><div class="label">Research / s</div><div class="value num">{researchRate(s).toFixed(1)}</div></div>
      <div><div class="label">Revenue / s</div><div class="value num">${fmtFlow(revenue(s))}</div></div>
      {#if capacityRatio > 1}
        <div><div class="label">Serving</div><div class="value num">×{capacityRatio.toFixed(1)}</div></div>
      {:else}
        <div>
          <div class="label">Serving</div>
          <div class="value num {served < 0.65 ? 'bad' : served < 0.95 ? 'warn' : ''}">{Math.round(served * 100)}%</div>
        </div>
      {/if}
    </div>
    <div class="compute-footer">
      {#if capacityRatio > 1}
        <span>overserving — spare capacity for cheap pricing</span>
      {:else if served < 0.65}
        <span class="bad">under-serving demand — customers rage-quit to rivals</span>
      {:else}
        <span>serving {Math.round(served * 100)}% of demand</span>
      {/if}
      <span>${fmtFlow(opex(s))}/s opex</span>
    </div>
    <div class="compute-note">
      Demand: {fmt(demand(s))} PFLOPs = {GENS[s.gen - 1].demand} base (Gen {s.gen})
      +{Math.round(shareDemandBonus(s) * 100)}% from your {s.share.toFixed(1)}% market share.
    </div>
  </div>

  <div class="card" aria-label="Model training">
    <div class="section-title">Model · Gen {s.gen}</div>
    {#if s.agiProgress !== null}
      <div class="title-row"><span class="row-title">THE FINAL RUN</span><span class="pct num">{Math.floor(s.agiProgress)}%</span></div>
      <div class="sub"><span class="warn">Heat climbing +{AGI_RUN.heatPerSecond}/s, every rival is coming for you.</span></div>
      <div class="bar"><i style:width="{s.agiProgress}%"></i></div>
    {:else if s.training}
      <div class="title-row">
        <span class="row-title">Training Gen {s.gen + 1}</span>
        <span class="pct num">{Math.ceil(s.training.total - s.training.done)}s left</span>
      </div>
      <div class="sub">
        {#if !s.opsec}<span class="warn">Vulnerable to sabotage — no opsec team.</span>{:else}Opsec is watching the racks.{/if}
      </div>
      <div class="bar"><i style:width="{(s.training.done / s.training.total) * 100}%"></i></div>
    {:else if next}
      <div class="title-row"><span class="row-title">Next: Gen {s.gen + 1}</span></div>
      <div class="sub">Locks {Math.round(next.lock * 100)}% of compute for {next.seconds}s. Rivals may sabotage the run.</div>
      <button
        class="btn sm"
        class:disabled={s.ended || s.research < next.research || s.cash < next.cash}
        style="margin-top:12px"
        onclick={() => act(g, g.startTraining)}
      >
        Train Gen {s.gen + 1} — {fmt(next.research)} res + ${fmt(next.cash)}
      </button>
    {:else}
      <div class="title-row"><span class="row-title">Gen 4 — AGI within reach</span></div>
      <div class="sub">
        Locks 70% of compute for {AGI_RUN.seconds}s, heat +{AGI_RUN.heatPerSecond}/s, rivals attack relentlessly. Win the game.
      </div>
      <button
        class="btn sm full"
        class:disabled={s.ended || s.research < AGI_RUN.research || s.cash < AGI_RUN.cash}
        style="margin-top:12px"
        onclick={() => act(g, g.startTraining)}
      >
        BEGIN AGI RUN — {fmt(AGI_RUN.research)} res + ${fmt(AGI_RUN.cash)}
      </button>
    {/if}
  </div>
</div>

<div class="section" aria-label="Science">
  <div class="section-title">Science · spend research</div>
  <div class="chips">
    <button
      class="chip"
      class:no={g.state.research < g.state.scienceCosts[0]}
      onclick={() => act(g, () => g.buyScience(0))}
      disabled={g.state.ended}
    >
      <div class="chip-title">Optimize inference</div>
      <div class="sub">+10% effective compute · now ×{g.state.computeMult.toFixed(1)}</div>
      <div class="sub" style="margin-top:6px;color:{g.state.research >= g.state.scienceCosts[0] ? 'var(--green)' : 'var(--mut2)'}">
        {fmt(g.state.scienceCosts[0])} res
      </div>
    </button>
    <button
      class="chip"
      class:no={g.state.research < g.state.scienceCosts[1]}
      onclick={() => act(g, () => g.buyScience(1))}
      disabled={g.state.ended}
    >
      <div class="chip-title">Publish a paper</div>
      <div class="sub">+10 influence · +0.5% share · −5 heat</div>
      <div class="sub" style="margin-top:6px;color:{g.state.research >= g.state.scienceCosts[1] ? 'var(--green)' : 'var(--mut2)'}">
        {fmt(g.state.scienceCosts[1])} res
      </div>
    </button>
  </div>
</div>
