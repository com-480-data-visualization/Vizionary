<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";
  
    // Define the types for the bar chart data
    type BarAttr = {
      year: number[];
      medal: string[];
      value: (number | null)[];
    };

    type BarData = {
      M?: {
        age?: BarAttr;
        height?: BarAttr;
        weight?: BarAttr;
      };
      F?: {
        age?: BarAttr;
        height?: BarAttr;
        weight?: BarAttr;
      };
    };
  
    // Props using Svelte 5 syntax
    let { 
        name, 
        attribute, params
    } = $props();
  
    // State variables using Svelte 5 runes
    let containerElement = $state<HTMLDivElement>();
    let width = $state(600);
    let height = $state(300);
    let rawBarData = $state<BarData | null>(null);
    let barData = $state<BarAttr | null>(null);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Function to process the new flat array format into the expected nested structure
    function processBarData(flatBarData: any[]): BarData {
        const processedData: BarData = {};

        // Group by sex
        const groupedBySex = d3.group(flatBarData, d => d.sex);

        groupedBySex.forEach((sexData, sex) => {
            const sexKey = sex as 'M' | 'F';
            processedData[sexKey] = {};

            // Group by attribute within each sex
            const groupedByAttr = d3.group(sexData, d => d.attribute);

            groupedByAttr.forEach((attrData, attr) => {
                const attrKey = attr as 'age' | 'height' | 'weight';
                
                // Extract arrays for year, medal, and value
                const years: number[] = [];
                const medals: string[] = [];
                const values: (number | null)[] = [];

                attrData.forEach(item => {
                    years.push(item.year);
                    medals.push(item.medal);
                    values.push(item.value);
                });

                processedData[sexKey]![attrKey] = {
                    year: years,
                    medal: medals,
                    value: values
                };
            });
        });

        return processedData;
    }

    // Function to load data
    async function loadData(sportName: string) {
        if (!sportName) return;
        
        isLoading = true;
        error = null;
        rawBarData = null;
        barData = null;
        
        try {
            const response = await fetch(`/statics/${sportName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const rawData = await response.json();
            console.log("Loaded raw data:", rawData);

            // Extract and process the bar data from the raw JSON
            if (rawData && rawData.bar && Array.isArray(rawData.bar)) {
                rawBarData = processBarData(rawData.bar);
                console.log("Processed bar data:", rawBarData);
            } else {
                throw new Error("Bar data not found in the JSON file or not in expected format.");
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error("Error loading bar data:", err);
        } finally {
            isLoading = false;
        }
    }

    // Function to extract specific attribute data based on gender from params and attribute
    function extractBarData(data: BarData, genderParam: "all" | "male" | "female", selectedAttribute: 'age' | 'height' | 'weight'): BarAttr | null {
        // Determine which sex data to use based on params.gender
        let sexData;
        if (genderParam === "male") {
            sexData = data.M;
        } else if (genderParam === "female") {
            sexData = data.F;
        } else {
            // For "all", we'll default to male data for now (could be enhanced to combine both)
            sexData = data.M;
        }
        
        if (!sexData) return null;
        
        const attrData = sexData[selectedAttribute];
        if (!attrData) return null;
        
        return attrData;
    }

    /**
     * @param container  The div to draw into
     * @param data    The compact BarAttr for one sex & one attribute
     * @param medalFilters Object with boolean flags for each medal type
     * @param chartWidth   Current width of the container
     * @param chartHeight  Current height of the container
     */
    function drawGroupedBars(
        container: HTMLElement,
        data: BarAttr,
        medalFilters: { gold: boolean; silver: boolean; bronze: boolean; noMedal: boolean },
        chartWidth: number,
        chartHeight: number
    ) {
        // Clear existing SVG to redraw
        container.innerHTML = "";

        // Create array of visible medal types based on params
        const visibleMedals = [];
        if (medalFilters.gold) visibleMedals.push("Gold");
        if (medalFilters.silver) visibleMedals.push("Silver");
        if (medalFilters.bronze) visibleMedals.push("Bronze");
        if (medalFilters.noMedal) visibleMedals.push("No Medal");

        // unpack
        const { year: years, medal: medalsArr, value: vals } = data;

        // flatten & filter by chosen medals (ignore year filtering - show all years)
        const flat = years
            .map((yr, i) => ({
                year: yr,
                medal: medalsArr[i],
                value: vals[i] ?? 0,
            }))
            .filter((d) => visibleMedals.includes(d.medal));

        // group by year
        const chartData = Array.from(
            d3.group(flat, (d) => d.year),
            ([year, records]) => ({
                year,
                values: records
                    // ensure every chosen medal appears (with zero if missing)
                    .concat(
                        visibleMedals
                            .filter((m) => !records.find((r) => r.medal === m))
                            .map((m) => ({ year, medal: m, value: 0 }))
                    )
                    .sort(
                        (a, b) =>
                            visibleMedals.indexOf(a.medal) - visibleMedals.indexOf(b.medal)
                    ),
            })
        ).sort((a, b) => a.year - b.year);

        // margins
        const margin = { top: 30, right: 20, bottom: 60, left: 60 };
        const w = chartWidth - margin.left - margin.right;
        const h = chartHeight - margin.top - margin.bottom;

        const svg = d3
            .select(container)
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // x0: years
        const x0 = d3
            .scaleBand<number>()
            .domain(chartData.map((d) => d.year))
            .range([0, w])
            .padding(0.2);

        // x1: medal within year
        const x1 = d3
            .scaleBand<string>()
            .domain(visibleMedals)
            .range([0, x0.bandwidth()])
            .padding(0.05);

        // y
        const maxVal = d3.max(chartData.flatMap((d) => d.values.map((v) => v.value))) || 0;
        const y = d3.scaleLinear().domain([0, maxVal]).nice().range([h, 0]);

        // axes
        svg
            .append("g")
            .attr("transform", `translate(0,${h})`)
            .call(
                d3
                    .axisBottom(x0)
                    .tickValues(chartData.map((d) => d.year))
                    .tickFormat(d3.format("d"))
            )
            .selectAll("text")
            .attr("transform", "rotate(45)")
            .attr("dx", "0.6em")
            .attr("dy", "0.6em")
            .style("text-anchor", "start");

        svg.append("g").call(d3.axisLeft(y));

        // color
        const color = (m: string) =>
            m === "Gold" ? "#FFD700" : // Gold
            m === "Silver" ? "#C0C0C0" : // Silver
            m === "Bronze" ? "#CD7F32" : // Bronze
            "lightblue";

        // tooltip
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

        // draw
        const yearG = svg
            .selectAll("g.year")
            .data(chartData)
            .join("g")
            .attr("class", "year")
            .attr("transform", (d) => `translate(${x0(d.year)},0)`);

        yearG
            .selectAll("rect")
            .data((d) => d.values.map((v) => ({ ...v })))
            .join("rect")
            .attr("x", (v) => x1(v.medal)!)
            .attr("y", (v) => y(v.value))
            .attr("width", x1.bandwidth())
            .attr("height", (v) => h - y(v.value))
            .attr("fill", (v) => color(v.medal))
            .on("mouseover", (event, v) => {
                tooltip
                    .style("opacity", 1)
                    .html(`
                        <strong>${v.medal}</strong><br/>
                        Year: <strong>${v.year}</strong><br/>
                        Avg: <strong>${v.value.toFixed(2)}</strong>
                    `)
                    .style("left", `${event.pageX + 8}px`)
                    .style("top", `${event.pageY + 8}px`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));
    }

    // Effect to load data when name changes
    $effect(() => {
        if (name) {
            loadData(name);
        }
    });

    // Effect to extract specific bar data when rawBarData, params.gender, or attribute changes
    $effect(() => {
        if (rawBarData) {
            barData = extractBarData(rawBarData, params.gender, attribute);
        }
    });

    // Effect to draw chart when data, params.medals, or dimensions change
    $effect(() => {
        if (containerElement && barData && params.medals && width > 0 && height > 0) {
            drawGroupedBars(containerElement, barData, params.medals, width, height);
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
        Grouped Bars - {name} ({params.gender === "male" ? "Male" : params.gender === "female" ? "Female" : "All"} {attribute.charAt(0).toUpperCase() + attribute.slice(1)})
        - All Years
    </h2>
    
    <div 
        class="flex-1 bg-gray-100 p-3 rounded bar-chart-container" 
        bind:this={containerElement}
    >
        {#if isLoading}
            <div class="loading-container">
                <p class="text-gray-600">Loading bar chart data for {name}...</p>
            </div>
        {:else if error}
            <div class="error-container">
                <p class="text-red-600">Error loading bar chart data: {error}</p>
            </div>
        {:else if !barData}
            <div class="loading-container">
                <p class="text-gray-600">No bar chart data available for {params.gender === "male" ? "Male" : params.gender === "female" ? "Female" : "All"} {attribute}</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .bar-chart-container {
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

    /* Style the axes to match your parallel coordinates chart */
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