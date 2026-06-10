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

<main class="mx-auto flex min-h-screen max-w-screen-2xl flex-col px-4 py-3">
  <Header {g} />
  <Metrics {g} />
  <EndBanner {g} />
  <EventCard {g} />

  <div class="grid grid-cols-1 items-start gap-x-4 lg:grid-cols-2 xl:grid-cols-3">
    <div>
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
    </div>

    <div>
      <HardwarePanel {g} />
      <OpsPanel {g} />
    </div>

    <div>
      <RaceBoard {g} />
      <LogPanel {g} />
    </div>
  </div>

  <footer class="mt-auto pt-2 pb-2 text-center text-xs text-dim">
    Tiers: 0 garage · 30 angel · 90 VC darling · 200 serial founder.
    Founder points persist in localStorage. Selling is winning, just smaller.
  </footer>
</main>
