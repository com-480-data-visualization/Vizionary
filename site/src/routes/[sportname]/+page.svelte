<!-- App.svelte (or your main page) -->
<script>
    import ParallelCoordinates from '../../components/ParallelCoordinates.svelte';
    import HeatMap from '../../components/HeatMap.svelte';
import BoxComponent from './../../components/BoxComponent.svelte';
    import DummyContent from './../../components/DummyContent.svelte';
    import Similarities from '../../components/Similarities.svelte';
    import BarChart from '../../components/BarChart.svelte';
    import Parameters from '../../components/Parameters.svelte';

    let filterParams = $state({
    startYear: 1980,
    endYear: 2000,
    gender: 'all',
    medals: {
      gold: true,
      silver: false,
      bronze: false,
      noMedal: false
    }
  });

    let { data } = $props();
  
  // Access the JSON data
  let sportname = $derived(data.sportname);
  </script>
  
  {#if sportname}
  <div class="m-0 p-0 h-screen w-screen bg-gray-100">
      <div class="h-screen w-full flex flex-col">
      <!-- Header -->
      <div class="header flex justify-center p-4">
        <span class="font-bold text-3xl text-gray-700">Basketball</span>
      </div>
      
      <!-- Main content area -->
      <div class="flex flex-col flex-1 w-full p-2 gap-4">
        <!-- Top row -->
        <div class="flex flex-row flex-3 w-full gap-4">
          <!-- Top left section - 3/5 width -->
          <div class="w-1/5 h-full bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
            <BoxComponent title="">
                <Parameters 
                  bind:startYear={filterParams.startYear}
                  bind:endYear={filterParams.endYear}
                  bind:gender={filterParams.gender}
                  bind:medals={filterParams.medals}
                />
            </BoxComponent>
          </div>

          <div class="w-2/5 h-full bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
            <BoxComponent title="">
              <DummyContent name="WorldMap (Flavia)" />
            </BoxComponent>
          </div>
          
          <!-- Top right section - divided horizontally - 2/5 width -->
          <div class="w-2/5 h-full flex flex-col gap-4">
            <!-- Top right upper section -->
            <div class="w-full h-1/2 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
                <BoxComponent title="Top Right Upper">
                <DummyContent name="Basic sport info (Flavia)" />
              </BoxComponent>
            </div>
            
            <!-- Top right lower section -->
            <div class="w-full h-1/2 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
              <BoxComponent title="Top Right Lower">
                <HeatMap name={sportname} params={filterParams} />
              </BoxComponent>
            </div>
          </div>
        </div>
        
        <!-- Bottom row - divided into 3 sections -->
        <div class="flex flex-row flex-2 w-full gap-4">
          <!-- Bottom left section -->
          <div class="w-1/3 h-full bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
            <BoxComponent title="Bottom Left">
              <ParallelCoordinates name={sportname} params={filterParams} />
            </BoxComponent>
          </div>
          
          <!-- Bottom middle section -->
          <div class="w-1/3 h-full bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
            <BoxComponent title="Bottom Middle">
              <Similarities name={sportname} />
            </BoxComponent>
          </div>
          
          <!-- Bottom right section -->
          <div class="w-1/3 h-full bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
            <BoxComponent title="Bottom Right">
              <BarChart name={sportname} 
              attribute="height" params={filterParams} />
            </BoxComponent>
        </div>
        </div>
      </div>
    </div>
</div>
{:else}
  <p>Loading data...</p>
{/if}