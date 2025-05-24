<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";

    export let name: string; // Parameter to load the correct JSON file

    let width: number = 500;
    let height: number = 100;
    let showMaleData: boolean = true;
    let showFemaleData: boolean = true;
    let selectedYears: number[] = []; // Can filter by year if needed

    let element: HTMLDivElement;
    let data = [];
    
    // Process the raw data into a format suitable for parallel coordinates
    function processData(rawData) {
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

    onMount(async function () {
        try {
            // Load the data dynamically based on the name parameter
            const response = await fetch(`/statics/${name}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            
            const rawData = await response.json();
            console.log('Loaded data:', rawData);
            
            // Process the data
            data = processData(rawData);
            console.log('Processed data:', data);
            
            // Create the chart
            createParallelCoordinatesPlot();
            
            // Handle resizing
            const resizeObserver = new ResizeObserver(() => {
                element.innerHTML = "";
                createParallelCoordinatesPlot();
            });
            
            resizeObserver.observe(element);
            
            return () => {
                resizeObserver.disconnect();
            };
        } catch (error) {
            console.error("Error creating parallel coordinates plot:", error);
        }
    });

    function createParallelCoordinatesPlot() {
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
        const y = {};
        
        // For each dimension, build a scale
        dimensions.forEach(name => {
            if (name === "medal") {
                // Ordinal scale for medals
                const medalTypes = ["No Medal","Bronze", "Silver", "Gold"];
                y[name] = d3.scalePoint()
                    .domain(medalTypes)
                    .range([plotHeight, 0]);
            } else {
                // Linear scales for numeric values
                const validValues = filteredData.filter(d => d[name] !== null).map(d => d[name]);
                const extent = validValues.length > 0 ? d3.extent(validValues) : [0, 1];
                const padding = (extent[1] - extent[0]) * 0.05;
                
                y[name] = d3.scaleLinear()
                    .domain([extent[0] - padding, extent[1] + padding])
                    .range([plotHeight, 0]);
            }
        });
        
        // Build the X scale
        const x = d3.scalePoint()
            .range([0, plotWidth - margin.left - margin.right])
            .domain(dimensions);
        
        // Function to draw a path for each data point
        function path(d) {
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
        const highlight = function(event, d) {
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
                .style("stroke", d => color(d.medal))
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
            .style("stroke", d => color(d.medal))
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
    
    // Update filters
    export function updateFilters(male: boolean, female: boolean, years: number[] = []) {
        showMaleData = male;
        showFemaleData = female;
        selectedYears = years;
        element.innerHTML = "";
        createParallelCoordinatesPlot();
    }
</script>

<div class="w-full h-full p-4 flex flex-col text-center">
    <h2 class="text-center text-gray-800 text-xl font-bold mb-2">Parallel Coordinates - {name}</h2>
    <div class="flex-1 bg-gray-100 p-3 rounded parallel-chart-container" bind:this={element}>
        <!-- D3 will insert the SVG here -->
    </div>
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