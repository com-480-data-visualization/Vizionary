import * as d3 from "d3";

export async function drawGroupedBars(
  container: HTMLElement,
  sportKey: string,
  attribute: "age" | "height" | "weight",
  sex: "M" | "F" = "F"
) {
  const resp: any = await d3.json(`/statics/${sportKey}.json`);
  const raw = Array.isArray(resp?.bar) ? resp.bar : [];
  if (!raw.length) return;

  const medals = ["Gold", "Silver", "Bronze", "No Medal"];
  const filtered = raw.filter(
    (d: any) => d.sex === sex && d.attribute === attribute && d.value != null
  );

  const years = Array.from(new Set(filtered.map((d) => d.year))).sort(
    (a, b) => a - b
  );

  const data = years.map((year) => {
    return {
      year,
      values: medals.map((medal) => {
        const entry = filtered.find(
          (d) => d.year === year && d.medal === medal
        );
        return {
          medal,
          value: entry?.value ?? 0
        };
      })
    };
  });

  const margin = { top: 30, right: 20, bottom: 60, left: 60 };
  const width = 500 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  container.innerHTML = "";

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x0 = d3
    .scaleBand<number>()
    .domain(years)
    .range([0, width])
    .paddingInner(0.2);

  const x1 = d3
    .scaleBand<string>()
    .domain(medals)
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data.flatMap((d) => d.values.map((v) => v.value))) || 0])
    .nice()
    .range([height, 0]);

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0).tickFormat(d3.format("d")))
    .selectAll("text")
    .attr("transform", "rotate(45)")
    .attr("dx", "0.6em")
    .attr("dy", "0.6em")
    .style("text-anchor", "start");

  svg.append("g").call(d3.axisLeft(y));

  const color = (m: string) =>
    m === "Gold"
      ? "gold"
      : m === "Silver"
      ? "silver"
      : m === "Bronze"
      ? "peru"
      : "lightblue";

  const tooltip = d3
    .select(container)
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "white")
    .style("border", "1px solid #aaa")
    .style("padding", "4px 8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("opacity", 0);

  const yearG = svg
    .selectAll("g.year")
    .data(data)
    .join("g")
    .attr("class", "year")
    .attr("transform", (d) => `translate(${x0(d.year)},0)`);

  yearG
    .selectAll("rect")
    .data((d) => d.values.map((v) => ({ ...v, year: d.year })))
    .join("rect")
    .attr("x", (v) => x1(v.medal)!)
    .attr("y", (v) => y(v.value))
    .attr("width", x1.bandwidth())
    .attr("height", (v) => height - y(v.value))
    .attr("fill", (v) => color(v.medal))
    .on("mouseover", (event, v) => {
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${v.medal}</strong><br/>Year: <strong>${v.year}</strong><br/>Avg ${attribute}: <strong>${v.value.toFixed(
            2
          )}</strong>`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));
}
