<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { EVENTS, optionLabel } from '../game/events';

  let { g }: { g: GameController } = $props();

  const ev = $derived(g.state.event ? EVENTS[g.state.event.index] : null);
</script>

{#if ev && g.state.event}
  <section
    class="fixed inset-x-4 bottom-4 z-50 rounded-lg border border-warn/50 bg-panel-solid p-3 shadow-xl shadow-ink/60 sm:inset-x-auto sm:left-4 sm:w-80"
    aria-live="polite"
    aria-label="Decision required"
  >
    <p class="mb-2 text-sm font-medium text-warn">
      {ev.title}
      <span class="num text-xs font-normal text-warn/70">({g.state.event.secondsLeft}s)</span>
    </p>
    <div class="flex flex-wrap gap-2">
      {#each ev.options as opt, i (i)}
        <button class="btn" onclick={() => g.resolveEvent(i)}>{optionLabel(opt, g.state)}</button>
      {/each}
    </div>
  </section>
{/if}
