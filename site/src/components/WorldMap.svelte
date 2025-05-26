<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";
    import { feature } from "topojson-client";

    // Props using Svelte 5 syntax
    let { sportKey, sex = "M", name } = $props<{
        sportKey: string;
        sex?: "M" | "F";
        name?: string;
    }>();

    // State variables using Svelte 5 runes
    let width = $state(960);
    let height = $state(500);
    let element = $state<HTMLDivElement>();
    let mapData = $state<any[]>([]);
    let countries = $state<any[]>([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Derived reactive values
    const filteredData = $derived(() => {
        if (!mapData.length) return [];
        
        // If each row has a `sex` key, filter; otherwise keep all
        return "sex" in mapData[0] 
            ? mapData.filter((d: any) => d.sex === sex)
            : mapData;
    });

    const valueById = $derived(() => {
        return new Map(filteredData.map(d => [d.country, d.value]));
    });

    const maxValue = $derived(() => {
        return filteredData.length > 0 ? d3.max(filteredData, d => d.value) ?? 1 : 1;
    });

    const colorScale = $derived(() => {
        return d3.scaleSequential()
            .domain([0, maxValue])
            .interpolator(d3.interpolateBlues);
    });

    // Function to load geographic data
    async function loadGeoData() {
        try {
            const world = await d3.json(`statics/front/countries-110m.json`);
            if (world) {
                countries = feature(world as any, (world as any).objects.countries).features;
            }
        } catch (err) {
            console.error("Error loading geographic data:", err);
            error = "Failed to load geographic data";
        }
    }

    // Function to load sport data
    async function loadSportData(sportName: string) {
        if (!sportName) return;
        
        isLoading = true;
        error = null;
        
        try {
            const response = await fetch(`/statics/${sportName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            
            const raw = await response.json();
            // const raw = Array.isArray(resp?.map) ? resp.map : [];
            
            mapData = raw;
            console.log('Loaded map data:', mapData);
            
        } catch (err) {
            error = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error("Error loading sport data:", err);
        } finally {
            isLoading = false;
        }
    }

    // Create the map visualization
    function createMap() {
        if (!element || !countries.length || !filteredData.length) return;
        
        // Clear existing content
        element.innerHTML = "";
        
        // Set dimensions
        const containerWidth = element.clientWidth || width;
        const containerHeight = element.clientHeight || height;
        
        // Create SVG
        const svg = d3.select(element)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight);
        
        // Set up projection
        const projection = d3.geoMercator()
            .fitSize([containerWidth, containerHeight], {
                type: "FeatureCollection",
                features: countries,
            });
        
        const path = d3.geoPath().projection(projection);
        
        // Create tooltip
        const tooltip = d3.select(element)
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", "10");
        
        // Draw countries
        svg.selectAll("path")
            .data(countries)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const val = valueById.get(d.properties.name) ?? 0;
                return colorScale(val);
            })
            .attr("stroke", "#999")
            .attr("stroke-width", "0.5")
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                const value = valueById.get(d.properties.name) ?? 0;
                
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 30) + "px")
                    .transition().duration(200)
                    .style("opacity", 1)
                    .html(`
                        <strong>${d.properties.name}</strong><br>
                        Value: ${value.toFixed(2)}<br>
                        Sex: ${sex === 'M' ? 'Male' : 'Female'}
                    `);
            })
            .on("mouseout", () => {
                tooltip.transition().duration(200).style("opacity", 0);
            });
    }

    // Effect to load geographic data on mount
    $effect(() => {
        loadGeoData();
    });

    // Effect to load sport data when sportKey changes
    $effect(() => {
        console.log('map')
        if (sportKey) {
            loadSportData(sportKey);
        }
    });

    // Effect to recreate map when data or dependencies change
    $effect(() => {
        if (countries.length > 0 && filteredData.length > 0 && element) {
            createMap();
        }
    });

    // Handle resize
    onMount(() => {
        if (!element) return;
        
        const resizeObserver = new ResizeObserver(() => {
            if (countries.length > 0 && filteredData.length > 0) {
                createMap();
            }
        });
        
        resizeObserver.observe(element);
        
        return () => {
            // resizeObserver.disconnect();
        };
    });
</script>

<div class="w-full h-full p-4 flex flex-col">
    <h2 class="text-center text-gray-800 text-xl font-bold mb-2">
        World Map - {name || sportKey}
        ({sex === "M" ? "Male" : "Female"})
    </h2>
    
    {#if isLoading}
        <div class="flex-1 bg-gray-100 p-3 rounded map-container flex items-center justify-center">
            <div class="text-gray-600">Loading map data for {sportKey}...</div>
        </div>
    {:else if error}
        <div class="flex-1 bg-gray-100 p-3 rounded map-container flex items-center justify-center">
            <div class="text-red-600">Error: {error}</div>
        </div>
    {:else if !filteredData.length}
        <div class="flex-1 bg-gray-100 p-3 rounded map-container flex items-center justify-center">
            <div class="text-gray-600">No data available for {sportKey}</div>
        </div>
    {:else}
        <div 
            class="flex-1 bg-gray-100 p-3 rounded map-container" 
            bind:this={element}
        >
            <!-- D3 will insert the SVG here -->
        </div>
    {/if}
    
    {#if filteredData.length > 0}
        <div class="mt-2 text-center text-sm text-gray-600">
            Showing data for {filteredData.length} countries
            <span class="ml-2">
                Max value: {maxValue.toFixed(2)}
            </span>
        </div>
    {/if}
</div>

<style>
    .map-container {
        width: 100%;
        height: 100%;
        background-color: #f8f9fa;
        border-radius: 0.75rem;
        overflow: hidden;
        position: relative;
        min-height: 400px;
    }
    
    :global(.tooltip) {
        z-index: 10;
    }
    
    :global(svg) {
        width: 100%;
        height: 100%;
    }
    
    :global(path:hover) {
        stroke: #333;
        stroke-width: 1.5px;
    }
</style>