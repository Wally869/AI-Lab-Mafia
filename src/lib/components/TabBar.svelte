<script lang="ts">
  import { ui, type Tab } from '../ui.svelte';

  const ICONS: Record<Tab, string> = {
    lab: '<path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4" rx="1"/>',
    build: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
    ops: '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
    race: '<path d="M5 21V4M5 4c3-1.5 6 1.5 9 0s5-1 5-1v9s-2 .5-5 1-6-1.5-9 0"/>',
  };

  const TABS: [Tab, string][] = [
    ['lab', 'Lab'],
    ['build', 'Build'],
    ['ops', 'Ops'],
    ['race', 'Race'],
  ];
</script>

<nav class="tabbar" aria-label="Sections">
  <div role="tablist" style="display:contents">
    {#each TABS as [key, label] (key)}
      <button class="tab" class:on={ui.tab === key} role="tab" aria-selected={ui.tab === key} onclick={() => (ui.tab = key)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <!-- eslint-disable-next-line svelte/no-at-html-tags — static icon paths defined above -->
          {@html ICONS[key]}
        </svg>
        {label}
      </button>
    {/each}
  </div>
</nav>
