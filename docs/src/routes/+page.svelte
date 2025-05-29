<script lang="ts">
  import SportBubbleChart from '../components/SportBubbleChart.svelte';
  import { goto } from '$app/navigation'; // Import SvelteKit's navigation module
  import { writable } from 'svelte/store';

  const selectedSport = writable<string | null>(null);

  function handleSportSelect(event: CustomEvent<{ sportKey: string }>) {
    const sportKey = event.detail.sportKey;
    selectedSport.set(sportKey);
    goto(`aaa`); // Navigate to the new sport-specific route
  }
</script>

<div class="h-screen w-screen flex flex-col bg-gray-100 p-4">
  {#if !$selectedSport}
    <div class="flex flex-col items-center flex-grow w-full h-full">
      <div class="text-center mb-8">
        <h1 class="font-bold text-4xl text-gray-800 mb-3">Olympic Athlete Physical Attributes</h1>
        <p class="text-lg text-gray-600">
          Discover the unique characteristics of athletes across various Olympic sports. Each bubble represents a sport, with its size indicating the number of participants and its color reflecting the medal count.
        </p>
      </div>

      <div class="flex-grow w-full bg-white border-2 border-gray-300 rounded-xl shadow-lg p-4 flex items-center justify-center">
        <SportBubbleChart on:sportSelect={handleSportSelect} />
      </div>

      <p class="text-sm text-gray-500 mt-6 text-center">Click on a bubble to explore a sport in detail!</p>
    </div>
  {:else}
    <button
      class="text-blue-600 hover:text-blue-800 font-bold transition-colors duration-200 mb-4 flex items-center gap-2"
      on:click={() => selectedSport.set(null)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      Back to Sports Overview
    </button>
    <h2 class="font-bold text-3xl text-yellow-500 mb-6 capitalize">Sport: {$selectedSport?.replaceAll("_", " ")}</h2>
    <p class="text-gray-700">Navigating to {$selectedSport ? `/${$selectedSport}` : 'sport detail'}...</p>
  {/if}
</div>