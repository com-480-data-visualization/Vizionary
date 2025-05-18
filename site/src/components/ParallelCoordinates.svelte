<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";

    export let width: number = 800;
    export let height: number = 500;
    export let showMaleData: boolean = true;
    export let showFemaleData: boolean = true;
    export let selectedYears: number[] = []; // Can filter by year if needed

    let element: HTMLDivElement;
    let data = [];
    
    // Process the raw data into a format suitable for parallel coordinates
    function processData(rawData) {
        // Extract bar data for processing
        const barData = rawData.bar;
        
        // Group data by year, sex, and medal
        const grouped = d3.group(barData, 
            d => `${d.year}-${d.sex}-${d.medal}`
        );
        
        // Transform grouped data into records with all attributes
        const processed = [];
        
        for (const [key, values] of grouped.entries()) {
            const [year, sex, medal] = key.split('-');
            if (!medal) continue; // Skip if medal is undefined
            
            const record = {
                year: +year,
                sex: sex,
                medal: medal,
                age: null,
                height: null,
                weight: null
            };
            
            // Fill in attribute values
            values.forEach(item => {
                if (item.attribute === 'age') record.age = item.value;
                if (item.attribute === 'height') record.height = item.value;
                if (item.attribute === 'weight') record.weight = item.value;
            });
            
            // Only add records that have at least one non-null value
            if (record.age !== null || record.height !== null || record.weight !== null) {
                processed.push(record);
            }
        }
        
        return processed;
    }

    onMount(async function () {
        try {
            // For demonstration, we'll create sample data based on your JSON structure
            // In a real application, you would fetch this from an API or file
            const sampleData = {
                "sport": "Athletics",
                "bar": [
                    // Example data entries (simplified version of your data)
                    {"year": 2016, "sex": "M", "medal": "Gold", "attribute": "age", "value": 26.0},
                    {"year": 2016, "sex": "M", "medal": "Gold", "attribute": "height", "value": 183.0},
                    {"year": 2016, "sex": "M", "medal": "Gold", "attribute": "weight", "value": 76.0},
                    {"year": 2016, "sex": "M", "medal": "Silver", "attribute": "age", "value": 28.0},
                    {"year": 2016, "sex": "M", "medal": "Silver", "attribute": "height", "value": 180.0},
                    {"year": 2016, "sex": "M", "medal": "Silver", "attribute": "weight", "value": 74.0},
                    {"year": 2016, "sex": "M", "medal": "Bronze", "attribute": "age", "value": 24.0},
                    {"year": 2016, "sex": "M", "medal": "Bronze", "attribute": "height", "value": 187.0},
                    {"year": 2016, "sex": "M", "medal": "Bronze", "attribute": "weight", "value": 82.0},
                    {"year": 2016, "sex": "M", "medal": "No Medal", "attribute": "age", "value": 23.0},
                    {"year": 2016, "sex": "M", "medal": "No Medal", "attribute": "height", "value": 178.0},
                    {"year": 2016, "sex": "M", "medal": "No Medal", "attribute": "weight", "value": 72.0},
                    {"year": 2016, "sex": "F", "medal": "Gold", "attribute": "age", "value": 25.0},
                    {"year": 2016, "sex": "F", "medal": "Gold", "attribute": "height", "value": 170.0},
                    {"year": 2016, "sex": "F", "medal": "Gold", "attribute": "weight", "value": 60.0},
                    {"year": 2016, "sex": "F", "medal": "Silver", "attribute": "age", "value": 27.0},
                    {"year": 2016, "sex": "F", "medal": "Silver", "attribute": "height", "value": 168.0},
                    {"year": 2016, "sex": "F", "medal": "Silver", "attribute": "weight", "value": 58.0},
                    {"year": 2016, "sex": "F", "medal": "Bronze", "attribute": "age", "value": 26.0},
                    {"year": 2016, "sex": "F", "medal": "Bronze", "attribute": "height", "value": 172.0},
                    {"year": 2016, "sex": "F", "medal": "Bronze", "attribute": "weight", "value": 62.0},
                    {"year": 2012, "sex": "M", "medal": "Gold", "attribute": "age", "value": 25.0},
                    {"year": 2012, "sex": "M", "medal": "Gold", "attribute": "height", "value": 182.0},
                    {"year": 2012, "sex": "M", "medal": "Gold", "attribute": "weight", "value": 75.0}
                ]
            };
            
            // Process the data
            data = processData(sampleData);
            
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
        
        // Define dimensions for parallel coordinates
        const dimensions = ["age", "height", "weight"];
        
        // Color scale for medals
        const color = d3.scaleOrdinal()
            .domain(["Gold", "Silver", "Bronze", "No Medal"])
            .range(["#FFD700", "#C0C0C0", "#CD7F32", "#CCCCCC"]);
        
        // For each dimension, build a linear scale
        const y = {};
        for (const name of dimensions) {
            // Get extent of non-null values
            const validValues = filteredData.filter(d => d[name] !== null).map(d => d[name]);
            const extent = validValues.length > 0 ? d3.extent(validValues) : [0, 1];
            
            // Add some padding to the domain
            const padding = (extent[1] - extent[0]) * 0.05;
            
            y[name] = d3.scaleLinear()
                .domain([extent[0] - padding, extent[1] + padding])
                .range([plotHeight, 0]);
        }
        
        // Build the X scale
        const x = d3.scalePoint()
            .range([0, plotWidth - margin.left - margin.right])
            .domain(dimensions);
        
        // Function to draw a path for each data point
        function path(d) {
            return d3.line()(dimensions.map(function(p) { 
                // Handle null values - position them at the bottom
                const value = d[p] !== null ? y[p](d[p]) : plotHeight;
                return [x(p), value]; 
            }));
        }
        
        // Highlight function for mouseover
        const highlight = function(event, d) {
            const selectedMedal = d.medal;
            const selectedSex = d.sex;
            
            // First, make all lines lighter
            d3.selectAll(".line")
                .transition().duration(200)
                .style("stroke", "lightgrey")
                .style("opacity", "0.2")
                .style("stroke-width", "1px");
            
            // Highlight the selected medal type and sex
            d3.selectAll(`.line.${selectedMedal.replace(/\s+/g, '')}.${selectedSex}`)
                .transition().duration(200)
                .style("stroke", color(selectedMedal))
                .style("opacity", "1")
                .style("stroke-width", "2.5px");
                
            // Update tooltip
            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 30) + "px")
                .transition().duration(200)
                .style("opacity", 1)
                .text(`${selectedMedal} - ${selectedSex === 'M' ? 'Male' : 'Female'} - Year: ${d.year}`);
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
            .attr("class", d => `line ${d.medal.replace(/\s+/g, '')} ${d.sex}`)
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
                d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d])); 
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(d => d.charAt(0).toUpperCase() + d.slice(1)) // Capitalize first letter
            .style("fill", "black")
            .style("font-weight", "bold");
            
        // Add legend
        const legendData = ["Gold", "Silver", "Bronze", "No Medal"];
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${(plotWidth - margin.left - margin.right) - 120}, 10)`);
            
        legend.selectAll("rect")
            .data(legendData)
            .join("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", d => color(d));
            
        legend.selectAll("text")
            .data(legendData)
            .join("text")
            .attr("x", 15)
            .attr("y", (d, i) => i * 20 + 9)
            .text(d => d)
            .style("font-size", "12px")
            .style("alignment-baseline", "middle");
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
    <h2 class="text-center text-gray-800 text-xl font-bold mb-2">Parallel Coordinates</h2>
    <div class="flex-1 bg-gray-100 p-3 rounded parallel-chart-container" bind:this={element}>
        <!-- D3 will insert the SVG here -->
    </div>
  </div>

<style>
    .parallel-chart-container {
        width: 100%;
        height: 100%;
        min-height: 500px; 
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