<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";

    // Props using Svelte 5 syntax
    let { name, params } = $props();

    // State variables using Svelte 5 runes - FIXED: Remove height binding
    let containerElement = $state<HTMLDivElement>();
    let width = $state(960);
    // FIXED: Don't bind height, calculate it from container
    let rawTreemapData = $state<
        Array<{ year: number; country: string; noc: string; continent: string; sex?: string; value: number }>
    >([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);
    
    // NEW: Resize loading state
    let isResizing = $state(false);
    let resizeTimeout: NodeJS.Timeout | null = null;

    // Configuration constants
    const MIN_SHARE = 0.005; // 2% minimum for major countries
    const MAX_SHOWN = 50; // maximum 15 rectangles shown

    // Derived filtered and processed data using $derived.by for complex logic
    let filteredTreemapData = $derived.by(() => {
        if (rawTreemapData.length === 0) return [];

        console.log("Processing treemap data with:", {
            gender: params?.gender,
            startYear: params.startYear, // Added startYear
            endYear: params.endYear,     // Added endYear
            rawDataLength: rawTreemapData.length,
        });

        // --- START MODIFICATION (Filtering by Year) ---
        // Filter by year range first
        const yearFiltered = rawTreemapData.filter(
            (d) => d.year >= params.startYear && d.year <= params.endYear,
        );
        // --- END MODIFICATION ---

        // Filter by gender if specified
        let genderFiltered;
        if (params?.gender === "male") {
            genderFiltered = yearFiltered.filter((d) => d.sex === "M");
        } else if (params?.gender === "female") {
            genderFiltered = yearFiltered.filter((d) => d.sex === "F");
        } else {
            // For "all", keep all data
            genderFiltered = yearFiltered;
        }

        // Aggregate by country, preserving NOC and Continent for each country
        const byCountry = new Map<string, { athletes: number; noc: string; continent: string }>();
        for (const rec of genderFiltered) {
            const current = byCountry.get(rec.country);
            if (current) {
                byCountry.set(rec.country, {
                    ...current,
                    athletes: current.athletes + rec.value,
                });
            } else {
                byCountry.set(rec.country, {
                    athletes: rec.value,
                    noc: rec.noc,
                    continent: rec.continent,
                });
            }
        }

        const total = d3.sum(Array.from(byCountry.values()), (d) => d.athletes);
        if (total === 0) return [];

        const sorted = Array.from(byCountry, ([country, data]) => ({
            country,
            athletes: data.athletes,
            noc: data.noc,
            continent: data.continent,
        })).sort((a, b) => b.athletes - a.athletes);

        const majors: { country: string; athletes: number; noc: string; continent: string }[] = [];
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
            majors.push({
                country: "Rest of the World",
                athletes: othersAthletes,
                noc: "ROW", // Assign a generic NOC for "Rest of the World"
                continent: "Other", // Assign "Other" continent for "Rest of the World"
            });
        }

        // The processedData is already in the desired format from the 'majors' array
        const processedData = majors;

        console.log("Processed treemap data:", processedData);
        return processedData;
    });

    // Function to load treemap data
    async function loadData(sportName: string) {
        if (!sportName) return;

        isLoading = true;
        error = null;
        rawTreemapData = [];

        try {
            const response = await fetch(`statics/${sportName}.json`);
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
                throw new Error(
                    "Treemap data not found in the JSON file or not in expected format.",
                );
            }
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred";
            console.error("Error loading treemap data:", err);
        } finally {
            isLoading = false;
        }
    }

    // NEW: Handle resize with debouncing
    function handleResize() {
        // Set resizing state immediately
        isResizing = true;
        
        // Clear existing timeout
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        // Set new timeout to end resizing state after 500ms
        resizeTimeout = setTimeout(() => {
            isResizing = false;
            resizeTimeout = null;
        }, 500);
    }

    // Function to draw the treemap
    function drawTreemap() {
        if (!containerElement || filteredTreemapData.length === 0 || isResizing) return;

        try {
            // Clear existing content
            containerElement.innerHTML = "";

            // FIXED: Calculate dimensions from container, with fixed aspect ratio
            const containerRect = containerElement.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            
            // Use container dimensions with padding
            const margin = { top: 20, right: 0, bottom: 20, left: 10 };
            const w = Math.max(100, containerWidth - margin.left - margin.right);
            const h = Math.max(100, containerHeight - margin.top - margin.bottom);

            // Create SVG - FIXED: Proper viewBox and sizing
            const svg = d3
                .select(containerElement)
                .append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", `0 0 ${w} ${h}`)
                .attr("preserveAspectRatio", "xMidYMid meet")
                .style("display", "block"); // FIXED: Prevent extra space

            // Create hierarchy and layout
            const root = d3
                .hierarchy({
                    name: "root",
                    children: filteredTreemapData,
                } as any)
                .sum((d: any) => d.athletes)
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

            d3.treemap<any>().size([w, h]).paddingInner(2)(root);

            // Color palette by region (Continent)
            const regionColor = new Map<string, string>([
                ["Europe", "#6A994E"], // Muted Green
                ["Americas", "#A44A3F"], // Rusty Red
                ["Asia", "#E0B75D"], // Goldenrod
                ["Oceania", "#4E8D7C"], // Teal Green
                ["Africa", "#8C6BB0"], // Muted Purple
                ["Other", "#C7C7C7"],  // Light Gray
            ]);

            // Create tooltip
            const tooltip = d3
                .select(containerElement)
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
            const nodes = svg
                .selectAll("g")
                .data(root.leaves())
                .join("g")
                .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

            // Add rectangles
            nodes
                .append("rect")
                .attr("width", (d) => d.x1 - d.x0)
                .attr("height", (d) => d.y1 - d.y0)
                .attr("fill", (d) => {
                    // --- START MODIFICATION (Color by Continent) ---
                    const base = regionColor.get((d.data as any).continent) ?? "#ccc";
                    const parentVal = d.parent?.value ?? d.value!;
                    const ratio = Math.min(1, (d.value! / parentVal) * 2);
                    return d3
                        .color(base)!
                        .brighter(1 - ratio)
                        .formatHex();
                    // --- END MODIFICATION ---
                })
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .on("mouseover", (event, d) => {
                    const data = d.data as any;

                    const containerRect = containerElement.getBoundingClientRect();

                        // Calculate tooltip position relative to the container
                        // event.clientX/Y are viewport coordinates
                        // containerRect.left/top are container's viewport coordinates
                        // So, event.clientX - containerRect.left gives position relative to container
                        let x = event.clientX - containerRect.left + 15; // +15px offset from cursor
                        let y = event.clientY - containerRect.top + 15;  // +15px offset from cursor
                        
                        if (x > 100){
                            x -= 100;
                        }
                        if (y > 100){
                            y -= 100;
                        }

                    tooltip
                        .style("opacity", 1)
                        .html(
                            `
                            <strong>${data.country} (${data.noc})</strong><br/>
                            Continent: ${data.continent}<br/>
                            Athletes: <strong>${data.athletes}</strong><br/>
                            ${params?.gender === "all" ? "All genders" : params?.gender === "male" ? "Male" : "Female"}
                        `,
                        )
                        .style("left", `${x}px`)
                        .style("top", `${y}px`);
                })
                .on("mouseout", () => tooltip.style("opacity", 0));

            // Add clip paths for text
            nodes
                .append("clipPath")
                .attr("id", (d, i) => `clip-${i}`)
                .append("rect")
                .attr("width", (d) => d.x1 - d.x0)
                .attr("height", (d) => d.y1 - d.y0);

            // Constants for text sizing
            const LABEL_PAD = 4;
            const MIN_AREA = 3000; // minimum area in px² to show labels
            // --- START MODIFICATION (Adjusted MIN_AREA for NOC vs Country Name) ---
            const MIN_AREA_FOR_COUNTRY_NAME = 6000; // Larger area to show full country name
            // --- END MODIFICATION ---

            // Filter nodes large enough for labels
            const labels = nodes.filter(
                (d) => (d.x1 - d.x0) * (d.y1 - d.y0) >= MIN_AREA,
            );

            // Add country labels
            labels.each(function (d, i) {
                const g = d3.select(this);
                const w = d.x1 - d.x0;
                const h = d.y1 - d.y0;
                const side = Math.min(w, h);
                const fs1 = Math.min(24, side / 5); // country/NOC font size
                const fs2 = fs1 * 0.8; // athletes font size
                const lh = fs1 * 1.1; // line height

                // --- START MODIFICATION (Display NOC for smaller countries) ---
                const displayLabel = (d.data as any).country;
                const displayNOC = (d.data as any).noc;
                const area = w * h;

                // Determine whether to show full country name or NOC
                const primaryText = area >= MIN_AREA_FOR_COUNTRY_NAME ? displayLabel : displayNOC;
                // --- END MODIFICATION ---

                // Country name or NOC
                g.append("text")
                    .attr("clip-path", `url(#clip-${i})`)
                    .attr("x", LABEL_PAD)
                    .attr("y", LABEL_PAD + fs1)
                    .style("font-weight", "700")
                    .style("font-size", `${fs1}px`)
                    .style("fill", "#333")
                    .text(primaryText); // Use the determined primaryText

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
            error =
                err instanceof Error ? err.message : "Failed to draw treemap";
            console.error("Error drawing treemap:", err);
        }
    }

    // Effect to load data when name changes
    $effect(() => {
        if (name) {
            loadData(name);
        }
    });

    $effect(() => {
        if (width) {
            isResizing = true;
            
            // Set timeout
            const timeoutId = setTimeout(() => {
                isResizing = false;
            }, 500);
            
            // Return cleanup function that clears the timeout
            return () => {
                clearTimeout(timeoutId);
            };
        }
    });

    // Effect to draw treemap when conditions are met
    $effect(() => {
        if (
            name ||
            params || width ||
            (filteredTreemapData.length > 0)
        ) {
            drawTreemap();
        }
    });
</script>

<!-- FIXED: Remove height binding, use CSS for sizing -->
<div class="w-full p-4 flex-1 flex flex-col text-center">
    <div
        class="flex-1 bg-gray-100 p-3 rounded treemap-container"
        bind:this={containerElement} 
        bind:clientWidth={width}
    >
        {#if isLoading}
            <div class="loading-container">
                <p class="text-gray-600">Loading treemap data for {name}...</p>
            </div>
        {:else if isResizing}
            <div class="loading-container">
                <div class="resize-spinner"></div>
                <p class="text-gray-600">Adjusting layout...</p>
            </div>
        {:else if error}
            <div class="error-container">
                <p class="text-red-600">Error loading treemap data: {error}</p>
            </div>
        {:else if !filteredTreemapData || filteredTreemapData.length === 0}
            <div class="loading-container">
                <p class="text-gray-600">
                    No treemap data available for {params?.gender === "male"
                        ? "Male"
                        : params?.gender === "female"
                          ? "Female"
                          : "All"} athletes
                    between {params.startYear} and {params.endYear}.
                </p>
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
        /* FIXED: Ensure container doesn't grow */
        min-height: 0;
        flex-shrink: 1;
    }

    .loading-container,
    .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        gap: 1rem;
    }

    .resize-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #e5e5e5;
        border-top: 2px solid #666;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Style the treemap elements */
    :global(.treemap-container svg) {
        width: 100%;
        height: 100%;
        /* FIXED: Prevent SVG from expanding container */
        max-width: 100%;
        max-height: 100%;
    }

    :global(.treemap-container rect:hover) {
        stroke: #333;
        stroke-width: 2px;
    }

    :global(.tooltip) {
        z-index: 10;
    }
</style>