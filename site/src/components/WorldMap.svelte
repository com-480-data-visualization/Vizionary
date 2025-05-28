<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";
    import { feature } from "topojson-client";

    // Props using Svelte 5 syntax
    let { name, params } = $props();

    // State variables using Svelte 5 runes
    let containerElement = $state<HTMLDivElement>();
    let width = $state(600);
    let height = $state(500);
    let rawMapData = $state<
        Array<{ year: number; country: string; sex: string; value: number }>
    >([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Derived filtered data based on gender, year range, AND medal types
    let filteredMapData = $derived.by(() => {
        if (rawMapData.length === 0) return [];

        console.log("Filtering map data with:", {
            gender: params.gender,
            startYear: params.startYear,
            endYear: params.endYear,
            medals: params.medals, // Added medals to console log
            rawDataLength: rawMapData.length,
        });

        // Filter by year range first
        const yearFiltered = rawMapData.filter(
            (d) => d.year >= params.startYear && d.year <= params.endYear,
        );

        // Then filter by gender
        let genderFiltered;
        if (params.gender === "male") {
            genderFiltered = yearFiltered.filter((d) => d.sex === "M");
        } else if (params.gender === "female") {
            genderFiltered = yearFiltered.filter((d) => d.sex === "F");
        } else {
            genderFiltered = yearFiltered;
        }

        // --- START MODIFICATION ---
        // Filter by medal types
        const medalFiltered = genderFiltered.filter((d) => {
            // Check if the medal type is true in filterParams.medals
            if (d.medal === "Gold" && params.medals.gold) return true;
            if (d.medal === "Silver" && params.medals.silver) return true;
            if (d.medal === "Bronze" && params.medals.bronze) return true;
            if (d.medal === "No Medal" && params.medals.noMedal) return true;
            return false;
        });

        // Group by country and sum values across years, genders, and medal types
        const grouped = d3.group(medalFiltered, (d) => d.country);
        // --- END MODIFICATION ---

        const aggregated = Array.from(grouped, ([country, entries]) => ({
            country,
            // Sex and yearRange will be consistent across entries grouped by country
            // if you strictly filter before aggregation.
            // For simplicity, we'll just take the first entry's sex or 'All' if applicable.
            sex: params.gender === "all" ? "All" : entries[0].sex,
            value: d3.sum(entries, (d) => d.value),
            yearRange: `${params.startYear}-${params.endYear}`,
        }));

        console.log("Filtered map data result:", aggregated);
        return aggregated;
    });

    // Function to load data
    async function loadData(sportName: string) {
        if (!sportName) return;

        isLoading = true;
        error = null;
        rawMapData = [];

        try {
            const response = await fetch(`/statics/${sportName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const rawData = await response.json();
            console.log("Loaded raw data:", rawData);

            // Extract the map data from the raw JSON
            if (rawData && rawData.map && Array.isArray(rawData.map)) {
                rawMapData = rawData.map;
                console.log("Processed map data:", rawMapData);
            } else {
                throw new Error(
                    "Map data not found in the JSON file or not in expected format.",
                );
            }
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred";
            console.error("Error loading map data:", err);
        } finally {
            isLoading = false;
        }
    }

    // Function to draw the map
    async function drawMap() {
        if (!containerElement || filteredMapData.length === 0) return;

        try {
            // Clear existing content
            containerElement.innerHTML = "";

            // Load world geo data
            const world = await d3.json(`/statics/front/countries-110m.json`);
            const countries = feature(
                world as any,
                (world as any).objects.countries,
            ).features;

            const margin = { top: 30, right: 50, bottom: 10, left: 50 };
            const plotWidth = width - margin.right - margin.left;
            const plotHeight = height - margin.top - margin.bottom - 30;

            // Create SVG
            const svg = d3
                .select(containerElement)
                .append("svg")
                .attr("width", plotWidth)
                .attr("height", plotHeight);

            // Set up projection
            const projection = d3
                .geoMercator()
                .fitSize([plotWidth, plotHeight], {
                    type: "FeatureCollection",
                    features: countries,
                });
            let currentScale = projection.scale();
            let currentTranslate = projection.translate();

            // Define your desired zoom factor (e.g., 1.2 for 20% zoom in)
            const zoomFactor = 2; // Example: 50% more zoomed in

            // Apply the new scale
            projection.scale(currentScale * zoomFactor);

            // Re-center the map after scaling (optional but recommended)
            // You might need to adjust the translation based on your specific needs
            // A simple re-centering:
            const newScale = currentScale * zoomFactor;
            const xOffset = plotWidth / 2; - currentTranslate[0] * zoomFactor;
            const yOffset = plotHeight / 2 + 100;
            projection.translate([xOffset, yOffset]);
            // --- MANUAL ZOOM END ---

            const path = d3.geoPath().projection(projection);

            // Create color scale
            const valueById = new Map(
                filteredMapData.map((d) => [d.country, d.value]),
            );
            const maxVal = d3.max(filteredMapData, (d) => d.value) ?? 1;
            const color = d3
                .scaleSequential()
                .domain([0, maxVal])
                .interpolator(d3.interpolateBlues);

            // Create tooltip
            const tooltip = d3
                .select(containerElement)
                .append("div")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background-color", "rgba(0, 0, 0, 0.7)")
                .style("color", "white")
                .style("padding", "5px 10px")
                .style("border-radius", "5px")
                .style("font-size", "12px")
                .style("opacity", 0);

            // Draw countries
            svg.selectAll("path")
                .data(countries)
                .join("path")
                .attr("d", path)
                .attr("fill", (d) => {
                    const val = valueById.get(d.properties.name) ?? 0;
                    return val > 0 ? color(val) : "#f0f0f0";
                })
                .attr("stroke", "#999")
                .attr("stroke-width", 0.5)
                .on("mouseover", (event, d) => {
                    const val = valueById.get(d.properties.name) ?? 0;
                    if (val > 0) {
                        // Get the bounding rectangle of the container element
                        const containerRect = containerElement.getBoundingClientRect();
                        
                        // Calculate tooltip position relative to the container
                        // event.clientX/Y are viewport coordinates
                        // containerRect.left/top are container's viewport coordinates
                        // So, event.clientX - containerRect.left gives position relative to container
                        const x = event.clientX - containerRect.left + 15; // +15px offset from cursor
                        const y = event.clientY - containerRect.top + 15;  // +15px offset from cursor

                        tooltip
                            .style("opacity", 1)
                            .html(`
                                <strong>${d.properties.name}</strong><br/>
                                ${params.gender === "all" ? "Total" : params.gender === "male" ? "Male" : "Female"} Athletes: <strong>${val}</strong><br/>
                                Years: ${params.startYear}-${params.endYear}
                            `)
                            .style("left", `${x}px`)
                            .style("top", `${y}px`);
                    }
                })
                .on("mouseout", () => tooltip.style("opacity", 0));

            // Add legend
            const legendWidth = 300;
            const legendHeight = 20;
            const legend = svg
                .append("g")
                .attr(
                    "transform",
                    `translate(${width - legendWidth - 200}, ${height - 60})`,
                );

            // Create gradient for legend
            const defs = svg.append("defs");
            const gradient = defs
                .append("linearGradient")
                .attr("id", "map-legend-gradient");

        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to draw map";
            console.error("Error drawing map:", err);
        }
    }

    // Effect to load data when name changes
    $effect(() => {
        if (name) {
            loadData(name);
        }
        // console.log('data', filteredMapData)
    });

    // Effect to draw map when filtered data or dimensions change
    $effect(() => {
        if (name || params || filteredMapData.length > 0) {
            drawMap();
        }
    });
</script>

<div class="w-full flex-1 p-4 flex flex-col text-center">
    <div
        class="flex-1 bg-gray-100 p-3 rounded map-container"
        bind:this={containerElement}
        bind:clientHeight={height}
        bind:clientWidth={width}
    >
        {#if isLoading}
            <div class="loading-container">
                <p class="text-gray-600">Loading map data for {name}...</p>
            </div>
        {:else if error}
            <div class="error-container">
                <p class="text-red-600">Error loading map data: {error}</p>
            </div>
        {:else if !filteredMapData || filteredMapData.length === 0}
            <div class="loading-container">
                <p class="text-gray-600">
                    No map data available for {params.gender === "male"
                        ? "Male"
                        : params.gender === "female"
                          ? "Female"
                          : "All"} ({params.startYear}-{params.endYear})
                </p>
            </div>
        {/if}
    </div>
</div>

<style>
    .map-container {
        width: 100%;
        height: 100%;
        background-color: #f8f9fa;
        border-radius: 0.75rem;
        overflow: hidden;
        position: relative;
    }

    .loading-container,
    .error-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
    }

    /* Style the map elements */
    :global(.map-container svg) {
        width: 100%;
        height: 100%;
    }

    :global(.map-container path:hover) {
        stroke: #333;
        stroke-width: 1px;
    }

    :global(.tooltip) {
        z-index: 10;
    }
</style>
