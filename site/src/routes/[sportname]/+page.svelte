<!-- App.svelte (or your main page) -->
<script>
  import ParallelCoordinates from "../../components/ParallelCoordinates.svelte";
  import HeatMap from "../../components/HeatMap.svelte";
  import BoxComponent from "./../../components/BoxComponent.svelte";
  import DummyContent from "./../../components/DummyContent.svelte";
  import Similarities from "../../components/Similarities.svelte";
  import BarChart from "../../components/BarChart.svelte";
  import Parameters from "../../components/Parameters.svelte";
  import WorldMap from "../../components/WorldMap.svelte";
  import TreeMap from "../../components/TreeMap.svelte";
  import { onMount } from "svelte";
    import BasicInfo from "../../components/BasicInfo.svelte";

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
</script>

{#if sportname}
  <div class="m-0 p-0 h-screen w-screen bg-gray-100">
    <div class="h-screen w-full flex flex-col">
      <!-- Header -->
      <div class="header flex justify-center p-4">
        <span class="font-bold text-3xl text-gray-700">{name_display}</span>
      </div>

      <!-- Main content area -->
      <div class="flex flex-col flex-1 w-full p-2 gap-4">
        <!-- Top row -->
        <div class="flex flex-row flex-3 w-full gap-4">
          <!-- Top left section - 1/5 width -->
          <div
            class="w-1/5 h-full bg-white border-2 border-gray-300 rounded-xl shadow-sm p-0 flex flex-col"
          >
         
            <div class="flex-1 overflow-y-auto overflow-x-hidden p-4">
              <h2 class="text-gray-800 text-xl font-bold mb-2">
                Parameters
            </h2>
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

          <!-- Top middle section with tabs - 2/5 width -->
          <!-- Top middle section with tabs - 2/5 width -->
          <div
            class="w-2/5 h-full flex flex-col bg-white border-2 border-gray-300 rounded-xl shadow-sm p-4"
          >
            <!-- Give BoxComponent the height it needs -->
            <div class="flex flex-col flex-1 h-full">
              <BoxComponent>
                <h2 class="text-gray-800 text-xl font-bold mb-2">
                  Athletes and medals per country
                </h2>
                <!-- Tab Navigation -->
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

                <!-- Tab Content -->
                <div class="flex-1 flex overflow-hidden">
                  {#if activeTab === "treemap"}
                    <TreeMap name={sportname} params={filterParams} />
                  {:else if activeTab === "worldmap"}
                    <WorldMap name={sportname} params={filterParams} />
                  {/if}
                </div>
              </BoxComponent>
            </div>
          </div>

          <!-- Top right section - divided horizontally - 2/5 width -->
          <div class="w-2/5 h-full flex flex-col gap-4">
            <!-- Top right upper section -->
            <div
            class="w-full h-1/2 bg-white border-2 border-gray-300 rounded-xl flex flex-col shadow-sm p-4"
            >
            <BoxComponent>
                <h3 class="text-gray-800 text-xl mb-2 font-bold">Athlete Statistics</h3>
                <BasicInfo name={sportname} params={filterParams} />
                <!-- <TreeMap name={sportname} params={filterParams} /> -->
              </BoxComponent>
            </div>

            <!-- Top right lower section -->
            <div
              class="w-full h-1/2 bg-white border-2 border-gray-300 rounded-xl flex shadow-sm p-3"
            >
              <BoxComponent title="Top Right Lower">
                <!-- <ParallelCoordinates name={sportname} params={filterParams} /> -->

                <HeatMap name={sportname} params={filterParams} />
              </BoxComponent>
            </div>
          </div>
        </div>

        <!-- Bottom row - divided into 3 sections -->
        <div class="flex-1 flex flex-row flex-2 w-full gap-4">
          <!-- Bottom left section -->
          <div
            class="flex-1 h-full bg-white border-2 border-gray-300 rounded-xl flex flex-col shadow-sm p-3"
          >
            <BoxComponent title="Bottom Left" class="flex-1 h-full">
              <ParallelCoordinates name={sportname} params={filterParams} />
            </BoxComponent>
          </div>

          <!-- Bottom middle section -->
          <div
            class="w-1/3 h-full min-h-0 flex flex-col bg-white border-2 border-gray-300 rounded-xl shadow-sm p-3"
          >
            <BoxComponent title="Bottom Middle">
              <Similarities name={sportname} />
            </BoxComponent>
          </div>

          <!-- Bottom right section -->
          <div
            class="w-1/3 h-full bg-white border-2 border-gray-300 rounded-xl flex shadow-sm p-3"
          >
            <BoxComponent title="Bottom Right">
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
