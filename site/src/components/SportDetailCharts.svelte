<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import { drawScatterMatrix } from "$lib/d3/scatterMatrix"; //elément de d3 pour faire un scatter plot
  import { drawHeatmap } from "$lib/d3/heatmap"; //elément de d3 pour faire un heatmap
  import { drawGroupedBars } from "$lib/d3/groupedBar"; 
  import { drawTreemap, type CountryDatum } from "$lib/d3/treemap";

  // for the Map
  import { drawMap } from "$lib/d3/map";

  //elément de d3 pour faire un grouped bar chart

  export let sportKey: string; // paramètre utilisé pour les différents graphiques, dépend du parent ne change pas localement 
  const sex = writable<"M"|"F">("F"); // change localement 
  // for the Map
  // export let data: { country: string; value: number }[] = [];

//   export let data = [
//   { country: "France", value: 100 }, // France
// ];

// export let treeData: CountryDatum[] = [
//     { country:"Russie",  athletes:232, region:"Europe" },
//     { country:"Suisse",  athletes:165, region:"Europe" },
//     { country:"Allemagne", athletes:153, region:"Europe" },
//     { country:"USA",     athletes:230, region:"North America" },
//     { country:"Canada",  athletes:220, region:"North America" },
//     { country:"Japon",   athletes:113, region:"Asia" },
//     // …etc.
//   ];


  // déclaration des éléments HTML pour les différents graphiques
  let scatterDiv: HTMLDivElement;
  let heatmapDiv: HTMLDivElement;
  let gbAgeDiv: HTMLDivElement;
  let gbHeightDiv: HTMLDivElement;
  let gbWeightDiv: HTMLDivElement;

  // for the Map
  let mapDiv: HTMLDivElement;
  let treemapDiv: HTMLDivElement;


  // fonction pour redessiner les graphiques en fonction de la sélection de sexe et appel des données 
  function redraw(sex: "M"|"F") {
    if (scatterDiv) drawScatterMatrix(scatterDiv, sportKey, sex);
    if (heatmapDiv) drawHeatmap(heatmapDiv, sportKey, sex);
    if (gbAgeDiv) drawGroupedBars(gbAgeDiv, sportKey, "age", sex);
    if (gbHeightDiv) drawGroupedBars(gbHeightDiv, sportKey, "height", sex);
    if (gbWeightDiv) drawGroupedBars(gbWeightDiv, sportKey, "weight", sex);
    if (mapDiv) drawMap(mapDiv, sportKey,sex);
    if (treemapDiv) drawTreemap(treemapDiv, sportKey,sex,{ minShare: 0.0000, maxShown: 30 });
  }
// appel de redraw lors du changement initial 
  onMount(() => {
    redraw($sex);
  });

  // fonction pour redessiner les graphiques en fonction de la sélection de sexe
  $: if (scatterDiv && heatmapDiv && gbAgeDiv && gbHeightDiv && gbWeightDiv && mapDiv && treemapDiv) {
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

<h2>Map</h2>
<div class="chart-box" bind:this={mapDiv}></div>

<h2>Répartition par pays – Treemap</h2>
<div class="chart-box" bind:this={treemapDiv}></div>

<style>
.controls { text-align:center; margin-bottom:1rem; }
.controls label { margin:0 1rem; font-weight:bold; }
.chart-box { margin:2rem auto; max-width:720px; }
.grouped-grid { display:flex; flex-wrap:wrap; gap:1.5rem; justify-content:center; align-items:flex-start; }
.grouped-box { width: 400px; height: auto; }
</style>
