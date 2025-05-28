<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";

    // Define the types for the bar chart data
    type BarAttr = {
        year: number[];
        medal: string[];
        value: (number | null)[];
        // Added attribute and sex to BarAttr for easier filtering and grouping later
        attribute: "age" | "height" | "weight";
        sex: "M" | "F";
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
    let { name, attribute, params } = $props();

    // State variables using Svelte 5 runes
    let containerElement = $state<HTMLDivElement>();
    let width = $state(600);
    let height = $state(300);
    let rawBarData = $state<any[] | null>(null); // Changed to flat array directly from JSON
    let processedBarData = $state<BarData | null>(null); // To store the nested processed data
    let barData = $state<BarAttr[] | null>(null); // Changed to array of BarAttr for easier filtering
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Function to process the new flat array format into the expected nested structure
    // This function will now simply return the raw data and we'll handle the grouping in filtered data
    // function processBarData(flatBarData: any[]): BarData {
    //     // This processing is now handled by the effects/derived properties,
    //     // so this function can be simplified or removed if rawData.bar is directly used.
    //     // For now, let's keep `rawBarData` as the flat array and `processedBarData`
    //     // as the derived nested structure for clarity and flexibility.
    //     const processedData: BarData = {};

    //     const groupedBySex = d3.group(flatBarData, d => d.sex);

    //     groupedBySex.forEach((sexData, sex) => {
    //         const sexKey = sex as 'M' | 'F';
    //         processedData[sexKey] = {};

    //         const groupedByAttr = d3.group(sexData, d => d.attribute);

    //         groupedByAttr.forEach((attrData, attr) => {
    //             const attrKey = attr as 'age' | 'height' | 'weight';

    //             // Store the original records directly for easier filtering later
    //             processedData[sexKey]![attrKey] = {
    //                 year: attrData.map(item => item.year),
    //                 medal: attrData.map(item => item.medal),
    //                 value: attrData.map(item => item.value),
    //                 attribute: attrKey, // Add attribute to the object
    //                 sex: sexKey // Add sex to the object
    //             };
    //         });
    //     });
    //     return processedData;
    // }

    // Function to load data
    async function loadData(sportName: string) {
        if (!sportName) return;

        isLoading = true;
        error = null;
        rawBarData = null;
        barData = null; // Clear derived data as well

        try {
            const response = await fetch(`/statics/${sportName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const rawData = await response.json();
            console.log("Loaded raw data:", rawData);

            // Extract the flat bar data directly
            if (rawData && rawData.bar && Array.isArray(rawData.bar)) {
                rawBarData = rawData.bar; // Store the raw flat array
                console.log("Raw bar data loaded:", rawBarData);
            } else {
                throw new Error(
                    "Bar data not found in the JSON file or not in expected format.",
                );
            }
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred";
            console.error("Error loading bar data:", err);
        } finally {
            isLoading = false;
        }
    }

    // Derived filtered and processed data based on gender, year range, and attribute
    let filteredAndGroupedBarData = $derived.by(() => {
        if (!rawBarData || rawBarData.length === 0) return [];

        console.log("Filtering bar data with:", {
            gender: params.gender,
            startYear: params.startYear,
            endYear: params.endYear,
            attribute: attribute,
            rawDataLength: rawBarData.length,
        });

        // Filter by year range
        const yearFiltered = rawBarData.filter(
            (d) => d.year >= params.startYear && d.year <= params.endYear,
        );

        // Filter by attribute
        const attributeFiltered = yearFiltered.filter(
            (d) => d.attribute === attribute,
        );

        let genderFiltered;
        if (params.gender === "male") {
            genderFiltered = attributeFiltered.filter((d) => d.sex === "M");
        } else if (params.gender === "female") {
            genderFiltered = attributeFiltered.filter((d) => d.sex === "F");
        } else {
            // --- START MODIFICATION ---
            // For "all", calculate the MEAN of male and female data, but correctly handle missing genders.
            // First, group by year and medal to get male and female values separately for each combination.
            const groupedByYearMedal = d3.group(
                attributeFiltered,
                (d) => d.year,
                (d) => d.medal,
            );

            const combinedData = [];

            for (const [year, medalsMap] of groupedByYearMedal) {
                for (const [medal, sexData] of medalsMap) {
                    let maleValue = null;
                    let femaleValue = null;
                    let count = 0;
                    let sumValue = 0;

                    for (const item of sexData) {
                        if (item.sex === "M" && item.value !== null) {
                            maleValue = item.value;
                            sumValue += item.value;
                            count++;
                        }
                        if (item.sex === "F" && item.value !== null) {
                            femaleValue = item.value;
                            sumValue += item.value;
                            count++;
                        }
                    }

                    let meanValue: number | null = null;
                    if (count > 0) {
                        meanValue = sumValue / count;
                    }

                    combinedData.push({
                        year: year,
                        medal: medal,
                        value: meanValue, // This is the combined average
                    });
                }
            }
            genderFiltered = combinedData.sort((a, b) => a.year - b.year);
            // --- END MODIFICATION ---
        }

        console.log("Filtered and grouped bar data result:", genderFiltered);
        return genderFiltered;
    });

    /**
     * @param container  The div to draw into
     * @param data    The flat array of filtered data (already processed by year, gender, attribute)
     * @param medalFilters Object with boolean flags for each medal type
     * @param chartWidth   Current width of the container
     * @param chartHeight  Current height of the container
     */
    function drawGroupedBars(
        container: HTMLElement,
        data: any[], // Now expects a flat array of filtered data
        medalFilters: {
            gold: boolean;
            silver: boolean;
            bronze: boolean;
            noMedal: boolean;
        },
        chartWidth: number,
        chartHeight: number,
    ) {
        // Clear existing SVG to redraw
        container.innerHTML = "";

        // Create array of visible medal types based on params
        const visibleMedals = [];
        if (medalFilters.gold) visibleMedals.push("Gold");
        if (medalFilters.silver) visibleMedals.push("Silver");
        if (medalFilters.bronze) visibleMedals.push("Bronze");
        if (medalFilters.noMedal) visibleMedals.push("No Medal");

        // Filter by chosen medals
        const filteredByMedal = data.filter((d) =>
            visibleMedals.includes(d.medal),
        );

        // group by year to create nested data structure for grouped bars
        const chartData = Array.from(
            d3.group(filteredByMedal, (d) => d.year),
            ([year, records]) => ({
                year,
                values: records
                    // ensure every chosen medal appears (with zero if missing)
                    .concat(
                        visibleMedals
                            .filter((m) => !records.find((r) => r.medal === m))
                            .map((m) => ({ year, medal: m, value: 0 })),
                    )
                    .sort(
                        (a, b) =>
                            visibleMedals.indexOf(a.medal) -
                            visibleMedals.indexOf(b.medal),
                    ),
            }),
        ).sort((a, b) => a.year - b.year);

        // margins
        chartWidth -= 30;
        chartHeight -= 30;

        const margin = { top: 10, right: 10, bottom: 30, left: 30 };
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
        const maxVal =
            d3.max(chartData.flatMap((d) => d.values.map((v) => v.value))) || 0;
        const y = d3.scaleLinear().domain([0, maxVal]).nice().range([h, 0]);

        // axes
        svg.append("g")
            .attr("transform", `translate(0,${h})`)
            .call(
                d3
                    .axisBottom(x0)
                    .tickValues(chartData.map((d) => d.year))
                    .tickFormat(d3.format("d")),
            )
            .selectAll("text")
            .attr("transform", "rotate(45)")
            .attr("dx", "0.6em")
            .attr("dy", "0.6em")
            .style("text-anchor", "start");

        svg.append("g").call(d3.axisLeft(y));

        // color
        const color = (m: string) =>
            m === "Gold"
                ? "#FFD700" // Gold
                : m === "Silver"
                  ? "#C0C0C0" // Silver
                  : m === "Bronze"
                    ? "#CD7F32" // Bronze
                    : "lightblue";

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
                const containerRect = containerElement.getBoundingClientRect();

                // Calculate tooltip position relative to the container
                // event.clientX/Y are viewport coordinates
                // containerRect.left/top are container's viewport coordinates
                // So, event.clientX - containerRect.left gives position relative to container
                const x = event.clientX - containerRect.left + 15; // +15px offset from cursor
                const y = event.clientY - containerRect.top + 15; // +15px offset from cursor

                tooltip
                    .style("opacity", 1)
                    .html(
                        `
                        <strong>${v.medal}</strong><br/>
                        Year: <strong>${v.year}</strong><br/>
                        Avg: <strong>${v.value !== null ? v.value.toFixed(2) : "N/A"}</strong>
                    `,
                    )
                    .style("left", `${x}px`)
                    .style("top", `${y}px`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));
    }

    // Effect to load data when name changes
    $effect(() => {
        if (name) {
            loadData(name);
        }
    });

    // Effect to draw chart when filteredAndGroupedBarData, params.medals, or dimensions change
    $effect(() => {
        if (
            containerElement &&
            filteredAndGroupedBarData &&
            params.medals &&
            width > 0 &&
            height > 0
        ) {
            drawGroupedBars(
                containerElement,
                filteredAndGroupedBarData,
                params.medals,
                width,
                height,
            );
        }
    });
</script>

<div class="max-height-500px w-full h-full p-2 flex flex-col">
    <div
        class="flex-1 bg-gray-100 p-3 rounded bar-chart-container"
        bind:this={containerElement}
        bind:clientHeight={height}
        bind:clientWidth={width}
    >
        {#if isLoading}
            <div class="loading-container">
                <p class="text-gray-600">
                    Loading bar chart data for {name}...
                </p>
            </div>
        {:else if error}
            <div class="error-container">
                <p class="text-red-600">
                    Error loading bar chart data: {error}
                </p>
            </div>
        {:else if !filteredAndGroupedBarData || filteredAndGroupedBarData.length === 0}
            <div class="loading-container">
                <p class="text-gray-600">
                    No bar chart data available for {params.gender === "male"
                        ? "Male"
                        : params.gender === "female"
                          ? "Female"
                          : "All"}
                    {attribute}
                    between {params.startYear} and {params.endYear}.
                </p>
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
