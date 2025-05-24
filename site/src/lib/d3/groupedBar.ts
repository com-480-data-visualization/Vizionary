import * as d3 from "d3";

export type BarAttr = {
  year:  number[];
  medal: string[];
  value: (number|null)[];
};

/**
 * @param container  The div to draw into
 * @param barData    The compact BarAttr for one sex & one attribute
 * @param medals     Which medals to show (subset of Gold/Silver/Bronze/No Medal)
 */
export function drawGroupedBars(
  container: HTMLElement,
  barData: BarAttr,
  visibleMedals: string[],
  width: number = 600,
  height: number = 300
) {
  // unpack
  const { year: years, medal: medalsArr, value: vals } = barData;

  // flatten & filter by chosen medals
  const flat = years.map((yr,i) => ({
    year:  yr,
    medal: medalsArr[i],
    value: vals[i] ?? 0
  })).filter(d => visibleMedals.includes(d.medal));

  // group by year
  const data = Array.from(
    d3.group(flat, d => d.year),
    ([year, records]) => ({
      year,
      values: records
        // ensure every chosen medal appears (with zero if missing)
        .concat(
          visibleMedals
            .filter(m => !records.find(r => r.medal === m))
            .map(m => ({ year, medal: m, value: 0 }))
        )
        .sort((a,b) => visibleMedals.indexOf(a.medal) - visibleMedals.indexOf(b.medal))
    })
  ).sort((a,b) => a.year - b.year);

  // margins
  const margin = { top: 30, right: 20, bottom: 60, left: 60 };
  const w = width  - margin.left - margin.right;
  const h = height - margin.top  - margin.bottom;

  container.innerHTML = "";
  const svg = d3.select(container)
    .append("svg")
      .attr("width",  width)
      .attr("height", height)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // x0: years
  const x0 = d3.scaleBand<number>()
    .domain(data.map(d => d.year))
    .range([0, w])
    .padding(0.2);

  // x1: medal within year
  const x1 = d3.scaleBand<string>()
    .domain(visibleMedals)
    .range([0, x0.bandwidth()])
    .padding(0.05);

  // y
  const maxVal = d3.max(data.flatMap(d => d.values.map(v => v.value))) || 0;
  const y = d3.scaleLinear()
    .domain([0, maxVal]).nice()
    .range([h, 0]);

  // axes
  svg.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x0)
        .tickValues(data.map(d => d.year))
        .tickFormat(d3.format("d"))
)
      .selectAll("text")
        .attr("transform","rotate(45)")
        .attr("dx","0.6em").attr("dy","0.6em")
        .style("text-anchor","start");

  svg.append("g").call(d3.axisLeft(y));

  // color
  const color = (m: string) =>
    m === "Gold" ? "gold" :
    m === "Silver" ? "silver" :
    m === "Bronze" ? "peru" :
    "lightblue";

  // tooltip
  const tooltip = d3.select(container).append("div")
      .style("position","absolute")
      .style("pointer-events","none")
      .style("background","white")
      .style("border","1px solid #aaa")
      .style("padding","4px 8px")
      .style("border-radius","4px")
      .style("font-size","12px")
      .style("opacity",0);

  // draw
  const yearG = svg.selectAll("g.year")
    .data(data)
    .join("g")
      .attr("class","year")
      .attr("transform", d => `translate(${x0(d.year)},0)`);

  yearG.selectAll("rect")
    .data(d => d.values.map(v => ({ ...v })))
    .join("rect")
      .attr("x", v => x1(v.medal)!)
      .attr("y", v => y(v.value))
      .attr("width", x1.bandwidth())
      .attr("height", v => h - y(v.value))
      .attr("fill", v => color(v.medal))
    .on("mouseover", (event, v) => {
      tooltip
        .style("opacity",1)
        .html(`
          <strong>${v.medal}</strong><br/>
          Year: <strong>${v.year}</strong><br/>
          Avg: <strong>${v.value.toFixed(2)}</strong>
        `)
        .style("left", `${event.pageX+8}px`)
        .style("top",  `${event.pageY+8}px`);
    })
    .on("mouseout", () => tooltip.style("opacity",0));
}
