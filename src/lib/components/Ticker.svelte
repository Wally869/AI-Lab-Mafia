<script lang="ts">
  import type { GameController } from '../controller.svelte';
  import { ui } from '../ui.svelte';

  let { g }: { g: GameController } = $props();

  // News-bar behavior: each wire-tap line scrolls across exactly once, in
  // order; the bar idles quietly when there's no news. No looping.
  const SPEED = 95; // px/s
  const HOLD_MS = 4000; // static fallback display time per line

  let laneEl = $state<HTMLElement>();
  let itemEl = $state<HTMLElement>();
  // Sequence numbers keep identical consecutive lines distinct, so the
  // animation effect re-fires even when two log texts are the same.
  let current = $state<{ n: number; text: string } | null>(null);
  let queue: string[] = [];
  let lastSeenId = 0;
  let seq = 0;

  const reducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Collect entries newer than the last one queued (log is newest-first).
  $effect(() => {
    const fresh: string[] = [];
    for (const e of g.state.log) {
      if (e.id <= lastSeenId) break;
      fresh.push(e.text);
    }
    if (fresh.length === 0) return;
    // On boot (or restore) don't replay the whole backlog — just the newest.
    if (lastSeenId === 0) fresh.length = Math.min(fresh.length, 1);
    lastSeenId = g.state.log[0].id;
    queue.push(...fresh.reverse());
    if (current === null) {
      const text = queue.shift();
      if (text !== undefined) current = { n: ++seq, text };
    }
  });

  // Drive the current line across the lane; advance to the next when done.
  $effect(() => {
    if (current === null || !laneEl || !itemEl) return;
    const advance = () => {
      const text = queue.shift();
      current = text === undefined ? null : { n: ++seq, text };
    };
    if (reducedMotion || ui.settings.juice === 'low') {
      itemEl.style.transform = 'none';
      const t = setTimeout(advance, HOLD_MS);
      return () => clearTimeout(t);
    }
    const laneWidth = laneEl.clientWidth;
    const itemWidth = itemEl.scrollWidth;
    const anim = itemEl.animate(
      [{ transform: `translateX(${laneWidth}px)` }, { transform: `translateX(${-itemWidth}px)` }],
      { duration: ((laneWidth + itemWidth) / SPEED) * 1000, easing: 'linear' },
    );
    anim.onfinish = advance;
    return () => anim.cancel();
  });
</script>

<button class="ticker" onclick={() => ui.open({ kind: 'log' })} aria-label="Wire taps — tap for the full feed">
  <b class="ticker-label">WIRE TAPS</b>
  <span class="ticker-lane" bind:this={laneEl}>
    {#key current?.n}
      {#if current !== null}
        <span class="ticker-item" bind:this={itemEl}>▸ {current.text}</span>
      {/if}
    {/key}
  </span>
</button>
