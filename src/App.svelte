<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { GameController } from './lib/controller.svelte';
  import AppBar from './lib/components/AppBar.svelte';
  import BuildTab from './lib/components/BuildTab.svelte';
  import Dock from './lib/components/Dock.svelte';
  import EndOverlay from './lib/components/EndOverlay.svelte';
  import LabTab from './lib/components/LabTab.svelte';
  import Onboarding from './lib/components/Onboarding.svelte';
  import OpsTab from './lib/components/OpsTab.svelte';
  import RaceStrip from './lib/components/RaceStrip.svelte';
  import RaceTab from './lib/components/RaceTab.svelte';
  import ResourceBar from './lib/components/ResourceBar.svelte';
  import SheetHost from './lib/components/SheetHost.svelte';
  import TabBar from './lib/components/TabBar.svelte';
  import Ticker from './lib/components/Ticker.svelte';
  import { ui } from './lib/ui.svelte';

  const g = new GameController();

  // Mobile: tabbed single column. Desktop: every panel visible in a grid.
  const mq = window.matchMedia('(min-width: 768px)');
  let isDesktop = $state(mq.matches);

  let bodyEl = $state<HTMLDivElement>();
  $effect(() => {
    void ui.tab;
    bodyEl?.scrollTo(0, 0);
  });

  $effect(() => {
    document.documentElement.style.setProperty('--acc-h', String(ui.settings.accH));
    document.body.dataset.density = ui.settings.density;
  });

  // Sheets don't outlive what they show: event resolved or run over → close.
  $effect(() => {
    if (ui.sheet?.kind === 'event' && !g.state.event) ui.close();
    if (g.state.ended && ui.sheet && ui.sheet.kind !== 'settings') ui.close();
  });

  onMount(() => {
    const onChange = (e: MediaQueryListEvent) => (isDesktop = e.matches);
    mq.addEventListener('change', onChange);
    // The sim only starts ticking once the lab is founded.
    if (!g.showOnboarding) g.start();
    return () => {
      mq.removeEventListener('change', onChange);
      g.stop();
    };
  });
</script>

<div class="app">
  <AppBar {g} />
  <div class="strips">
    <ResourceBar {g} />
    <RaceStrip {g} />
  </div>
  <Ticker {g} />

  {#if isDesktop}
    <div class="body desk">
      <div class="col">
        <Dock {g} />
        <LabTab {g} />
      </div>
      <div class="col">
        <BuildTab {g} />
      </div>
      <div class="col">
        <OpsTab {g} />
      </div>
      <div class="col">
        <RaceTab {g} />
      </div>
    </div>
  {:else}
    <div class="body" bind:this={bodyEl}>
      {#if ui.tab === 'lab'}
        <LabTab {g} />
      {:else if ui.tab === 'build'}
        <BuildTab {g} />
      {:else if ui.tab === 'ops'}
        <OpsTab {g} />
      {:else}
        <RaceTab {g} />
      {/if}
    </div>

    <Dock {g} />
    <TabBar />
  {/if}

  <SheetHost {g} />

  {#if ui.toastText}
    <div class="toast" transition:fade={{ duration: 150 }}>{ui.toastText}</div>
  {/if}

  <EndOverlay {g} />

  {#if g.showOnboarding}
    <Onboarding {g} />
  {/if}
</div>
