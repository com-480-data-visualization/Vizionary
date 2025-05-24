<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";

    // Props using Svelte 5 syntax
    let { name }: { name: string } = $props();

    // State variables using Svelte 5 runes
    let width = $state(500);
    let height = $state(100);
    let showMaleData = $state(true);
    let showFemaleData = $state(true);
    let selectedYears = $state<number[]>([]);
    let element = $state<HTMLDivElement>();
    let data = $state([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);
    
    // Process the raw data into a format suitable for parallel coordinates
    function processData(rawData: any) {
        // Extract bar data for processing
        const barData = rawData.bar;
        
        // Transform the data structure into an array of objects
        const processed = [];
        
        // Process male data
        if (barData.M) {
            const maleAgeData = barData.M.age || {};
            const maleHeightData = barData.M.height || {};
            const maleWeightData = barData.M.weight || {};
            
            const years = maleAgeData.year || [];
            const medals = maleAgeData.medal || [];
            const ageValues = maleAgeData.value || [];
            const heightValues = maleHeightData.value || [];
            const weightValues = maleWeightData.value || [];
            
            for (let i = 0; i < years.length; i++) {
                processed.push({
                    year: years[i],
                    sex: "M",
                    medal: medals[i],
                    age: ageValues[i],
                    height: i < heightValues.length ? heightValues[i] : null,
                    weight: i < weightValues.length ? weightValues[i] : null
                });
            }
        }
        
        // Process female data
        if (barData.F) {
            const femaleAgeData = barData.F.age || {};
            const femaleHeightData = barData.F.height || {};
            const femaleWeightData = barData.F.weight || {};
            
            const years = femaleAgeData.year || [];
            const medals = femaleAgeData.medal || [];
            const ageValues = femaleAgeData.value || [];
            const heightValues = femaleHeightData.value || [];
            const weightValues = femaleWeightData.value || [];
            
            for (let i = 0; i < years.length; i++) {
                processed.push({
                    year: years[i],
                    sex: "F",
                    medal: medals[i],
                    age: ageValues[i],
                    height: i < heightValues.length ? heightValues[i] : null,
                    weight: i < weightValues.length ? weightValues[i] : null
                });
            }
        }
        
        return processed;
    }

    // Function to load data
    async function loadData(sportName: string) {
        if (!sportName) return;
        
        isLoading = true;
        error = null;
        
        try {
            const response = await fetch(`/statics/${sportName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            
            const rawData = await response.json();
            console.log('Loaded data:', rawData);
            
            // Process the data
            data = processData(rawData);
            console.log('Processed data:', data);
            
        } catch (err) {
            error = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error("Error loading data:", err);
        } finally {
            isLoading = false;
        }
    }

    // Create the parallel coordinates plot
    function createParallelCoordinatesPlot() {
        if (!element || data.length === 0) return;
        
        // Clear existing content
        element.innerHTML = "";
        
        // Set the dimensions and margins of the graph
        const margin = {top: 30, right: 50, bottom: 10, left: 50};
        const plotWidth = element.clientWidth || width;
        const plotHeight = (element.clientHeight || height) - margin.top - margin.bottom;
        
        // Filter data based on sex selection
        const filteredData = data.filter(d => {
            const includeMale = showMaleData && d.sex === "M";
            const includeFemale = showFemaleData && d.sex === "F";
            
            // Apply year filter if any years are selected
            const yearFilter = selectedYears.length === 0 || selectedYears.includes(d.year);
            
            return (includeMale || includeFemale) && yearFilter;
        });
        
        // Append the svg object to the container
        const svg = d3.select(element)
            .append("svg")
            .attr("width", plotWidth)
            .attr("height", plotHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Define dimensions for parallel coordinates - now including medal
        const dimensions = ["height", "weight", "age", "medal"];
        
        // Color scale for medals
        const color = d3.scaleOrdinal()
            .domain(["Gold", "Silver", "Bronze", "No Medal"])
            .range(["#FFD700", "#C0C0C0", "#CD7F32", "#AACCFF"]);
        
        // Define scales for parallel coordinates
        const y: any = {};
        
        // For each dimension, build a scale
        dimensions.forEach(dimensionName => {
            if (dimensionName === "medal") {
                // Ordinal scale for medals
                const medalTypes = ["No Medal","Bronze", "Silver", "Gold"];
                y[dimensionName] = d3.scalePoint()
                    .domain(medalTypes)
                    .range([plotHeight, 0]);
            } else {
                // Linear scales for numeric values
                const validValues = filteredData.filter(d => d[dimensionName] !== null).map(d => d[dimensionName]);
                const extent = validValues.length > 0 ? d3.extent(validValues) : [0, 1];
                const padding = (extent[1] - extent[0]) * 0.05;
                
                y[dimensionName] = d3.scaleLinear()
                    .domain([extent[0] - padding, extent[1] + padding])
                    .range([plotHeight, 0]);
            }
        });
        
        // Build the X scale
        const x = d3.scalePoint()
            .range([0, plotWidth - margin.left - margin.right])
            .domain(dimensions);
        
        // Function to draw a path for each data point
        function path(d: any) {
            return d3.line()(dimensions.map(function(p) { 
                if (p === "medal") {
                    // Handle medal specially since it's categorical
                    return [x(p), y[p](d[p])];
                } else {
                    // Handle null values - position them at the bottom
                    const value = d[p] !== null ? y[p](d[p]) : plotHeight;
                    return [x(p), value]; 
                }
            }));
        }
        
        // Highlight function for mouseover
        const highlight = function(event: any, d: any) {
            // First, make all lines lighter
            d3.selectAll(".line")
                .transition().duration(200)
                .style("stroke", "lightgrey")
                .style("opacity", "0.2")
                .style("stroke-width", "1px");
            
            // Highlight the current line
            d3.select(this)
                .transition().duration(200)
                .style("stroke", color(d.medal))
                .style("opacity", "1")
                .style("stroke-width", "2.5px");
                
            // Update tooltip
            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 30) + "px")
                .transition().duration(200)
                .style("opacity", 1)
                .html(`
                    <strong>${d.medal}</strong> - ${d.sex === 'M' ? 'Male' : 'Female'} - ${d.year}<br>
                    Age: ${d.age}<br>
                    Height: ${d.height}<br>
                    Weight: ${d.weight}
                `);
        };
        
        // Unhighlight function for mouseout
        const doNotHighlight = function() {
            d3.selectAll(".line")
                .transition().duration(200)
                .style("stroke", (d: any) => color(d.medal))
                .style("opacity", 0.7)
                .style("stroke-width", "1.5px");
                
            // Hide tooltip
            tooltip.transition().duration(200).style("opacity", 0);
        };
        
        // Create tooltip
        const tooltip = d3.select(element)
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "rgba(0, 0, 0, 0.7)")
            .style("color", "white")
            .style("padding", "5px 10px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("pointer-events", "none");
        
        // Draw the lines
        svg.selectAll("myPath")
            .data(filteredData)
            .join("path")
            .attr("class", "line")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", (d: any) => color(d.medal))
            .style("opacity", 0.7)
            .style("stroke-width", "1.5px")
            .on("mouseover", highlight)
            .on("mouseout", doNotHighlight);
        
        // Draw the axes
        svg.selectAll("myAxis")
            .data(dimensions).enter()
            .append("g")
            .attr("class", "axis")
            .attr("transform", d => `translate(${x(d)},0)`)
            .each(function(d) { 
                if (d === "medal") {
                    d3.select(this).call(d3.axisLeft().scale(y[d]));
                } else {
                    d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d])); 
                }
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(d => d.charAt(0).toUpperCase() + d.slice(1)) // Capitalize first letter
            .style("fill", "black")
            .style("font-weight", "bold");
    }

    // Effect to load data when name changes
    $effect(() => {
        if (name) {
            loadData(name);
        }
    });

    // Effect to recreate chart when data or filter options change
    $effect(() => {
        if (data.length > 0 && element) {
            createParallelCoordinatesPlot();
        }
    });

    // Effect to recreate chart when filter options change
    $effect(() => {
        // This effect depends on showMaleData, showFemaleData, and selectedYears
        // When any of these change, recreate the chart
        if (data.length > 0 && element) {
            createParallelCoordinatesPlot();
        }
    });

    // Handle resize
    onMount(() => {
        if (!element) return;
        
        const resizeObserver = new ResizeObserver(() => {
            if (data.length > 0) {
                createParallelCoordinatesPlot();
            }
        });
        
        resizeObserver.observe(element);
        
        return () => {
            resizeObserver.disconnect();
        };
    });
    
    // Update filters function - now updates state variables directly
    export function updateFilters(male: boolean, female: boolean, years: number[] = []) {
        showMaleData = male;
        showFemaleData = female;
        selectedYears = years;
        // Chart will automatically update due to $effect
    }
</script>

<div class="w-full h-full p-4 flex flex-col text-center">
    <h2 class="text-center text-gray-800 text-xl font-bold mb-2">
        Parallel Coordinates - {name}
    </h2>
    
    {#if isLoading}
        <div class="flex-1 bg-gray-100 p-3 rounded parallel-chart-container flex items-center justify-center">
            <div class="text-gray-600">Loading data for {name}...</div>
        </div>
    {:else if error}
        <div class="flex-1 bg-gray-100 p-3 rounded parallel-chart-container flex items-center justify-center">
            <div class="text-red-600">Error: {error}</div>
        </div>
    {:else}
        <div 
            class="flex-1 bg-gray-100 p-3 rounded parallel-chart-container" 
            bind:this={element}
        >
            <!-- D3 will insert the SVG here -->
        </div>
    {/if}
</div>

<style>
    .parallel-chart-container {
        width: 100%;
        height: 100%;
        background-color: #f8f9fa;
        border-radius: 0.75rem;
        overflow: hidden;
        position: relative;
    }
    
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