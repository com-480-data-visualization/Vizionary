<script lang="ts">
    import * as d3 from "d3";

    // Props using Svelte 5 syntax
    let { name, params } = $props();

    // State variables using Svelte 5 runes
    let containerElement = $state<HTMLDivElement>();
    let width = $state(400); // Default width
    let height = $state(200); // Default height, 2 times wider than high

    let rawData = $state<
        Array<{
            year: number;
            sex: string;
            Medal: string; // Ensure this matches your data key for medals
        }>
    >([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Derived statistics based on rawData and params
    let stats = $derived.by(() => {
        if (rawData.length === 0) {
            return {
                totalAthletes: 0,
                maleAthletes: 0,
                femaleAthletes: 0,
                goldMedals: 0,
                silverMedals: 0,
                bronzeMedals: 0,
                noMedals: 0,
                totalMedals: 0,
                avgMedalsPerAthlete: 0,
            };
        }

        console.log("Calculating stats with:", {
            startYear: params.startYear,
            endYear: params.endYear,
            rawDataLength: rawData.length,
        });

        // Filter data by year range
        const yearFiltered = rawData.filter(
            (d) => d.year >= params.startYear && d.year <= params.endYear,
        );

        let maleAthletes = 0;
        let femaleAthletes = 0;
        let goldMedals = 0;
        let silverMedals = 0;
        let bronzeMedals = 0;
        let noMedals = 0;

        // Use d3.group for efficient aggregation of athlete counts (unique individuals)
        // For male/female athletes, we're counting distinct occurrences in the filtered data.
        // If your 'scatter' data represents individual athlete entries (not just medal events),
        // then .length is appropriate. If one athlete can appear multiple times for different
        // events in the same year, you might need to count unique athlete IDs if available.
        // For simplicity, I'm assuming each entry in the filtered data is a distinct athlete-event record.
        const athletesByGender = d3.group(yearFiltered, (d) => d.sex);
        maleAthletes = athletesByGender.get("M")?.length ?? 0;
        femaleAthletes = athletesByGender.get("F")?.length ?? 0;
        const totalAthletes = maleAthletes + femaleAthletes; // Sum of all athlete records in the period

        // Count medals (only from the filtered data)
        const medalsByType = d3.group(yearFiltered, (d) => d.Medal); // Assuming 'Medal' is the key in your raw data
        goldMedals = medalsByType.get("Gold")?.length ?? 0;
        silverMedals = medalsByType.get("Silver")?.length ?? 0;
        bronzeMedals = medalsByType.get("Bronze")?.length ?? 0;
        noMedals = medalsByType.get("No Medal")?.length ?? 0;

        const totalMedals = goldMedals + silverMedals + bronzeMedals; // Sum of all actual medals
        const avgMedalsPerAthlete = totalAthletes > 0 ? (totalMedals / totalAthletes) : 0;


        return {
            totalAthletes,
            maleAthletes,
            femaleAthletes,
            goldMedals,
            silverMedals,
            bronzeMedals,
            noMedals,
            totalMedals,
            avgMedalsPerAthlete: avgMedalsPerAthlete.toFixed(2), // Format to 2 decimal places
        };
    });

    // Function to load data
    async function loadData(sportName: string) {
        if (!sportName) return;

        isLoading = true;
        error = null;
        rawData = []; // Clear previous data

        try {
            const response = await fetch(`/statics/${sportName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Loaded raw data for AthleteStats:", data);

            // Assuming 'scatter' data contains 'Year', 'Sex', and 'Medal' which are needed here
            if (data && data.scatter && Array.isArray(data.scatter)) {
                // We only need Year, Sex, and Medal for these stats
                rawData = data.scatter.map((d: any) => ({
                    year: d.Year,
                    sex: d.Sex,
                    Medal: d.Medal,
                }));
                console.log("Processed raw data for AthleteStats:", rawData);
            } else {
                throw new Error(
                    "Required 'scatter' data not found in the JSON file or not in expected format for Athlete Stats.",
                );
            }
        } catch (err) {
            error = err instanceof Error ? err.message : "An unknown error occurred";
            console.error("Error loading data for AthleteStats:", err);
        } finally {
            isLoading = false;
        }
    }

    // Effect to load data when name changes
    $effect(() => {
        if (name) {
            loadData(name);
        }
    });

</script>

<div class="w-full flex flex-col p-2">
    <div
        class="flex-1 bg-gray-100 p-2 rounded stats-container flex flex-col"
        bind:this={containerElement}
        bind:clientWidth={width}
        bind:clientHeight={height}
        style="height: {height}px; width: {width}px;"
    >
        {#if isLoading}
            <div class="loading-container">
                <p class="text-gray-600">Loading stats for {name}...</p>
            </div>
        {:else if error}
            <div class="error-container">
                <p class="text-red-600">Error: {error}</p>
            </div>
        {:else if rawData.length === 0}
            <div class="no-data-container">
                <p class="text-gray-600">No data available for selected period.</p>
            </div>
        {:else}
            <div class="stats-grid">
                <div class="athlete-stats">
                    <h4>Athletes</h4>
                    <p><strong>Total:</strong> {stats.totalAthletes}</p>
                    <p><strong>Male:</strong> {stats.maleAthletes}</p>
                    <p><strong>Female:</strong> {stats.femaleAthletes}</p>
                </div>
                <div class="medal-stats">
                    <h4>Medals</h4>
                    <p><strong>Gold:</strong> {stats.goldMedals}</p>
                    <p><strong>Silver:</strong> {stats.silverMedals}</p>
                    <p><strong>Bronze:</strong> {stats.bronzeMedals}</p>
                    <!-- <p><strong>Avg per Athlete:</strong> {stats.avgMedalsPerAthlete}</p> -->
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .stats-container {
        border-radius: 0.75rem;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .loading-container,
    .error-container,
    .no-data-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr; /* Two columns for athlete and medal stats */
        gap: 1rem; /* Gap between the two main columns */
        padding: 0 1rem; /* Add some padding on the sides */
        width: 100%; /* Ensure it takes full width of its container */
    }

    .athlete-stats,
    .medal-stats {
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 0.25rem; /* Smaller gap for lines within each section */
    }

    .stats-grid h4 {
        font-size: 1em;
        font-weight: 700;
        margin-bottom: 0.5em;
        color: #2d3748;
        border-bottom: 1px solid #e2e8f0; /* Light border under heading */
        padding-bottom: 0.2em;
    }

    .stats-grid p {
        margin: 0;
        font-size: 0.85em; /* Slightly smaller font for more text */
        color: #4a5568;
    }

    .stats-grid strong {
        color: #2d3748;
    }
</style>