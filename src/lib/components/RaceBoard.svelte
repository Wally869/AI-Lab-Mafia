<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { MONOPOLY_SHARE } from '../game/constants';

  let { g }: { g: GameController } = $props();

  const clampPct = (v: number) => Math.max(0, Math.min(100, v));
</script>

<section aria-label="The AGI race" class="mb-3">
  <h2 class="label mb-1.5">
    The AGI race · click a rival to target ·
    <span class="text-bad">any lab reaching {MONOPOLY_SHARE}% share wins outright</span>
  </h2>
  <div class="flex flex-col gap-2">
    <div class="rounded-md border border-you/50 bg-panel-solid px-3 py-2">
      <div class="mb-1 flex justify-between text-[13px]">
        <span class="font-medium">
          Your lab <span class="font-normal text-dim">· gen {g.state.gen}{g.state.opsec ? ' · opsec' : ''}</span>
        </span>
        <span class="num text-mut">
          {g.state.share.toFixed(1)}% · AGI {Math.floor(g.state.agiProgress ?? 0)}%
        </span>
      </div>
      <div class="mb-1 h-1.5 overflow-hidden rounded-full bg-raise">
        <div class="h-full bg-you" style:width="{clampPct(g.state.share)}%"></div>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-raise">
        <div class="h-full bg-warn" style:width="{clampPct(g.state.agiProgress ?? 0)}%"></div>
      </div>
    </div>

    {#each g.state.rivals as rival, i (rival.name)}
      {@const dead = rival.share <= 0.05}
      <button
        class="rounded-md border bg-panel-solid px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-you"
        class:border-edge={g.state.targetIdx !== i}
        class:border-you={g.state.targetIdx === i}
        onclick={() => g.setTarget(i)}
        aria-pressed={g.state.targetIdx === i}
        disabled={dead}
      >
        <div class="mb-1 flex justify-between text-[13px]">
          <span class:line-through={dead} class:text-dim={dead}>
            {rival.name}
            <span class="text-dim">
              · {dead
                ? 'gone'
                : rival.share >= 50
                  ? `DANGER: ${(MONOPOLY_SHARE - rival.share).toFixed(1)}% from victory`
                  : rival.trait}
            </span>
          </span>
          <span class="num text-mut">{rival.share.toFixed(1)}% · AGI {Math.floor(rival.agi)}%</span>
        </div>
        <div class="mb-1 h-1.5 overflow-hidden rounded-full bg-raise">
          <div class="h-full" style:width="{clampPct(rival.share)}%" style:background={rival.color}></div>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-raise">
          <div class="h-full bg-warn" style:width="{clampPct(rival.agi)}%"></div>
        </div>
      </button>
    {/each}

    <div class="rounded-md border border-edge bg-panel-solid px-3 py-2">
      <div class="mb-1 flex justify-between text-[13px]">
        <span class="text-mut">Open market</span>
        <span class="num text-mut">{g.state.openMarket.toFixed(1)}%</span>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-raise">
        <div class="h-full bg-dim" style:width="{clampPct(g.state.openMarket)}%"></div>
      </div>
    </div>
  </div>
</section>
