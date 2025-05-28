<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";

    // Props using Svelte 5 syntax
    let { name, params } = $props();

    // State variables using Svelte 5 runes
    let width = $state(500);
    let height = $state(100);
    let element = $state<HTMLDivElement>();
    let data = $state([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);
    
    // Process the raw data into a format suitable for parallel coordinates
    function processData(rawData: any) {
        // Extract bar data for processing
        const barData = rawData.bar;
        
        if (!barData || !Array.isArray(barData)) {
            return [];
        }

        // Group data by year, sex, and medal to reconstruct athlete records
        const groupedData: { [key: string]: any } = {};

        barData.forEach((item: any) => {
            const key = `${item.year}-${item.sex}-${item.medal}`;
            
            if (!groupedData[key]) {
                groupedData[key] = {
                    year: item.year,
                    sex: item.sex,
                    medal: item.medal,
                    age: null,
                    height: null,
                    weight: null
                };
            }
            
            // Assign the value to the appropriate attribute
            if (item.attribute === 'age') {
                groupedData[key].age = item.value;
            } else if (item.attribute === 'height') {
                groupedData[key].height = item.value;
            } else if (item.attribute === 'weight') {
                groupedData[key].weight = item.value;
            }
        });

        // Convert grouped data back to array format
        return Object.values(groupedData);
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
        const margin = {top: 30, right: 25, bottom: 10, left: 25};
        const plotWidth = (element.clientWidth || width);
        const plotHeight = (element.clientHeight || height) - margin.top - margin.bottom - 30;
    


        // Filter data based on params
        const filteredData = data.filter(d => {
            // Apply gender filter
            let genderMatch = true;
            if (params.gender === "male") {
                genderMatch = d.sex === "M";
            } else if (params.gender === "female") {
                genderMatch = d.sex === "F";
            }
            // If gender is "all", genderMatch stays true
            
            // Apply year range filter
            const yearMatch = d.year >= params.startYear && d.year <= params.endYear;
            
            // Apply medal filter
            let medalMatch = false;
            if (d.medal === "Gold" && params.medals.gold) medalMatch = true;
            if (d.medal === "Silver" && params.medals.silver) medalMatch = true;
            if (d.medal === "Bronze" && params.medals.bronze) medalMatch = true;
            if (d.medal === "No Medal" && params.medals.noMedal) medalMatch = true;
            
            return genderMatch && yearMatch && medalMatch;
        });

        // Create array of visible medal types for color scale
        const visibleMedals = [];
        if (params.medals.gold) visibleMedals.push("Gold");
        if (params.medals.silver) visibleMedals.push("Silver");
        if (params.medals.bronze) visibleMedals.push("Bronze");
        if (params.medals.noMedal) visibleMedals.push("No Medal");
        
        // Append the svg object to the container
        const svg = d3.select(element)
            .append("svg")
            .attr("width", plotWidth)
            .attr("height", plotHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Define dimensions for parallel coordinates - now including medal
        const dimensions = ["height", "weight", "age", "medal"];
        
        // Color scale for medals - use only the medals that are actually visible
        const color = d3.scaleOrdinal()
            .domain(visibleMedals)
            .range(visibleMedals.map(medal => 
                medal === "Gold" ? "#FFD700" :
                medal === "Silver" ? "#C0C0C0" :
                medal === "Bronze" ? "#CD7F32" :
                "#AACCFF"
            ));
        
        // Define scales for parallel coordinates
        const y: any = {};
        
        // For each dimension, build a scale
        dimensions.forEach(dimensionName => {
            if (dimensionName === "medal") {
                // Ordinal scale for medals - use only visible medals
                const medalOrder = ["No Medal", "Bronze", "Silver", "Gold"];
                const visibleMedalTypes = medalOrder.filter(m => visibleMedals.includes(m));
                
                y[dimensionName] = d3.scalePoint()
                    .domain(visibleMedalTypes)
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
            
            // Highlight all lines with the same medal as the hovered line
            d3.selectAll(".line")
                .filter((lineData: any) => lineData.medal === d.medal)
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

    // Effect to recreate chart when data or filter props change
    $effect(() => {
        if (data.length > 0 && element && height && width) {
            createParallelCoordinatesPlot();
        }
    });

    // Update filters function - for backward compatibility if needed
    export function updateFilters(male: boolean, female: boolean, selectedYears: number[] = []) {
        // This function is kept for backward compatibility
        // The component now uses props directly, so external updates should be done via props
        console.warn('updateFilters is deprecated. Use props instead: gender, years, medals');
    }
</script>

<div class="w-full h-full p-2 flex flex-col " bind:clientHeight={height} bind:clientWidth={width}>
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