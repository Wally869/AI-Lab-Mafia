<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { AGI_RUN, TRAIN_RUNS } from '../game/constants';
  import { fmt } from '../game/helpers';

  let { g }: { g: GameController } = $props();

  const s = $derived(g.state);
  const next = $derived(s.gen < 4 ? TRAIN_RUNS[s.gen] : null);
</script>

<section class="panel mb-3" aria-label="Model training">
  <div class="flex items-center justify-between gap-3">
    <p class="text-sm font-medium">Model: Gen <span class="num">{s.gen}</span></p>
    {#if s.agiProgress === null && !s.training}
      {#if next}
        <button
          class="btn shrink-0"
          onclick={g.startTraining}
          disabled={s.ended || s.research < next.research || s.cash < next.cash}
        >
          Train Gen {s.gen + 1} — <span class="num">{fmt(next.research)}</span> res + $<span class="num">{fmt(next.cash)}</span>
        </button>
      {:else}
        <button
          class="btn shrink-0 border-you/60 text-you"
          onclick={g.startTraining}
          disabled={s.ended || s.research < AGI_RUN.research || s.cash < AGI_RUN.cash}
        >
          BEGIN AGI RUN — <span class="num">{fmt(AGI_RUN.research)}</span> res + $<span class="num">{fmt(AGI_RUN.cash)}</span>
        </button>
      {/if}
    {/if}
  </div>

  {#if s.agiProgress !== null}
    <p class="mt-1 text-xs text-warn">
      THE FINAL RUN. {Math.floor(s.agiProgress)}% — heat climbing +{AGI_RUN.heatPerSecond}/s, every rival is coming for you.
    </p>
    <div class="mt-2 h-2 overflow-hidden rounded-full bg-raise">
      <div class="h-full bg-you transition-all" style:width="{s.agiProgress}%"></div>
    </div>
  {:else if s.training}
    <p class="mt-1 text-xs text-dim">
      Training Gen {s.gen + 1}... {Math.ceil(s.training.total - s.training.done)}s left.
      {#if !s.opsec}<span class="text-warn">Vulnerable to sabotage — no opsec team.</span>{/if}
    </p>
    <div class="mt-2 h-2 overflow-hidden rounded-full bg-raise">
      <div class="h-full bg-you transition-all" style:width="{(s.training.done / s.training.total) * 100}%"></div>
    </div>
  {:else if next}
    <p class="mt-1 text-xs text-dim">
      Locks {Math.round(next.lock * 100)}% of compute for {next.seconds}s. Rivals may sabotage the run.
    </p>
  {:else}
    <p class="mt-1 text-xs text-dim">
      Locks 70% of compute for {AGI_RUN.seconds}s, heat +{AGI_RUN.heatPerSecond}/s, rivals attack relentlessly. Win the game.
    </p>
  {/if}
</section>
