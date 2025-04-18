<script lang="ts">
	import BubbleChart from '../components/BubbleChart.svelte';
	import { writable } from 'svelte/store';
	
	// Store for selected Olympics data
	const selectedOlympics = writable(null);
	
	// Event handling
	function handleBubbleSelect(data: any) {
	  selectedOlympics.set(data);
	}
  </script>
  
  <h1 class="text-4xl font-light text-gray-800 mb-8">Olympic Athlete Analysis</h1>
  
  <div class="flex flex-col gap-6">
	<!-- Main content area (full width) -->
	<div class="w-full aspect-video bg-gray-50 rounded-xl shadow-sm border-4 border-gray-300 p-6">
	  <BubbleChart onBubbleSelect={handleBubbleSelect} />
	</div>
	
	<!-- Bottom panel -->
	<div class="w-full bg-gray-50 rounded-xl shadow-sm border-4 border-gray-100 p-6">
	  <h2 class="text-xl font-medium text-gray-700 mb-4">Selected Olympics</h2>
	  
	  {#if $selectedOlympics}
		<div class="bg-white p-4 rounded-lg shadow-sm">
		  <h3 class="text-lg font-medium">{$selectedOlympics.year} {$selectedOlympics.season} Olympics</h3>
		  <p class="text-gray-600">{$selectedOlympics.city}, {$selectedOlympics.country}</p>
		  
		  <div class="mt-4 grid grid-cols-4 gap-4 text-sm">
			<div>
			  <p class="text-gray-500">Athletes</p>
			  <p class="font-medium">{$selectedOlympics.total_athletes.toLocaleString()}</p>
			</div>
			<div>
			  <p class="text-gray-500">Countries</p>
			  <p class="font-medium">{$selectedOlympics.total_countries}</p>
			</div>
			<div>
			  <p class="text-gray-500">Events</p>
			  <p class="font-medium">{$selectedOlympics.total_events}</p>
			</div>
			<div>
			  <p class="text-gray-500">Genetic Impact</p>
			  <p class="font-medium">{Math.round($selectedOlympics.genetic_impact_ratio * 100)}%</p>
			</div>
		  </div>
		</div>
	  {:else}
		<p class="text-gray-500">Click on a bubble to view detailed information about the selected Olympic Games.</p>
		<div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
		  <div>
			<p>This visualization shows Olympic Games from 1900 to 2018.</p>
		  </div>
		  <div>
			<p>The bubble size represents the number of athletes.</p>
		  </div>
		  <div>
			<p>Color indicates whether it was a Summer (orange) or Winter (blue) Olympics.</p>
		  </div>
		  <div>
			<p>The color intensity represents genetic impact ratio.</p>
		  </div>
		</div>
	  {/if}
	</div>
  </div>