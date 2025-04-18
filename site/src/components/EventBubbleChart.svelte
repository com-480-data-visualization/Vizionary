<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";

    export let width: number = 800;
    export let height: number = 600;
    export let olympicsData: any = null;

    let element: HTMLDivElement;

    onMount(async function () {
        if (!olympicsData) return;

        try {
            const eventsData = olympicsData.season === "Summer" 
                ? getSummerEventsData(olympicsData)
                : getWinterEventsData(olympicsData);

            const chart = createEventsBubbleChart(eventsData, {
                width: element.clientWidth || width,
                height: element.clientHeight || height,
                olympicsData: olympicsData
            });

            d3.select(element).append(() => chart);

            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === element) {
                        element.innerHTML = "";
                        const newChart = createEventsBubbleChart(eventsData, {
                            width: entry.contentRect.width,
                            height: entry.contentRect.height,
                            olympicsData: olympicsData
                        });
                        d3.select(element).append(() => newChart);
                    }
                }
            });

            resizeObserver.observe(element);

            return () => {
                resizeObserver.disconnect();
            };
        } catch (error) {
            console.error("Error loading events data:", error);
        }
    });

    function createEventsBubbleChart(
        data: any[],
        options: {
            width: number;
            height: number;
            olympicsData: any;
        },
    ) {
        const { width, height, olympicsData } = options;

        const sizeScale = d3
            .scaleSqrt()
            .domain([0, d3.max(data, (d) => d.participants) || 0])
            .range([30, 80]);

        const svg = d3
            .create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("preserveAspectRatio", "xMidYMid meet");

        const bubbleGroup = svg.append("g");

        const bubbles = bubbleGroup
            .selectAll(".bubble-group")
            .data(data)
            .join("g")
            .attr("class", "bubble-group");

        bubbles
            .append("circle")
            .attr("class", "bubble")
            .attr("r", (d) => sizeScale(d.participants))
            .attr("fill", (d) => olympicsData.season === "Summer" ? "rgba(255, 158, 0, 0.7)" : "rgba(79, 195, 247, 0.7)")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("cursor", "pointer")
            .on("mouseover", function (event, d) {
                d3.select(this).classed("holographic-effect", true);

                const tooltip = d3
                    .select(element)
                    .append("div")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("background", "rgba(0, 0, 0, 0.8)")
                    .style("color", "white")
                    .style("border-radius", "5px")
                    .style("padding", "10px")
                    .style("pointer-events", "none")
                    .style("z-index", "100")
                    .style("opacity", "0");

                tooltip
                    .html(
                        `
            <strong>${d.name}</strong><br>
            Athletes: ${d.participants.toLocaleString()}<br>
            Countries Competing: ${d.countries}<br>
            Medals: ${d.medals}<br>
            Determining Factor: <strong>${d.determiningFactor}</strong><br>
          `,
                    )
                    .style("left", `${event.pageX}px`)
                    .style("top", `${event.pageY}px`)
                    .transition()
                    .duration(300)
                    .style("opacity", "1");

                d3.select(this.parentNode).raise();
            })
            .on("mousemove", function (event) {
                d3.select(".tooltip")
                    .style("left", `${event.pageX - 520}px`)
                    .style("top", `${event.pageY - 255}px`);
            })
            .on("mouseout", function () {
                d3.select(this).classed("holographic-effect", false);
                d3.select(".tooltip").remove();
            });

        bubbles
            .append("text")
            .attr("class", "bubble-label")
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .style("pointer-events", "none")
            .style("fill", "#fff")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .text((d) => d.name);

        const simulation = d3
            .forceSimulation(data)
            .force("charge", d3.forceManyBody().strength(10))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force(
                "collision",
                d3
                    .forceCollide()
                    .radius((d) => sizeScale(d.participants) + 2),
            )
            .force("x", d3.forceX(width / 2).strength(0.07))
            .force("y", d3.forceY(height / 2).strength(0.07))
            .on("tick", () => {
                bubbles.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
            });

        svg.append("style").text(`
        .holographic-effect {
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
        }
        
        .selected {
          stroke: #ffcc00;
          stroke-width: 3px;
        }
      `);

        return svg.node();
    }

    // Sample data for Summer Olympics events (generated by chatgpt)
    function getSummerEventsData(olympicsData: any) {
        return [
            {
                name: "Swimming",
                participants: 900,
                countries: 170,
                medals: 34,
                determiningFactor: "Weight"
            },
            {
                name: "Athletics",
                participants: 2100,
                countries: 200,
                medals: 47,
                determiningFactor: "Weight"
            },
            {
                name: "Gymnastics",
                participants: 500,
                countries: 85,
                medals: 18,
                determiningFactor: "None"
            },
            {
                name: "Basketball",
                participants: 288,
                countries: 24,
                medals: 3,
                determiningFactor: "Height"
            },
            {
                name: "Cycling",
                participants: 520,
                countries: 92,
                medals: 22,
                determiningFactor: "Height"
            }
        ];
    }

    // Sample data for Winter Olympics events
    function getWinterEventsData(olympicsData: any) {
        return [
            {
                name: "Alpine Skiing",
                participants: 320,
                countries: 75,
                medals: 11,
                determiningFactor: "Weight"
            },
            {
                name: "Figure Skating",
                participants: 150,
                countries: 30,
                medals: 5,
                determiningFactor: "None"
            },
            {
                name: "Ice Hockey",
                participants: 416,
                countries: 12,
                medals: 3,
                determiningFactor: "None"
            },
            {
                name: "Snowboarding",
                participants: 258,
                countries: 40,
                medals: 10,
                determiningFactor: "None"
            },
            {
                name: "Speed Skating",
                participants: 180,
                countries: 25,
                medals: 14,
                determiningFactor: "Height"
            }
        ];
    }
</script>

<div class="events-chart-container" bind:this={element}>
    <!-- D3 -->
</div>

<style>
    .events-chart-container {
        width: 100%;
        height: 100%;
        background-color: #f8f9fa;
        border-radius: 0.75rem;
        overflow: hidden;
        position: relative;
    }
</style>