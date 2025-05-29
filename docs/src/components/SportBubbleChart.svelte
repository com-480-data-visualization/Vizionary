<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { goto } from '$app/navigation';

  let element: HTMLDivElement;
  let chartData: any[] = [];

  let height=$state(0);
  let width=$state(0);

  let currentWidth: number = 0;
  let currentHeight: number = 0;

  let resizeObserver: ResizeObserver;

  $effect(() => {
    currentWidth = width;
    currentHeight = height;
    drawChart(chartData);
  });

  onMount(async () => {
    

    const rawData = await d3.json("/statics/sport_bubble_data.json");
    chartData = rawData ?? [];

    if (currentWidth > 0 && currentHeight > 0) {
        drawChart(chartData);
    }

    return () => resizeObserver.unobserve(element);
  });

  $effect(() => {
    if (chartData.length > 0 && currentWidth > 0 && currentHeight > 0) {
      drawChart(chartData);
    }
  });

  function drawChart(data: any[]) {
    d3.select(element).select("svg").remove();

    if (currentWidth <= 0 || currentHeight <= 0) {
      console.warn("Chart container has zero or negative dimensions, skipping draw.");
      return;
    }

    const sizeScale = d3
      .scaleSqrt()
      .domain([0, d3.max(data, d => d.participants) || 0])
      // ADJUSTED RANGE HERE:
      .range([Math.max(8, Math.min(currentWidth, currentHeight) * 0.04), Math.max(25, Math.min(currentWidth, currentHeight) * 0.1)]);
      // Explanation:
      // - Using Math.min(currentWidth, currentHeight) makes the size scale adapt to the smaller dimension, preventing bubbles from being too big in a very wide but short container, or vice versa.
      // - Multipliers 0.02 and 0.08 (2% to 8% of the smaller dimension) are more conservative.
      // - Added minimums (8 and 25) to ensure tiny bubbles are still visible.


    const svg = d3
      .create("svg")
      .attr("width", currentWidth)
      .attr("height", currentHeight)
      .attr("viewBox", [0, 0, currentWidth, currentHeight])
      .attr("preserveAspectRatio", "xMidYMid meet");

    const group = svg.append("g");

    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(data.map(d => d.name));

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
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).classed("holographic-effect", true);
        d3.select(this.parentNode).raise();
        d3.select(this.parentNode)
          .append("text")
          .attr("class", "sport-info")
          .attr("y", sizeScale(d.participants) + 15)
          .attr("text-anchor", "middle")
          .style("font-size", "11px")
          .style("fill", "#555")
          .style("font-weight", "600")
          .text(`${d.participants} athletes`);
      })
      .on("mouseout", function () {
        d3.select(this).classed("holographic-effect", false);
        d3.select(this.parentNode).select(".sport-info").remove();
      })
      .on("click", (event, d) => {
        const sportKey = d.name.toLowerCase().replace(/\s+/g, "_");
        goto(`/${sportKey}`);
      });

    bubbles
      .append("text")
      .attr("class", "bubble-label")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("pointer-events", "none")
      .style("fill", "#fff")
      .style("font-weight", "700")
      .style("font-size", d => sizeScale(d.participants) < 30 ? "8px" : (sizeScale(d.participants) < 50 ? "11px" : "13px"))
      .style("dominant-baseline", "middle")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.4)")
      .text(d => d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name);

    const simulation = d3
      .forceSimulation(data)
      .force("charge", d3.forceManyBody().strength(d => -sizeScale(d.participants) * 1.5))
      .force("center", d3.forceCenter(currentWidth / 2, currentHeight / 2))
      .force("collision", d3.forceCollide().radius(d => sizeScale(d.participants) + 4))
      .force("x", d3.forceX(currentWidth / 2).strength(40 / currentWidth))
      .force("y", d3.forceY(currentHeight / 2).strength(40 / currentHeight))
      .on("tick", () => {
        bubbles.attr("transform", d => `translate(${d.x}, ${d.y})`);
      });

    element.innerHTML = "";
    element.appendChild(svg.node() as Node);
  }
</script>

<div class="chart-container" bind:this={element} bind:clientHeight={height} bind:clientWidth={width}></div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  .holographic-effect {
    filter: drop-shadow(0 0 8px rgba(255, 255, 0, 0.7))
            drop-shadow(0 0 15px rgba(0, 255, 255, 0.5));
    transform: scale(1.05);
    transition: all 0.2s ease-out;
  }

  .bubble-label {
    font-family: 'Inter', sans-serif;
    user-select: none;
  }
  .sport-info {
    font-family: 'Inter', sans-serif;
    user-select: none;
  }
</style>