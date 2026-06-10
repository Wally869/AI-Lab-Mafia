<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { EVENTS } from '../game/events';

  let { g }: { g: GameController } = $props();

  const ev = $derived(g.state.event ? EVENTS[g.state.event.index] : null);
</script>

{#if ev && g.state.event}
  <section class="mb-3 rounded-lg border border-warn/50 bg-warn/10 p-3" aria-live="polite" aria-label="Decision required">
    <p class="mb-2 text-sm font-medium text-warn">
      {ev.title}
      <span class="num text-xs font-normal text-warn/70">({g.state.event.secondsLeft}s)</span>
    </p>
    <div class="flex flex-wrap gap-2">
      {#each ev.options as opt, i (opt.label)}
        <button class="btn" onclick={() => g.resolveEvent(i)}>{opt.label}</button>
      {/each}
    </div>
  </section>
{/if}
