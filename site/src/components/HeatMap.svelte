<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";
  
    // Define the types for the heatmap data - now using flat array format
    type HeatmapDataPoint = {
      year: number;
      sex: string;
      attribute: string;
      corr: number | null;
    };
  
    // Props using Svelte 5 syntax - removed attribute prop since we show all attributes
    let { 
        name, 
        params
    } = $props();
  
    // State variables using Svelte 5 runes
    let containerElement = $state<HTMLDivElement>();
    let width = $state(600);
    let height = $state(300);
    let rawHeatmapData = $state<HeatmapDataPoint[]>([]);
    let filteredHeatmapData = $state<HeatmapDataPoint[]>([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Function to load data
    async function loadData(sportName: string) {
        if (!sportName) return;
        
        isLoading = true;
        error = null;
        rawHeatmapData = [];
        filteredHeatmapData = [];
        
        try {
            const response = await fetch(`/statics/${sportName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const rawData = await response.json();
            console.log("Loaded raw data:", rawData);

            // Extract the heatmap data directly from the flat array
            if (rawData && rawData.heatmap && Array.isArray(rawData.heatmap)) {
                rawHeatmapData = rawData.heatmap;
                console.log("Processed heatmap data:", rawHeatmapData);
            } else {
                throw new Error("Heatmap data not found in the JSON file or not in expected format.");
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error("Error loading heatmap data:", err);
        } finally {
            isLoading = false;
        }
    }

    // Function to filter data based on gender and year range
    function filterHeatmapData(data: HeatmapDataPoint[], genderParam: "all" | "male" | "female", startYear: number, endYear: number): HeatmapDataPoint[] {
        console.log('Filtering with:', { genderParam, startYear, endYear, dataLength: data.length });
        
        const filtered = data.filter(item => {
            // Filter by gender
            let genderMatch = true;
            if (genderParam === "male") {
                genderMatch = item.sex === "M";
            } else if (genderParam === "female") {
                genderMatch = item.sex === "F";
            }
            // If genderParam is "all", genderMatch stays true
            
            // Filter by year range
            const yearMatch = item.year >= startYear && item.year <= endYear;
            
            const matches = genderMatch && yearMatch;
            
            return matches;
        });
        
        console.log('Filter result:', { inputLength: data.length, outputLength: filtered.length });
        return filtered;
    }

    /**
     * @param container  The div to draw into
     * @param data    Array of HeatmapDataPoint for the filtered selection
     * @param chartWidth   Current width of the container
     * @param chartHeight  Current height of the container
     */
    function drawHeatmap(
        container: HTMLElement,
        data: HeatmapDataPoint[],
        chartWidth: number,
        chartHeight: number
    ) {
        // Clear existing SVG to redraw
        container.innerHTML = "";

        // Filter out null correlations
        const validData = data.filter(d => d.corr !== null);

        if (validData.length === 0) {
            // Show message if no data
            const messageDiv = d3.select(container)
                .append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("justify-content", "center")
                .style("height", "100%")
                .style("color", "#666");
            
            messageDiv.append("p").text("No correlation data available for this selection");
            return;
        }

        // Get unique years and attributes for the scales
        const uniqueYears = [...new Set(validData.map(d => d.year))].sort((a, b) => a - b);
        const uniqueAttributes = [...new Set(validData.map(d => d.attribute))].sort();

        // Set up dimensions and margins
        const margin = { top: 30, right: 20, bottom: 60, left: 80 };
        const w = chartWidth - margin.left - margin.right;
        const h = chartHeight - margin.top - margin.bottom;

        const svg = d3
            .select(container)
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Set up scales
        const xScale = d3
            .scaleBand()
            .domain(uniqueYears.map(d => d.toString()))
            .range([0, w])
            .padding(0.05);

        const yScale = d3
            .scaleBand()
            .domain(uniqueAttributes)
            .range([0, h])
            .padding(0.05);

        // Color scale for correlations
        const colorScale = d3
            .scaleSequential(d3.interpolateRdBu)
            .domain([1, -1]); // Reverse domain so positive correlations are red, negative are blue

        // Create axes
        svg
            .append("g")
            .attr("transform", `translate(0,${h})`)
            .call(
                d3.axisBottom(xScale)
                    .tickFormat(d => d)
            )
            .selectAll("text")
            .attr("transform", "rotate(45)")
            .attr("dx", "0.6em")
            .attr("dy", "0.6em")
            .style("text-anchor", "start");

        svg
            .append("g")
            .call(d3.axisLeft(yScale)
                .tickFormat(d => d.charAt(0).toUpperCase() + d.slice(1)) // Capitalize first letter
            );

        // Create tooltip
        const tooltip = d3
            .select(container)
            .append("div")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("background-color", "rgba(0, 0, 0, 0.7)")
            .style("color", "white")
            .style("padding", "5px 10px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("opacity", 0);

        // Draw heatmap rectangles
        svg
            .selectAll("rect")
            .data(validData)
            .join("rect")
            .attr("x", d => xScale(d.year.toString())!)
            .attr("y", d => yScale(d.attribute)!)
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.corr!))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 1)
                    .html(`
                        <strong>Year:</strong> ${d.year}<br/>
                        <strong>Attribute:</strong> ${d.attribute}<br/>
                        <strong>Sex:</strong> ${d.sex === 'M' ? 'Male' : 'Female'}<br/>
                        <strong>Correlation:</strong> ${d.corr!.toFixed(3)}
                    `)
                    .style("left", `${event.pageX + 8}px`)
                    .style("top", `${event.pageY + 8}px`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        // Add color legend
        const legendWidth = 200;
        const legendHeight = 20;
        
        const legend = svg
            .append("g")
            .attr("transform", `translate(${w - legendWidth}, ${h + 40})`);

        // Create gradient for legend
        const defs = svg.append("defs");
        const gradient = defs
            .append("linearGradient")
            .attr("id", "correlation-gradient");

        gradient
            .selectAll("stop")
            .data(d3.range(0, 1.01, 0.1))
            .join("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => colorScale(1 - 2 * d)); // Map 0-1 to 1 to -1

        legend
            .append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#correlation-gradient)");

        // Add legend labels
        legend
            .append("text")
            .attr("x", 0)
            .attr("y", legendHeight + 15)
            .style("text-anchor", "start")
            .style("font-size", "12px")
            .text("1.0");

        legend
            .append("text")
            .attr("x", legendWidth / 2)
            .attr("y", legendHeight + 15)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text("0.0");

        legend
            .append("text")
            .attr("x", legendWidth)
            .attr("y", legendHeight + 15)
            .style("text-anchor", "end")
            .style("font-size", "12px")
            .text("-1.0");

        legend
            .append("text")
            .attr("x", legendWidth / 2)
            .attr("y", -5)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text("Correlation with Medal Success");
    }

    // Effect to load data when name changes
    $effect(() => {
        if (name) {
            loadData(name);
        }
    });

    // Effect to filter data when rawHeatmapData, params.gender, or year range changes
    $effect(() => {
        // Only watch the specific properties we care about to avoid infinite loops
        const gender = params?.gender;
        const startYear = params?.startYear;
        const endYear = params?.endYear;
        const hasRawData = rawHeatmapData.length > 0;
        
        console.log('Effect triggered with:', {
            rawDataLength: rawHeatmapData.length,
            gender,
            startYear,
            endYear
        });
        
        if (hasRawData && gender && startYear && endYear) {
            const newFilteredData = filterHeatmapData(rawHeatmapData, gender, startYear, endYear);
            // Only update if the data actually changed
            if (JSON.stringify(newFilteredData) !== JSON.stringify(filteredHeatmapData)) {
                filteredHeatmapData = newFilteredData;
                console.log('Filtered heatmap data updated:', filteredHeatmapData);
            }
        } else {
            if (filteredHeatmapData.length > 0) {
                filteredHeatmapData = [];
                console.log('Cleared filtered data');
            }
        }
    });

    // Effect to draw chart when filtered data or dimensions change
    $effect(() => {
        if (containerElement && filteredHeatmapData.length > 0 && width > 0 && height > 0) {
            drawHeatmap(containerElement, filteredHeatmapData, width, height);
        }
    });

    // Handle resize and initial dimensions setup
    onMount(() => {
        if (!containerElement) return;
        
        // Initialize width and height based on container size once component is mounted
        width = containerElement.clientWidth;
        height = containerElement.clientHeight;

        // Handle resizing
        const resizeObserver = new ResizeObserver(() => {
            if (containerElement) {
                width = containerElement.clientWidth;
                height = containerElement.clientHeight;
                // The effect above will automatically redraw the chart
            }
        });

        // resizeObserver.observe(containerElement);

        // Cleanup the observer when the component is destroyed
        return () => {
            resizeObserver.disconnect();
        };
    });
</script>

<div class="max-height-500px w-full h-full p-4 flex flex-col text-center">
    <h2 class="text-center text-gray-800 text-xl font-bold mb-2">
        Correlation Heatmap - {name} ({params.gender === "male" ? "Male" : params.gender === "female" ? "Female" : "All"})
        - ({params.startYear}-{params.endYear})
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
        {:else if !filteredHeatmapData || filteredHeatmapData.length === 0}
            <div class="loading-container">
                <p class="text-gray-600">No heatmap data available for {params.gender === "male" ? "Male" : params.gender === "female" ? "Female" : "All"} ({params.startYear}-{params.endYear})</p>
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

    /* Style the axes to match your other charts */
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