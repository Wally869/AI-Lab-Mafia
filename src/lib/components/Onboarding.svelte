<script lang="ts">
  import type { GameController } from '../controller.svelte';

  let { g }: { g: GameController } = $props();

  const PREFIXES = ['Open', 'Deep', 'Neural', 'Recursive', 'Synthetic', 'Quantum', 'Hyper', 'Stealth', 'Frontier', 'Cortex'];
  const SUFFIXES = ['Mind', 'Fathom', 'Forge', 'Logic', 'Dynamics', 'Labs', 'Intelligence', 'Systems', 'Compute', 'AGI'];

  function suggest(): string {
    return (
      PREFIXES[Math.floor(Math.random() * PREFIXES.length)] +
      SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]
    );
  }

  // The dialog remounts on every open, so capturing the name once is intended.
  // svelte-ignore state_referenced_locally
  let name = $state(g.meta.labName || suggest());
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
  <div class="panel max-h-full w-full max-w-lg overflow-y-auto p-5" role="dialog" aria-modal="true" aria-label="How to play">
    <h2 class="font-display text-xl font-bold tracking-tight">
      AI Lab Mafia <span class="text-dim">/ race to AGI</span>
    </h2>
    <p class="mt-1 text-sm text-mut">
      Grow an AI lab from a garage to an empire — and finish your AGI run before any rival finishes theirs.
    </p>

    <ul class="mt-4 space-y-2 text-[13px] leading-snug text-mut">
      <li>
        <span class="font-medium text-txt">Earn.</span>
        Slide compute toward inference for cash, toward training for research.
        Cheap pricing grows market share — if you can serve the demand.
      </li>
      <li>
        <span class="font-medium text-txt">Advance.</span>
        Research buys upgrades and trains the next model generation. Gen 4 unlocks the AGI run.
      </li>
      <li>
        <span class="font-medium text-txt">Fight dirty.</span>
        Poach, smear, sabotage, bribe. Dirty ops and sheer size raise heat — at 100, you're raided.
      </li>
      <li>
        <span class="font-medium text-txt">Win.</span>
        Achieve AGI, hit 60% market share, or absorb every rival.
        Selling out is winning, just smaller — and founder points make every next run stronger.
      </li>
    </ul>

    <label class="label mt-5 block" for="lab-name">Name your lab</label>
    <div class="mt-1.5 flex gap-2">
      <input
        id="lab-name"
        type="text"
        maxlength="24"
        bind:value={name}
        class="w-full rounded-md border border-edge bg-raise px-3 py-2 text-[14px] text-txt focus-visible:outline-2 focus-visible:outline-you"
      />
      <button class="btn shrink-0" onclick={() => (name = suggest())} aria-label="Random lab name">🎲</button>
    </div>

    <button
      class="btn mt-4 w-full py-3 text-center text-[15px] font-medium"
      disabled={name.trim().length === 0}
      onclick={() => g.completeOnboarding(name)}
    >
      Found {name.trim() || 'the company'}
    </button>
    <p class="mt-2 text-center text-xs text-dim">
      Progress persists in your browser. First runs usually end in a sale — that's the point.
    </p>
  </div>
</div>
