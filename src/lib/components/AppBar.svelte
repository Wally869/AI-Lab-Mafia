<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { TIERS } from '../game/constants';
  import { tierIndex } from '../game/helpers';
  import { ui } from '../ui.svelte';

  let { g }: { g: GameController } = $props();

  const tier = $derived(TIERS[tierIndex(g.meta.points)]);
  const next = $derived(TIERS[tierIndex(g.meta.points) + 1]);
</script>

<header class="appbar">
  <div class="identity">
    <div class="app-title"><b>AI LAB MAFIA</b> <span>/ race to AGI</span></div>
    <div class="app-subtitle">
      {g.meta.labName || 'Your lab'} · {tier.name} · run {g.meta.runs}
      {#if next}· next tier in {next.min - g.meta.points} pts{:else}· max tier{/if}
    </div>
  </div>
  <button class="founder-pts" onclick={() => ui.open({ kind: 'company' })} aria-label="Your company">
    <span class="pts-arrow">▲</span>
    <span><span class="pts-value num">{g.meta.points}</span> <span class="pts-label">founder pts</span></span>
  </button>
  <button class="icon-btn" onclick={() => (g.showOnboarding = true)} aria-label="How to play">?</button>
  <button class="icon-btn" onclick={() => ui.open({ kind: 'settings' })} aria-label="Settings">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 004.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H22a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"></path></svg>
  </button>
</header>
