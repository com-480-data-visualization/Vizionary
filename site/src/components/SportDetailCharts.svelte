<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import { drawScatterMatrix } from "$lib/d3/scatterMatrix";
  import { drawHeatmap } from "$lib/d3/heatmap";
  import { drawGroupedBars } from "$lib/d3/groupedBar";

  export let sportKey: string;
  const sex = writable<"M"|"F">("F");

  let scatterDiv: HTMLDivElement;
  let heatmapDiv: HTMLDivElement;
  let gbAgeDiv: HTMLDivElement;
  let gbHeightDiv: HTMLDivElement;
  let gbWeightDiv: HTMLDivElement;

  function redraw(sex: "M"|"F") {
    if (scatterDiv) drawScatterMatrix(scatterDiv, sportKey, sex);
    if (heatmapDiv) drawHeatmap(heatmapDiv, sportKey, sex);
    if (gbAgeDiv) drawGroupedBars(gbAgeDiv, sportKey, "age", sex);
    if (gbHeightDiv) drawGroupedBars(gbHeightDiv, sportKey, "height", sex);
    if (gbWeightDiv) drawGroupedBars(gbWeightDiv, sportKey, "weight", sex);
  }

  onMount(() => {
    redraw($sex);
  });

  $: if (scatterDiv && heatmapDiv && gbAgeDiv && gbHeightDiv && gbWeightDiv) {
    redraw($sex);
  }
</script>

<div class="controls">
  <label><input type="radio" bind:group={$sex} value="F"/> Female</label>
  <label><input type="radio" bind:group={$sex} value="M"/> Male</label>
</div>

<h2>Scatterplot Matrix</h2>
<div class="chart-box" bind:this={scatterDiv}></div>

<h2>Correlation Heatmap</h2>
<div class="chart-box" bind:this={heatmapDiv}></div>

<h2>Average by Medal & Year</h2>
<div class="grouped-grid">
  <div>
    <h3>Age</h3>
    <div bind:this={gbAgeDiv} class="grouped-box"></div>
  </div>
  <div>
    <h3>Height</h3>
    <div bind:this={gbHeightDiv} class="grouped-box"></div>
  </div>
  <div>
    <h3>Weight</h3>
    <div bind:this={gbWeightDiv} class="grouped-box"></div>
  </div>
</div>

<style>
.controls { text-align:center; margin-bottom:1rem; }
.controls label { margin:0 1rem; font-weight:bold; }
.chart-box { margin:2rem auto; max-width:720px; }
.grouped-grid { display:flex; flex-wrap:wrap; gap:1.5rem; justify-content:center; align-items:flex-start; }
.grouped-box { width: 400px; height: auto; }
</style>
