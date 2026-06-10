<script lang="ts">
  import { onMount } from 'svelte';
  import { GameController } from './lib/controller.svelte';
  import ComputeCard from './lib/components/ComputeCard.svelte';
  import EndBanner from './lib/components/EndBanner.svelte';
  import EventCard from './lib/components/EventCard.svelte';
  import HardwarePanel from './lib/components/HardwarePanel.svelte';
  import Header from './lib/components/Header.svelte';
  import LogPanel from './lib/components/LogPanel.svelte';
  import Metrics from './lib/components/Metrics.svelte';
  import ModelCard from './lib/components/ModelCard.svelte';
  import OpsPanel from './lib/components/OpsPanel.svelte';
  import RaceBoard from './lib/components/RaceBoard.svelte';
  import SciencePanel from './lib/components/SciencePanel.svelte';

  const g = new GameController();

  onMount(() => {
    g.start();
    return () => g.stop();
  });
</script>

<main class="mx-auto max-w-3xl px-4 py-6">
  <Header {g} />
  <Metrics {g} />
  <EndBanner {g} />

  <button
    class="btn mb-3 w-full py-3 text-center text-[15px] font-medium"
    onclick={g.answerPrompt}
    disabled={g.state.ended}
  >
    Answer a prompt yourself <span class="num text-ok">+$3</span>
  </button>

  <ComputeCard {g} />
  <ModelCard {g} />
  <SciencePanel {g} />
  <HardwarePanel {g} />
  <EventCard {g} />
  <OpsPanel {g} />
  <RaceBoard {g} />
  <LogPanel {g} />

  <footer class="pb-4 text-center text-xs text-dim">
    Founder points persist in localStorage. Selling is winning, just smaller.
  </footer>
</main>
