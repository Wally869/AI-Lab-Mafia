<script lang="ts">
  import type { GameController } from '../controller.svelte';

  let { g }: { g: GameController } = $props();
</script>

<section aria-label="Wire taps" class="mb-3">
  <h2 class="label mb-1.5">Wire taps</h2>
  <div class="panel num min-h-32 max-h-56 overflow-y-auto text-[13px] leading-6 text-mut" aria-live="polite">
    {#each g.state.log.slice(0, 12) as entry (entry.id)}
      <p>{entry.text}</p>
    {/each}
  </div>
</section>
