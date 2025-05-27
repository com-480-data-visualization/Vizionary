<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";
    import { feature } from "topojson-client";

    // Props using Svelte 5 syntax
    let { name, params } = $props();

    // State variables using Svelte 5 runes
    let containerElement = $state<HTMLDivElement>();
    let width = $state(960);
    let height = $state(500);
    let rawMapData = $state<Array<{year: number; country: string; sex: string; value: number}>>([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Derived filtered data based on gender and year range
    let filteredMapData = $derived.by(() => {
        if (rawMapData.length === 0) return [];
        
        console.log('Filtering map data with:', {
            gender: params.gender,
            startYear: params.startYear,
            endYear: params.endYear,
            rawDataLength: rawMapData.length
        });
        
        // Filter by year range first
        const yearFiltered = rawMapData.filter(d => 
            d.year >= params.startYear && d.year <= params.endYear
        );
        
        // Then filter by gender and aggregate by country
        let processedData;
        if (params.gender === "male") {
            processedData = yearFiltered.filter(d => d.sex === "M");
        } else if (params.gender === "female") {
            processedData = yearFiltered.filter(d => d.sex === "F");
        } else {
            // For "all", keep both male and female data
            processedData = yearFiltered;
        }
        
        // Group by country and sum values across years and genders (if "all")
        const grouped = d3.group(processedData, d => d.country);
        const aggregated = Array.from(grouped, ([country, entries]) => ({
            country,
            sex: params.gender === "all" ? "All" : entries[0].sex,
            value: d3.sum(entries, d => d.value),
            yearRange: `${params.startYear}-${params.endYear}`
        }));
        
        console.log('Filtered map data result:', aggregated);
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
                throw new Error("Map data not found in the JSON file or not in expected format.");
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'An unknown error occurred';
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
            const countries = feature(world as any, (world as any).objects.countries).features;

            // Create SVG
            const svg = d3.select(containerElement)
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            // Set up projection
            const projection = d3.geoMercator().fitSize([width, height], {
                type: "FeatureCollection",
                features: countries,
            });
            const path = d3.geoPath().projection(projection);

            // Create color scale
            const valueById = new Map(filteredMapData.map(d => [d.country, d.value]));
            const maxVal = d3.max(filteredMapData, d => d.value) ?? 1;
            const color = d3.scaleSequential()
                .domain([0, maxVal])
                .interpolator(d3.interpolateBlues);

            // Create tooltip
            const tooltip = d3.select(containerElement)
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
                .attr("fill", d => {
                    const val = valueById.get(d.properties.name) ?? 0;
                    return val > 0 ? color(val) : "#f0f0f0";
                })
                .attr("stroke", "#999")
                .attr("stroke-width", 0.5)
                .on("mouseover", (event, d) => {
                    const val = valueById.get(d.properties.name) ?? 0;
                    if (val > 0) {
                        tooltip
                            .style("opacity", 1)
                            .html(`
                                <strong>${d.properties.name}</strong><br/>
                                ${params.gender === "all" ? "Total" : params.gender === "male" ? "Male" : "Female"} Athletes: <strong>${val}</strong><br/>
                                Years: ${params.startYear}-${params.endYear}
                            `)
                            .style("left", `${event.pageX + 8}px`)
                            .style("top", `${event.pageY + 8}px`);
                    }
                })
                .on("mouseout", () => tooltip.style("opacity", 0));

            // Add legend
            const legendWidth = 300;
            const legendHeight = 20;
            const legend = svg.append("g")
                .attr("transform", `translate(${width - legendWidth - 20}, ${height - 60})`);

            // Create gradient for legend
            const defs = svg.append("defs");
            const gradient = defs.append("linearGradient")
                .attr("id", "map-legend-gradient");

            gradient.selectAll("stop")
                .data(d3.range(0, 1.01, 0.1))
                .join("stop")
                .attr("offset", d => `${d * 100}%`)
                .attr("stop-color", d => color(d * maxVal));

            legend.append("rect")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#map-legend-gradient)")
                .attr("stroke", "#333")
                .attr("stroke-width", 1);

            // Add legend labels
            legend.append("text")
                .attr("x", 0)
                .attr("y", legendHeight + 15)
                .style("text-anchor", "start")
                .style("font-size", "12px")
                .text("0");

            legend.append("text")
                .attr("x", legendWidth)
                .attr("y", legendHeight + 15)
                .style("text-anchor", "end")
                .style("font-size", "12px")
                .text(maxVal.toString());

            legend.append("text")
                .attr("x", legendWidth / 2)
                .attr("y", -5)
                .style("text-anchor", "middle")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text(`Athletes (${params.startYear}-${params.endYear})`);

        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to draw map';
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
        if (name || params || filteredMapData.length > 0 && width > 0 && height > 0) {
            drawMap();
        }
    });

    // Handle resize and initial dimensions setup
    onMount(() => {
        if (!containerElement) return;
        
        // Initialize width and height based on container size once component is mounted
        width = containerElement.clientWidth || 960;
        height = containerElement.clientHeight || 500;

        // Handle resizing
        const resizeObserver = new ResizeObserver(() => {
            if (containerElement) {
                const newWidth = containerElement.clientWidth || 960;
                const newHeight = containerElement.clientHeight || 500;
                
                // Only update if dimensions actually changed
                if (newWidth !== width || newHeight !== height) {
                    width = newWidth;
                    height = newHeight;
                }
            }
        });

        resizeObserver.observe(containerElement);

        // Cleanup the observer when the component is destroyed
        return () => {
            resizeObserver.disconnect();
        };
    });
</script>

<div class="w-full h-full p-4 flex flex-col text-center">
    <h2 class="text-center text-gray-800 text-xl font-bold mb-2">
        World Map
    </h2>
    
    <div 
        class="flex-1 bg-gray-100 p-3 rounded map-container" 
        bind:this={containerElement}
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
                <p class="text-gray-600">No map data available for {params.gender === "male" ? "Male" : params.gender === "female" ? "Female" : "All"} ({params.startYear}-{params.endYear})</p>
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