<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";

    // Props using Svelte 5 syntax
    let { name, params } = $props();

    // State variables using Svelte 5 runes
    let containerElement = $state<HTMLDivElement>();
    let width = $state(960);
    let height = $state(500);
    let rawTreemapData = $state<Array<{country: string; sex?: string; value: number}>>([]);
    let continentData = $state<Record<string, string>>({});
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Configuration constants
    const MIN_SHARE = 0.02;  // 2% minimum for major countries
    const MAX_SHOWN = 30;    // maximum 15 rectangles shown

    // Derived filtered and processed data using $derived.by for complex logic
    let filteredTreemapData = $derived.by(() => {
        if (rawTreemapData.length === 0) return [];
        
        console.log('Processing treemap data with:', {
            gender: params?.gender,
            rawDataLength: rawTreemapData.length
        });
        
        // Filter by gender if specified
        let filtered;
        if (params?.gender === "male") {
            filtered = rawTreemapData.filter(d => d.sex === "M");
        } else if (params?.gender === "female") {
            filtered = rawTreemapData.filter(d => d.sex === "F");
        } else {
            // For "all", keep all data
            filtered = rawTreemapData;
        }

        // Aggregate by country
        const byCountry = new Map<string, number>();
        for (const rec of filtered) {
            byCountry.set(rec.country, (byCountry.get(rec.country) ?? 0) + rec.value);
        }

        const total = d3.sum(Array.from(byCountry.values()));
        if (total === 0) return [];

        const sorted = Array.from(byCountry, ([country, athletes]) => ({ country, athletes }))
            .sort((a, b) => b.athletes - a.athletes);

        const majors: { country: string; athletes: number }[] = [];
        let othersAthletes = 0;

        for (const rec of sorted) {
            const share = rec.athletes / total;
            if (majors.length < MAX_SHOWN && share >= MIN_SHARE) {
                majors.push(rec);
            } else {
                othersAthletes += rec.athletes;
            }
        }

        if (othersAthletes > 0) {
            majors.push({ country: "Rest of the World", athletes: othersAthletes });
        }

        // Map to continents/regions
        const CONTINENTS = [
            "Africa", "Asia", "Europe",
            "North America", "South America",
            "Oceania",
        ] as const;
        type Continent = typeof CONTINENTS[number];
        type Region = Continent | "Other";

        const processedData = majors.map(({ country, athletes }) => ({
            country,
            athletes,
            region: (continentData[country] as Region) ?? "Other" as Region,
        }));

        console.log('Processed treemap data:', processedData);
        return processedData;
    });

    // Function to load continent mapping data
    async function loadContinentData() {
        try {
            const response = await fetch('/statics/front/continents.json');
            if (response.ok) {
                continentData = await response.json();
            }
        } catch (err) {
            console.warn('Could not load continent data:', err);
        }
    }

    // Function to load treemap data
    async function loadData(sportName: string) {
        if (!sportName) return;
        
        isLoading = true;
        error = null;
        rawTreemapData = [];
        
        try {
            const response = await fetch(`/statics/${sportName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

            const rawData = await response.json();
            console.log("Loaded raw treemap data:", rawData);

            // Extract the treemap data from the raw JSON
            if (rawData && rawData.treemap && Array.isArray(rawData.treemap)) {
                rawTreemapData = rawData.treemap;
                console.log("Processed treemap data:", rawTreemapData);
            } else {
                throw new Error("Treemap data not found in the JSON file or not in expected format.");
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error("Error loading treemap data:", err);
        } finally {
            isLoading = false;
        }
    }

    // Function to draw the treemap
    function drawTreemap() {
        if (!containerElement || filteredTreemapData.length === 0) return;
        
        try {
            // Clear existing content
            containerElement.innerHTML = "";

            // Create SVG
            const svg = d3.select(containerElement)
                .append("svg")
                .attr("viewBox", `0 0 ${width} ${height}`)
                .style("max-width", "100%")
                .style("height", "auto");

            // Create hierarchy and layout
            const root = d3.hierarchy({ name: "root", children: filteredTreemapData } as any)
                .sum((d: any) => d.athletes)
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

            d3.treemap<any>()
                .size([width, height])
                .paddingInner(2)(root);

            // Color palette by region
            const regionColor = new Map<string, string>([
                ["Europe", "#2C7BD1"],
                ["North America", "#D72626"],
                ["Asia", "#F2C53D"],
                ["South America", "#F26B83"],
                ["Oceania", "#3DB96B"],
                ["Africa", "#9E5CF2"],
                ["Other", "#E8E5DA"],
            ]);

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

            // Draw rectangles and labels
            const nodes = svg.selectAll("g")
                .data(root.leaves())
                .join("g")
                .attr("transform", d => `translate(${d.x0},${d.y0})`);

            // Add rectangles
            nodes.append("rect")
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0)
                .attr("fill", d => {
                    const base = regionColor.get((d.data as any).region) ?? "#ccc";
                    const parentVal = d.parent?.value ?? d.value!;
                    const ratio = Math.min(1, (d.value! / parentVal) * 2);
                    return d3.color(base)!.brighter(1 - ratio).formatHex();
                })
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .on("mouseover", (event, d) => {
                    const data = d.data as any;
                    tooltip
                        .style("opacity", 1)
                        .html(`
                            <strong>${data.country}</strong><br/>
                            Region: ${data.region}<br/>
                            Athletes: <strong>${data.athletes}</strong><br/>
                            ${params?.gender === "all" ? "All genders" : params?.gender === "male" ? "Male" : "Female"}
                        `)
                        .style("left", `${event.pageX + 8}px`)
                        .style("top", `${event.pageY + 8}px`);
                })
                .on("mouseout", () => tooltip.style("opacity", 0));

            // Add clip paths for text
            nodes.append("clipPath")
                .attr("id", (d, i) => `clip-${i}`)
                .append("rect")
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0);

            // Constants for text sizing
            const LABEL_PAD = 4;
            const MIN_AREA = 3000; // minimum area in px² to show labels

            // Filter nodes large enough for labels
            const labels = nodes.filter(d => (d.x1 - d.x0) * (d.y1 - d.y0) >= MIN_AREA);

            // Add country labels
            labels.each(function (d, i) {
                const g = d3.select(this);
                const w = d.x1 - d.x0;
                const h = d.y1 - d.y0;
                const side = Math.min(w, h);
                const fs1 = Math.min(24, side / 5);  // country font size
                const fs2 = fs1 * 0.8;               // athletes font size
                const lh = fs1 * 1.1;                // line height

                // Country name
                g.append("text")
                    .attr("clip-path", `url(#clip-${i})`)
                    .attr("x", LABEL_PAD)
                    .attr("y", LABEL_PAD + fs1)
                    .style("font-weight", "700")
                    .style("font-size", `${fs1}px`)
                    .style("fill", "#333")
                    .text((d.data as any).country);

                // Athletes count
                g.append("text")
                    .attr("clip-path", `url(#clip-${i})`)
                    .attr("x", LABEL_PAD)
                    .attr("y", LABEL_PAD + fs1 + lh)
                    .style("font-style", "italic")
                    .style("font-size", `${fs2}px`)
                    .style("fill", "#666")
                    .text(`${d.value} athletes`);
            });

        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to draw treemap';
            console.error("Error drawing treemap:", err);
        }
    }

    // Effect to load data when name changes
    $effect(() => {
        if (name) {
            loadData(name);
        }
    });

    // Effect to draw treemap when conditions are met
    $effect(() => {
        if (name || params || filteredTreemapData.length > 0 && width > 0 && height > 0) {
            drawTreemap();
        }
    });

    // Handle resize and initial setup
    onMount(() => {
        // Load continent data on mount
        loadContinentData();
        
        if (!containerElement) return;
        
        // Initialize dimensions
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

        // resizeObserver.observe(containerElement);

        // Cleanup
        return () => {
            // resizeObserver.disconnect();
        };
    });
</script>

<div class="w-full h-full p-4 flex flex-col text-center">
    <h2 class="text-center text-gray-800 text-xl font-bold mb-2">
        Country Participation
    </h2>
    
    <div 
        class="flex-1 bg-gray-100 p-3 rounded treemap-container" 
        bind:this={containerElement}
    >
        {#if isLoading}
            <div class="loading-container">
                <p class="text-gray-600">Loading treemap data for {name}...</p>
            </div>
        {:else if error}
            <div class="error-container">
                <p class="text-red-600">Error loading treemap data: {error}</p>
            </div>
        {:else if !filteredTreemapData || filteredTreemapData.length === 0}
            <div class="loading-container">
                <p class="text-gray-600">No treemap data available for {params?.gender === "male" ? "Male" : params?.gender === "female" ? "Female" : "All"} athletes</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .treemap-container {
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

    /* Style the treemap elements */
    :global(.treemap-container svg) {
        width: 100%;
        height: 100%;
    }

    :global(.treemap-container rect:hover) {
        stroke: #333;
        stroke-width: 2px;
    }

    :global(.tooltip) {
        z-index: 10;
    }
</style>