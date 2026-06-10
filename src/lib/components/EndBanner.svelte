<script lang="ts">
  import type { GameController } from '../controller.svelte';

  let { g }: { g: GameController } = $props();

  const tone = $derived(
    g.state.outcome?.won
      ? 'border-ok bg-ok/10 text-ok'
      : 'border-bad bg-bad/10 text-bad',
  );
</script>

{#if g.state.outcome}
  <div class="mb-3 rounded-lg border p-3 text-sm font-medium {tone}" role="status">
    {g.state.outcome.text}
    <span class="num">(+{g.state.outcome.gained} founder pts)</span>
  </div>
  <button class="btn mb-3 w-full text-center font-medium" onclick={g.restart}>
    Found a new company
  </button>
{/if}
