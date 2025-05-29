import * as d3 from "d3";

export type HeatAttr = { year: number[]; corr: number[] };
export type HeatCompact = {
  age:    HeatAttr;
  height: HeatAttr;
  weight: HeatAttr;
};

export function drawHeatmap(
  container: HTMLElement,
  heatmapData: HeatCompact,
  width: number = 600
) {
  const attrs = ["age","height","weight"];
  const years = heatmapData.age.year; // assume all three have same years
  const cellSize = width / years.length;
  const height = cellSize * attrs.length;

  container.innerHTML = "";
  const svg = d3.select(container)
    .append("svg")
      .attr("width", width + 100)
      .attr("height", height + 80)
    .append("g")
      .attr("transform", "translate(80,40)");

  // scales
  const x = d3.scaleBand<number>()
    .domain(years)
    .range([0, width])
    .padding(0.05);

  const y = d3.scaleBand<string>()
    .domain(attrs)
    .range([0, height])
    .padding(0.05);

  const color = d3.scaleDiverging([-1,0,1], d3.interpolateRdBu);

  // axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text")
      .attr("transform","rotate(45)")
      .attr("dx","0.5em").attr("dy","0.5em")
      .style("text-anchor","start");

  svg.append("g").call(d3.axisLeft(y));

  // tooltip
  const tooltip = d3.select(container)
    .append("div")
      .style("position","absolute")
      .style("pointer-events","none")
      .style("background","white")
      .style("border","1px solid #aaa")
      .style("padding","6px")
      .style("border-radius","4px")
      .style("font-size","12px")
      .style("opacity",0);

  // draw cells
  attrs.forEach(attr => {
    const { year, corr } = (heatmapData as any)[attr] as HeatAttr;
    const data = year.map((yr,i) => ({ year: yr, corr: corr[i], attribute: attr }));
    svg.selectAll(`.cell-${attr}`)
      .data(data)
      .join("rect")
        .attr("x", d => x(d.year)!)
        .attr("y", () => y(attr)!)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.corr))
        .style("stroke","#fff")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity",1)
          .html(`
            Year: <b>${d.year}</b><br/>
            Attr: <b>${d.attribute}</b><br/>
            r = <b>${d.corr.toFixed(2)}</b>
          `)
          .style("left", `${event.pageX+8}px`)
          .style("top",  `${event.pageY+8}px`);
      })
      .on("mouseout", () => tooltip.style("opacity",0));
  });
}
