<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import { drawHeatmap }     from "$lib/d3/heatmap";
  import { drawGroupedBars } from "$lib/d3/groupedBar";

  export let sportKey: string;
  const sex    = writable<"M"|"F">("F");
  const medals = ["Gold","Silver","Bronze","No Medal"];
  // a reactive Set of currently‐checked medals:
  const selected = writable(new Set(medals));

  let heatmapDiv, ageDiv, heightDiv, weightDiv;

  // whenever sex or medal‐set changes, re‐draw both charts
  function redraw(s: "M"|"F", sel: Set<string>) {
    fetch(`statics/${sportKey}.json`)
      .then(r => r.json())
      .then(data => {
        const hm  = data.heatmap[s];
        const bar = data.bar[s];

        if (heatmapDiv) drawHeatmap(heatmapDiv, hm);
        if (ageDiv)    drawGroupedBars(ageDiv,    bar.age,    Array.from(sel));
        if (heightDiv) drawGroupedBars(heightDiv, bar.height, Array.from(sel));
        if (weightDiv) drawGroupedBars(weightDiv, bar.weight, Array.from(sel));
      });
  }

  onMount(() => {
    const unsubscribe = []
      .concat(sex.subscribe(s => selected.subscribe(sel => redraw(s, sel))))
      .concat(selected.subscribe(sel => sex.subscribe(s => redraw(s, sel))));
  });
</script>

<div class="controls">
  <fieldset>
    <legend>Sex:</legend>
    <label><input type="radio" bind:group={$sex} value="F"/> Female</label>
    <label><input type="radio" bind:group={$sex} value="M"/> Male</label>
  </fieldset>
  <fieldset>
    <legend>Show Medals:</legend>
    {#each medals as m}
      <label>
        <input
          type="checkbox"
          checked={$selected.has(m)}
          on:change={() => {
            const s = new Set($selected);
            $selected.has(m) ? s.delete(m) : s.add(m);
            selected.set(s);
          }}
        /> {m}
      </label>
    {/each}
  </fieldset>
</div>

<h2>Correlation Heatmap</h2>
<div bind:this={heatmapDiv} class="chart-box"></div>

<h2>Average by Medal & Year</h2>
<!-- vertical stack -->
<div class="grouped-column">
  <section><h3>Age</h3><div bind:this={ageDiv}    class="grouped-box"></div></section>
  <section><h3>Height</h3><div bind:this={heightDiv} class="grouped-box"></div></section>
  <section><h3>Weight</h3><div bind:this={weightDiv} class="grouped-box"></div></section>
</div>

<style>
.controls {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 1rem;
}
.controls fieldset {
  border: none;
}
.controls label {
  margin-right: 1rem;
}
.chart-box {
  margin: 2rem auto;
  max-width: 720px;
}
.grouped-column {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 720px;
  margin: 0 auto;
}
.grouped-box {
  width: 100%;
  height: auto;
}
</style>
