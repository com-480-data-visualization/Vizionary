<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";
  
    // Define the types for the heatmap data
    type HeatAttr = { year: number[]; corr: number[] };
    type HeatCompact = {
      age: HeatAttr;
      height: HeatAttr;
      weight: HeatAttr;
    };
  
    // Props using Svelte 5 syntax
    let { name }: { name: string } = $props();
  
    // State variables using Svelte 5 runes
    let containerElement = $state<HTMLDivElement>();
    let width = $state(200); // Initial width, will be updated by ResizeObserver
    let height = $state(0); // Height is calculated based on cell size and number of attributes
    let heatmapData = $state<HeatCompact | null>(null);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Function to load data
    async function loadData(sportName: string) {
        if (!sportName) return;
        
        isLoading = true;
        error = null;
        heatmapData = null;
        
        try {
            const response = await fetch(`/statics/${sportName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const rawData = await response.json();
            console.log("Loaded raw data:", rawData);

            // Extract the heatmap data from the raw JSON
            if (rawData && rawData.heatmap) {
                heatmapData = rawData.heatmap.M;
                console.log("Processed heatmap data:", heatmapData);
            } else {
                throw new Error("Heatmap data not found in the JSON file.");
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error("Error loading heatmap data:", err);
        } finally {
            isLoading = false;
        }
    }

    /**
     * @param container  The div to draw into
     * @param data The compact HeatCompact data
     * @param chartWidth   Current width of the container
     */
    function drawHeatmap(
        container: HTMLElement,
        data: HeatCompact,
        chartWidth: number
    ) {
        // Clear existing SVG to redraw
        container.innerHTML = "";

        const attrs = ["age", "height", "weight"];
        // Assume all three attributes have the same years. Use optional chaining for safety.
        const years = data.age?.year || [];

        if (years.length === 0) {
            console.warn("No years found in heatmap data, cannot draw chart.");
            return;
        }

        // Calculate cell size and total height based on current width
        const cellSize = (chartWidth) / years.length;
        height = cellSize * attrs.length; // Update the height state

        const svg = d3
            .select(container)
            .append("svg")
            .attr("width", chartWidth + 100) // Added space for labels and margin
            .attr("height", height + 120) // Added space for labels and margin
            .append("g")
            .attr("transform", "translate(40,0)"); // Shift content to make room for axes

        // scales
        const x = d3
            .scaleBand<number>()
            .domain(years)
            .range([0, chartWidth-100])
            .padding(0.05);

        const y = d3
            .scaleBand<string>()
            .domain(attrs)
            .range([0, height])
            .padding(0.05);

        // Diverging color scale from blue to red
        const color = d3.scaleDiverging([-1, 0, 1], d3.interpolateRdBu);

        // axes
        svg
            .append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")))
            .selectAll("text")
            .attr("transform", "rotate(45)")
            .attr("dx", "0.5em")
            .attr("dy", "0.5em")
            .style("text-anchor", "start");

        svg.append("g").call(d3.axisLeft(y));

        // tooltip
        const tooltip = d3
            .select(container)
            .append("div")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("background-color", "rgba(0, 0, 0, 0.7)")
            .style("color", "white")
            .style("padding", "5px 5px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("opacity", 0);

        // draw cells
        attrs.forEach((attr) => {
            // Ensure the attribute data exists before trying to access it
            const attrData = data[attr as keyof HeatCompact];
            if (attrData) {
                const { year, corr } = attrData;
                const cellData = year.map((yr, i) => ({
                    year: yr,
                    corr: corr[i],
                    attribute: attr,
                }));
                svg
                    .selectAll(`.cell-${attr}`)
                    .data(cellData)
                    .join("rect")
                    .attr("x", (d) => x(d.year)!)
                    .attr("y", () => y(attr)!)
                    .attr("width", x.bandwidth())
                    .attr("height", y.bandwidth())
                    .attr("fill", (d) => color(d.corr))
                    .style("stroke", "#fff")
                    .on("mouseover", (event, d) => {
                        tooltip
                            .style("opacity", 1)
                            .html(
                                `
                                Year: <b>${d.year}</b><br/>
                                Attr: <b>${d.attribute}</b><br/>
                                r = <b>${d.corr.toFixed(2)}</b>
                                `
                            )
                            .style("left", `${event.pageX + 8}px`)
                            .style("top", `${event.pageY + 8}px`);
                    })
                    .on("mouseout", () => tooltip.style("opacity", 0));
            }
        });
    }

    // Effect to load data when name changes
    $effect(() => {
        if (name) {
            loadData(name);
        }
    });

    // Effect to draw heatmap when data or width changes
    $effect(() => {
        if (containerElement && heatmapData && width > 0) {
            drawHeatmap(containerElement, heatmapData, width);
        }
    });

    // Handle resize and initial width setup
    onMount(() => {
        if (!containerElement) return;
        
        // Initialize width based on container size once component is mounted
        width = containerElement.clientWidth;

        // Handle resizing
        const resizeObserver = new ResizeObserver(() => {
            if (containerElement) {
                width = containerElement.clientWidth;
                // The effect above will automatically redraw the chart
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
        Heatmap - {name}
    </h2>
    
    <div 
        class="flex-1 bg-gray-100 p-3 rounded heatmap-container" 
        bind:this={containerElement}
    >
        {#if isLoading}
            <div class="loading-container">
                <p class="text-gray-600">Loading heatmap data for {name}...</p>
            </div>
        {:else if error}
            <div class="error-container">
                <p class="text-red-600">Error loading heatmap data: {error}</p>
            </div>
        {:else if !heatmapData}
            <div class="loading-container">
                <p class="text-gray-600">No heatmap data available</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .heatmap-container {
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

    /* Style the axes to match your previous components */
    :global(.axis text) {
        font-size: 10px;
    }

    :global(.axis path, .axis line) {
        fill: none;
        stroke: #ccc;
        shape-rendering: crispEdges;
    }

    :global(.tooltip) {
        z-index: 10;
    }
</style>