<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { GameController } from '../controller.svelte';

  let { g }: { g: GameController } = $props();

  let copied = $state(false);

  const HEADLINES = {
    agi: '🏆 AGI ACHIEVED',
    consolidation: '🏛️ INDUSTRY CONSOLIDATED',
    sale: '💰 SOLD',
    loss: '💀 RUN ENDED',
  } as const;

  function mmss(ticks: number): string {
    return `${Math.floor(ticks / 60)}:${String(ticks % 60).padStart(2, '0')}`;
  }

  function shareText(): string {
    const s = g.state;
    const o = s.outcome!;
    const acq = s.acquisitions > 0 ? `${s.acquisitions} rival${s.acquisitions > 1 ? 's' : ''} absorbed · ` : '';
    return [
      `AI Lab Mafia — ${g.meta.labName || 'Your lab'}, run #${s.runNumber} (${s.tierName})`,
      `${HEADLINES[o.kind]} in ${mmss(s.ticks)} — Gen ${s.gen} · ${s.share.toFixed(1)}% share · peak heat ${Math.round(s.peakHeat)}`,
      `${acq}+${o.gained} founder pts`,
      'https://wally869.github.io/AI-Lab-Mafia/',
    ].join('\n');
  }

  function copyResult(): void {
    navigator.clipboard.writeText(shareText()).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 2000);
    });
  }
</script>

{#if g.state.outcome}
  {@const o = g.state.outcome}
  <div class="overlay {o.won ? 'win' : 'lose'}" role="status" transition:fade={{ duration: 220 }}>
    <div class="end-card">
      <div class="headline">{HEADLINES[o.kind]}</div>
      <p>{o.text}</p>
      <div class="end-points num">+{o.gained} founder pts</div>
      <div class="actions">
        <button class="btn full" onclick={g.restart}>Found a new company</button>
        <button class="btn sm" onclick={copyResult}>{copied ? 'Copied!' : 'Copy result'}</button>
      </div>
    </div>
  </div>
{/if}
