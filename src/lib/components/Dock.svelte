<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { ECON, EVENT_SECONDS } from '../game/constants';
  import { ui } from '../ui.svelte';

  let { g }: { g: GameController } = $props();

  // Same preview formula the old prompt button used.
  const gain = $derived(Math.round(ECON.clickCash * g.state.gen * g.state.incomeMult));

  let fx = $state<{ id: number; x: number; y: number; text: string }[]>([]);
  let fxId = 0;

  function tapPrompt(e: MouseEvent): void {
    if (g.state.ended) return;
    g.answerPrompt();
    if (ui.settings.juice === 'low') return;
    const btn = e.currentTarget as HTMLElement;
    const root = btn.closest('.app');
    if (!root) return;
    const r = btn.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    const id = ++fxId;
    fx.push({
      id,
      x: r.left - rr.left + r.width * (0.3 + Math.random() * 0.4),
      y: r.top - rr.top - 6,
      text: `+$${gain}`,
    });
    setTimeout(() => (fx = fx.filter((f) => f.id !== id)), 900);
  }
</script>

<div class="dock" aria-live="polite">
  {#if g.state.event}
    <button class="event-btn" onclick={() => ui.open({ kind: 'event' })} aria-label="Decision required">
      <b>⚡ EVENT</b>
      <small>{g.state.event.secondsLeft}s · tap</small>
      <span class="event-countdown" style:width="{(g.state.event.secondsLeft / EVENT_SECONDS) * 100}%"></span>
    </button>
  {/if}
  <button class="prompt-btn" onclick={tapPrompt} disabled={g.state.ended}>
    <b>ANSWER A PROMPT</b>
    <small>+${gain}</small>
  </button>
</div>

{#each fx as f (f.id)}
  <span class="float-fx go" style:left="{f.x}px" style:top="{f.y}px">{f.text}</span>
{/each}
