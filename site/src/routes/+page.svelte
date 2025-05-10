<script lang="ts">
  import SportBubbleChart from '../components/SportBubbleChart.svelte';
  import SportDetailCharts from '../components/SportDetailCharts.svelte';
  import { writable } from 'svelte/store';

  const selectedSport = writable<string | null>(null);
</script>

{#if !$selectedSport}
  <h1 class="page-title">Olympic Athlete Physical Attributes</h1>
  <p class="page-subtitle">
    Each bubble = a sport. Bubble size ∝ number of participants, color ∝ medal count.
  </p>
  <SportBubbleChart on:sportSelect={(e) => selectedSport.set(e.detail.sportKey)} />
{:else}
  <button class="back-button" on:click={() => selectedSport.set(null)}>
    ← Back to Sports
  </button>
  <h2 class="selected-title">Sport: {$selectedSport.replaceAll("_", " ").toUpperCase()}</h2>
  <SportDetailCharts sportKey={$selectedSport} />
{/if}

<style>
	.chart-container {
		width: 100%;
		height: 100%;
		background-color: #f8f9fa;
		border-radius: 0.75rem;
		overflow: hidden;
		position: relative;
	}
  .page-title {
    text-align: center;
    font-size: 2.5rem;
    font-weight: 600;
    margin-top: 1.5rem;
    color: rgb(0, 0, 0);
  }

  .page-subtitle {
    text-align: center;
    font-size: 1.1rem;
    color: #7a7777;
    margin-bottom: 1.5rem;
  }

  .back-button {
    margin-top: 1rem;
    color: #000000;
    background: none;
    border: none;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .selected-title {
    font-size: 1.8rem;
    text-align: center;
    margin-bottom: 1rem;
    color: #facc15;
    text-transform: capitalize;
  }
</style>
