<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import * as d3 from "d3";

  const dispatch = createEventDispatcher();

  export let width: number = 800;
  export let height: number = 600;

  let element: HTMLDivElement;
  let chartData: any[] = [];

  onMount(async () => {
    const rawData = await d3.json("statics/front/sport_bubble_data.json");
    chartData = rawData ?? [];
    drawChart(chartData);
  });

  function drawChart(data: any[]) {
    const sizeScale = d3
      .scaleSqrt()
      .domain([0, d3.max(data, d => d.participants) || 0])
      .range([30, 80]);

    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("preserveAspectRatio", "xMidYMid meet");

    const group = svg.append("g");

    const color = d3.scaleOrdinal(d3.schemeSet2).domain(data.map(d => d.name));

    const bubbles = group
      .selectAll(".bubble-group")
      .data(data)
      .join("g")
      .attr("class", "bubble-group");

    bubbles
      .append("circle")
      .attr("class", "bubble")
      .attr("r", d => sizeScale(d.participants))
      .attr("fill", d => color(d.name))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).classed("holographic-effect", true);
        d3.select(this.parentNode).raise();
        d3.select(this.parentNode)
          .append("text")
          .attr("class", "sport-info")
          .attr("y", 38)
          .attr("text-anchor", "middle")
          .style("font-size", "11px")
          .style("fill", "#333")
          .text(`${d.participants} athletes`);
      })
      .on("mouseout", function () {
        d3.select(this).classed("holographic-effect", false);
        d3.select(this.parentNode).select(".sport-info").remove();
      })
      .on("click", (event, d) => {
        const sportKey = d.name.toLowerCase().replace(/\s+/g, "_");
        dispatch("sportSelect", { sportKey });
      });

    bubbles
      .append("text")
      .attr("class", "bubble-label")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("pointer-events", "none")
      .style("fill", "#fff")
      .style("font-weight", "600")
      .style("font-size", d => sizeScale(d.participants) < 50 ? "10px" : "12px")
      .style("dominant-baseline", "middle")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
      .text(d => d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name);

    const simulation = d3
      .forceSimulation(data)
      .force("charge", d3.forceManyBody().strength(10))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => sizeScale(d.participants) + 2))
      .force("x", d3.forceX(width / 2).strength(0.07))
      .force("y", d3.forceY(height / 2).strength(0.07))
      .on("tick", () => {
        bubbles.attr("transform", d => `translate(${d.x}, ${d.y})`);
      });

    element.innerHTML = "";
    element.appendChild(svg.node() as Node);
  }
</script>

<div class="chart-container" bind:this={element}></div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
    background-color: #f8f9fa;
    border-radius: 0.75rem;
    overflow: hidden;
    position: relative;
  }
  .bubble-label {
    font-family: 'Inter', sans-serif;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  .sport-info {
    font-family: 'Inter', sans-serif;
    fill: #444;
  }
</style>
