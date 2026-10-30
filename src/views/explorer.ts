import { layout } from './layout';

export function explorerView(): string {
  const body = `<h2 class="font-display text-xl mb-4">Explorer</h2>
  <div x-data="{tab:'targets'}" class="space-y-4">
    <div class="flex gap-2 text-sm">
      <button @click="tab='targets'" class="px-3 py-1 rounded bg-vektor-surface-2">Targets</button>
      <button @click="tab='props'" class="px-3 py-1 rounded bg-vektor-surface-2">Properties</button>
      <button @click="tab='ents'" class="px-3 py-1 rounded bg-vektor-surface-2">Entities</button>
    </div>
    <div class="bg-vektor-surface border border-vektor-line rounded p-4">
      <input id="search" placeholder="Search..." class="bg-vektor-canvas border border-vektor-line rounded px-3 py-2 text-sm mb-3" />
      <table class="w-full text-sm"><thead class="text-vektor-sec"><tr><th class="text-left py-2">ID</th><th>Name</th><th>Status</th></tr></thead><tbody id="rows"></tbody></table>
    </div>
  </div>`;
  return layout('Explorer', body);
}
