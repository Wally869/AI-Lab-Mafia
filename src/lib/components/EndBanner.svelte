<script lang="ts">
  import type { GameController } from '../controller.svelte';

  let { g }: { g: GameController } = $props();

  let copied = $state(false);

  const tone = $derived(
    g.state.outcome?.won
      ? 'border-ok bg-ok/10 text-ok'
      : 'border-bad bg-bad/10 text-bad',
  );

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
  <div class="mb-3 rounded-lg border p-3 text-sm font-medium {tone}" role="status">
    {g.state.outcome.text}
    <span class="num">(+{g.state.outcome.gained} founder pts)</span>
  </div>
  <div class="mb-3 flex gap-2">
    <button class="btn flex-1 text-center font-medium" onclick={g.restart}>
      Found a new company
    </button>
    <button class="btn shrink-0 text-center" onclick={copyResult}>
      {copied ? 'Copied!' : 'Copy result'}
    </button>
  </div>
{/if}
