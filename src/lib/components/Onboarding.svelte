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

<div class="onboarding">
  <div class="panel" role="dialog" aria-modal="true" aria-label="How to play">
    <h3><b>AI LAB MAFIA</b> <span>/ race to AGI</span></h3>
    <p class="lead">Grow an AI lab from a garage to an empire — and finish your AGI run before any rival finishes theirs.</p>

    <ul>
      <li><b>Earn.</b> Slide compute toward inference for cash, toward training for research. Cheap pricing grows market share — if you can serve the demand.</li>
      <li><b>Advance.</b> Research buys upgrades and trains the next model generation. Gen 4 unlocks the AGI run.</li>
      <li><b>Fight dirty.</b> Poach, smear, sabotage, bribe. Dirty ops and sheer size raise heat — at 100, you're raided.</li>
      <li><b>Win.</b> Achieve AGI, hit 60% market share, or absorb every rival. Selling out is winning, just smaller.</li>
      <li><b>Prestige.</b> Every ending banks founder points. They carry over, raise your starting tier, and boost every future company — sell, climb, come back meaner.</li>
    </ul>

    <label class="field-label" for="lab-name">Name your lab</label>
    <div class="name-row">
      <input id="lab-name" type="text" maxlength="24" bind:value={name} />
      <button class="dice" onclick={() => (name = suggest())} aria-label="Random lab name">🎲</button>
    </div>

    <button class="btn full" disabled={name.trim().length === 0} onclick={() => g.completeOnboarding(name)}>
      Found {name.trim() || 'the company'}
    </button>
    <p class="fine">Progress persists in your browser.</p>
  </div>
</div>
