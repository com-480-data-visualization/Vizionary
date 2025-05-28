<!-- SimilarSports.svelte -->
<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";

	// Props
	let { name } = $props();

	// State
	let similarities = $state({});
	let loading = $state(true);
	let error = $state(null);
	let similarSports = $state([]);

	// Function to calculate cosine similarity between two sports
	function calculateCosineSimilarity(sport1, sport2) {
		const keys = ["Age", "Height", "Weight"];

		let dotProduct = 0;
		let normA = 0;
		let normB = 0;

		for (const key of keys) {
			const a = sport1[key] || 0;
			const b = sport2[key] || 0;

			dotProduct += a * b;
			normA += a * a;
			normB += b * b;
		}

		if (normA === 0 || normB === 0) {
			return 0;
		}

		return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
	}

	// Function to find the 5 most similar sports
	function findSimilarSports(targetSportName, allSimilarities) {
		if (!allSimilarities[targetSportName]) {
			return [];
		}

		const targetSport = allSimilarities[targetSportName];
		const sportSimilarities = [];

		for (const [sportKey, sportData] of Object.entries(allSimilarities)) {
			if (sportKey !== targetSportName) {
				const similarity = calculateCosineSimilarity(
					targetSport,
					sportData,
				);
				sportSimilarities.push({
					name: sportData.Sport,
					key: sportKey,
					similarity: similarity,
					age: sportData.Age,
					height: sportData.Height,
					weight: sportData.Weight,
				});
			}
		}

		// Sort by similarity (descending) and take top 5
		return sportSimilarities
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, 3);
	}

	// Load similarities data
	onMount(async () => {
		try {
			const response = await fetch("/statics/similarities.json");
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			similarities = data;
			similarSports = findSimilarSports(name, data);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	});

	// Update similar sports when name prop changes
	$effect(() => {
		if (Object.keys(similarities).length > 0 && name) {
			similarSports = findSimilarSports(name, similarities);
		}
	});

	// Handle row click to navigate to sport page
	function handleRowClick(sportKey) {
		goto(`/${sportKey}`);
	}
</script>

<div class="similar-sports flex-1 p-2 flex flex-col min-h-0">
	{#if loading}
		<div class="loading">Loading similar sports...</div>
	{:else if error}
		<div class="error">Error loading data: {error}</div>
	{:else if similarSports.length === 0}
		<div class="no-data">No similar sports found for {name}</div>
	{:else}
		<div class="table-container overflow-auto flex-1 h-full">
			<table>
				<thead>
					<tr>
						<th>Sport</th>
						<th>Similarity</th>
						<th>Age Correlation</th>
						<th>Height Correlation</th>
						<th>Weight Correlation</th>
					</tr>
				</thead>
				<tbody>
					{#each similarSports as sport}
						<tr
							class="sport-row"
							onclick={() => handleRowClick(sport.key)}
							role="button"
							tabindex="0"
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleRowClick(sport.key);
								}
							}}
						>
							<td class="sport-name">{sport.name}</td>
							<td class="similarity"
								>{(sport.similarity * 100).toFixed(1)}%</td
							>
							<td class="correlation age"
								>{sport.age.toFixed(4)}</td
							>
							<td class="correlation height"
								>{sport.height.toFixed(4)}</td
							>
							<td class="correlation weight"
								>{sport.weight.toFixed(4)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.similar-sports {
		font-family:
			-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: #333;
		/* Ensure this is a flex column to contain the table-container */
		display: flex; /* Added for clarity, flex-col already implies this */
		flex-direction: column;
	}

	/* ... other styles ... */

	.table-container {
		overflow-y: auto;
		flex: 1;
		min-height: 0; /* Crucial for scrollable flex items */
		height: 0; /* Also crucial, forces flex item to initially have 0 height before growing */
	}

	table {
		width: max-content;
		min-width: 100%;
		/* Add table-layout fixed to help with column sizing if needed */
		table-layout: fixed; /* Consider adding this if column widths are inconsistent */
	}

	/* ... rest of your styles ... */


	.loading,
	.error,
	.no-data {
		padding: 1rem;
		text-align: center;
		color: #666;
		font-style: italic;
	}

	.error {
		color: #e74c3c;
		background-color: #fdf2f2;
		border: 1px solid #fecaca;
		border-radius: 0.375rem;
	}

	h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
	}

	thead {
		background-color: #f8fafc;
	}

	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.875rem;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid #e5e7eb;
	}

	.sport-row {
		cursor: pointer;
		transition: background-color 0.15s ease-in-out;
		border-bottom: 1px solid #f3f4f6;
	}

	.sport-row:hover {
		background-color: #f9fafb;
	}

	.sport-row:focus {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
		background-color: #f0f9ff;
	}

	.sport-row:last-child {
		border-bottom: none;
	}

	td {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sport-name {
		font-weight: 500;
		color: #1f2937;
	}

	.similarity {
		font-weight: 600;
		color: #059669;
	}

	.correlation {
		font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
		color: #6b7280;
	}

	.correlation.age {
		color: #dc2626;
	}

	.correlation.height {
		color: #2563eb;
	}

	.correlation.weight {
		color: #7c3aed;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		th,
		td {
			padding: 0.5rem;
			font-size: 0.8rem;
		}

		h3 {
			font-size: 1.1rem;
		}

		.correlation {
			font-size: 0.75rem;
		}
	}
</style>
