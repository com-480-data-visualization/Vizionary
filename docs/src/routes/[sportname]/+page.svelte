<script>
  import ParallelCoordinates from "../../components/ParallelCoordinates.svelte";
  import HeatMap from "../../components/HeatMap.svelte";
  import BoxComponent from "./../../components/BoxComponent.svelte";
  import ToolTip from "./../../components/ToolTip.svelte";
  import Similarities from "../../components/Similarities.svelte";
  import BarChart from "../../components/BarChart.svelte";
  import Parameters from "../../components/Parameters.svelte";
  import WorldMap from "../../components/WorldMap.svelte";
  import TreeMap from "../../components/TreeMap.svelte";
  import { onMount } from "svelte";
  import BasicInfo from "../../components/BasicInfo.svelte";

  import { goto } from "$app/navigation"; // Import SvelteKit's navigation module

  // Import Lucide icons
  import { Maximize, Minimize, ArrowLeft } from "lucide-svelte";
  // Import the new LoadingSpinner component
  import LoadingSpinner from "../../components/LoadingSpinner.svelte";

  let filterParams = $state({
    startYear: 1900,
    endYear: 2016,
    gender: "all",
    medals: {
      gold: true,
      silver: true,
      bronze: true,
      noMedal: true,
    },
    attribute: "age",
  });

  // Tab state for switching between TreeMap and WorldMap
  let activeTab = $state("treemap");

  let { data } = $props();
  let isMapZoomed = $state(false); // Controls only the Map/Treemap zoom
  let isLoadingMap = $state(false); // New state for loading indicator

  // Access the JSON data
  let sportname = $derived(data.sportname);

  let similarities = $state([]);

  let name_display = $derived(similarities[sportname]?.Sport || sportname);

  onMount(async () => {
    try {
      const response = await fetch("/statics/similarities.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      similarities = data;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });

  let treemapwidth = $state();

  $effect(() => {
    console.log('changed size');
    const renderDelay = 10;
    if(treemapwidth) {
      isLoadingMap = true; // Start loading

    setTimeout(() => {
      isLoadingMap = false; // End loading after a short delay
    }, renderDelay);
    }
  });

  function toggleMapZoom() {
    isLoadingMap = true; // Start loading
    isMapZoomed = !isMapZoomed; // Toggle zoom state immediately

    // Use a setTimeout to simulate the re-rendering time
    // Adjust this duration based on how long your map components actually take to render
    const renderDelay = 300; // ms

    setTimeout(() => {
      isLoadingMap = false; // End loading after a short delay
    }, renderDelay);
  }

  function goHome() {
    goto("/"); // Navigate to the root (home) page
  }
</script>

{#if sportname}
  <div class="m-0 p-0 h-screen w-screen">
    <div class="h-screen w-full flex flex-col">
      <div class="header flex justify-between items-center p-4">
        <button
          class="text-gray-600 hover:text-blue-600 font-semibold transition-colors duration-200 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-300"
          onclick={goHome}
        >
          <ArrowLeft size="20" />
          Back to Sports
        </button>
        <span class="font-bold text-3xl text-gray-700">{name_display} </span> <span class="font-bold text-3xl text-gray-700 pr-10">Hover the titles !</span>
      </div>
      
      <div
        class="flex flex-col flex-1 w-full p-2 gap-4 {isMapZoomed
          ? 'items-center justify-center'
          : ''}"
      >
        <div
          class="flex flex-row flex-3 w-full gap-4 {isMapZoomed
            ? 'flex-grow items-center justify-center'
            : ''}"
        >
          <div
            class="w-1/5 h-full bg-white border-2 border-gray-300 rounded-xl shadow-sm p-0 flex flex-col {isMapZoomed
              ? 'hidden'
              : ''}"
          >
            <div class="flex-1 overflow-y-auto overflow-x-hidden p-4">
              <ToolTip 
  content="<strong>Live Controls</strong><br>Adjust these filters to see <span class='text-blue'>real-time updates</span> across all visualizations.<br><small>Changes instantly affect maps, charts, and statistics</small>" 
  html={true}
  position="right"
>
  <h2 class="text-gray-800 text-xl font-bold mb-2">Parameters</h2>
</ToolTip>
              <BoxComponent>
                <Parameters
                  bind:startYear={filterParams.startYear}
                  bind:endYear={filterParams.endYear}
                  bind:gender={filterParams.gender}
                  bind:medals={filterParams.medals}
                  bind:attribute={filterParams.attribute}
                />
              </BoxComponent>
            </div>
          </div>

          <div
            class="h-full flex flex-col bg-white border-2 border-gray-300 rounded-xl shadow-sm p-4
            {isMapZoomed ? 'w-full h-full flex-grow' : 'w-2/5'}"
          >
            <div class="flex flex-col flex-1 h-full">
              <BoxComponent>
                <div class="flex justify-between items-center mb-2">
                  <ToolTip 
  content="<strong>Switch Views:</strong><br><span class='text-blue'>WorldMap</span> - Hover countries to see medal counts<br><span class='text-green'>TreeMap</span> - Visual breakdown of athletes per country" 
  html={true}
  position="bottom"
>
                    <h2 class="text-gray-800 text-xl font-bold">
                    Medals and Athletes per country
                    </h2>
                  </ToolTip>
                      
                      <button
                      class="text-gray-500 hover:text-blue-600"
                      onclick={toggleMapZoom}
                      >
                      {#if isMapZoomed}
                      <Minimize size="20" />
                      {:else}
                      <Maximize size="20" />
                      {/if}
                    </button>
                </div>

                <div class="flex border-b border-gray-200 mb-4">
                  <button
                    class="px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 {activeTab ===
                    'treemap'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'}"
                    onclick={() => (activeTab = "treemap")}
                  >
                    Athletes
                  </button>
                  <button
                    class="px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 {activeTab ===
                    'worldmap'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'}"
                    onclick={() => (activeTab = "worldmap")}
                  >
                    Medals
                  </button>
                </div>

                <div class="flex-1 flex overflow-hidden relative">
                  {#if isLoadingMap}
                    <LoadingSpinner />
                  {:else if activeTab === "treemap"}
                    {#if !isMapZoomed || (isMapZoomed && activeTab === "treemap")}
                      <TreeMap name={sportname} params={filterParams} bind:containerWidth={treemapwidth} />
                    {/if}
                  {:else if activeTab === "worldmap"}
                    {#if !isMapZoomed || (isMapZoomed && activeTab === "worldmap")}
                      <WorldMap name={sportname} params={filterParams} />
                    {/if}
                  {/if}
                </div>
              </BoxComponent>
            </div>
          </div>

          <div
            class="w-2/5 h-full flex flex-col gap-4 {isMapZoomed
              ? 'hidden'
              : ''}"
          >
            <div
              class="w-full h-45/100 bg-white border-2 border-gray-300 rounded-xl flex flex-col shadow-sm p-4"
            >
              <BoxComponent>
                <h3 class="text-gray-800 text-xl mb-2 font-bold">
                  Athlete Statistics
                </h3>
                {#if !isMapZoomed}
                  <BasicInfo name={sportname} params={filterParams} />
                {/if}
              </BoxComponent>
            </div>

            <div
              class="w-full h-55/100 bg-white border-2 border-gray-300 rounded-xl flex shadow-sm p-3"
            >
              <BoxComponent title="Heat Map">
                <ToolTip 
                content="<strong>Medal Correlation Heatmap</strong><br>Color intensity shows how <span class='text-red'>age</span>, <span class='text-green'>height</span>, or <span class='text-blue'>weight</span> correlate with medal success each year.<br><small>Darker colors = stronger correlation</small>" 
                html={true}
                position="top"
              >
              <h2 class="text-gray-800 text-xl font-bold mb-2">HeatMap</h2>
              </ToolTip>
                <HeatMap name={sportname} params={filterParams} />
              </BoxComponent>
            </div>
          </div>
        </div>

        <div
          class="flex-1 flex flex-row flex-2 w-full gap-4 {isMapZoomed
            ? 'hidden'
            : ''}"
        >
          <div
            class="flex-1 h-full bg-white border-2 border-gray-300 rounded-xl flex flex-col shadow-sm p-3"
          >
            <BoxComponent title="Parallel Coordinates" class="flex-1 h-full">
              <ToolTip 
  content="<strong>Athlete Profiles</strong><br>Each line represents <span class='text-blue'>one athlete</span> showing their weight, age, and height.<br>Look for <span class='highlight'>split regions</span> that reveal categories like lightweight vs heavyweight divisions." 
  html={true}
  position="top"
>
<h2 class=" text-gray-800 text-xl font-bold mb-2">
                Parallel Coordinates
            </h2>
</ToolTip>
              <div class="flex justify-between items-center mb-2"></div>
              <ParallelCoordinates name={sportname} params={filterParams} />
            </BoxComponent>
          </div>

          <div
            class="w-1/3 h-full min-h-0 flex flex-col bg-white border-2 border-gray-300 rounded-xl shadow-sm p-3"
          >
            <BoxComponent title="Similarities">
              <ToolTip 
  content="<strong>Similar Sports</strong><br>Discover sports with <span class='text-green'>similar medal patterns</span> based on athlete attributes.<br><small>Sports with comparable physical requirements often cluster together</small>" 
  html={true}
  position="top"
>
<h2 class=" text-gray-800 text-xl font-bold mb-2">
  Similarities
</h2>
</ToolTip>
              <div class="flex justify-between items-center mb-2"></div>
              <Similarities name={sportname} />
            </BoxComponent>
          </div>

          <div
            class="w-1/3 h-full bg-white border-2 border-gray-300 rounded-xl flex shadow-sm p-3"
          >
            <BoxComponent title="Bar Chart">
              <ToolTip 
  content="<strong>Attribute Trends</strong><br>Shows how the <span class='text-blue'>average selected attribute</span> (age, height, or weight) has evolved over time.<br><small>Reveals changing athlete profiles across decades</small>" 
  html={true}
  position="top"
>
<h2 class="text-gray-800 text-xl font-bold mb-2">
  Grouped Bars: {filterParams.attribute}
</h2>
</ToolTip>
              <BarChart
                name={sportname}
                attribute={filterParams.attribute}
                params={filterParams}
              />
            </BoxComponent>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <p>Loading data...</p>
{/if}

<style>
      :global(body) {
    background-color: rgb(243, 243, 243); /* bg-gray-50 equivalent */
      }
  </style>