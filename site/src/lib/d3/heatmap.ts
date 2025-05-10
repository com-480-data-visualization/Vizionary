import * as d3 from "d3";

type Heat = { year:number; sex:string; attribute:string; corr:number };

export async function drawHeatmap(
  container: HTMLElement,
  sportKey: string,
  sex: "M"|"F" = "F"
) {
  const resp: any = await d3.json(`/statics/${sportKey}.json`);
  const raw: Heat[] = resp?.heatmap || [];
  const data = raw.filter(d => d.sex === sex);

  const years = Array.from(new Set(data.map(d => d.year))).sort((a,b)=>a-b);
  const attrs = ["age","height","weight"];

  const margin = { top:50, right:10, bottom:60, left:80 };
  const cell = 30;
  const width = years.length * cell;
  const height = attrs.length * cell;

  container.innerHTML = "";
  const svg = d3.select(container).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display","block").style("margin","0 auto")
    .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand<number>().domain(years).range([0,width]).padding(0.05);
  const y = d3.scaleBand<string>().domain(attrs).range([0,height]).padding(0.05);
  const color = d3.scaleDiverging([-1,0,1], d3.interpolateRdBu);

  svg.append("text").attr("x",0).attr("y",-30).style("font-size","16px").text(`Correlation vs Medal (sex=${sex})`);
  svg.append("text").attr("x",0).attr("y",-10).style("font-size","12px").style("fill","#555")
    .text("Pearson r between medal-win and attribute by year");

  svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text").attr("transform","rotate(45)").attr("dx","0.5em").attr("dy","0.5em").style("text-anchor","start");
  svg.append("g").call(d3.axisLeft(y));

  const tooltip = d3.select(container).append("div")
    .style("position","absolute").style("pointer-events","none")
    .style("background","white").style("border","1px solid #aaa")
    .style("padding","4px 8px").style("opacity",0);

  svg.selectAll("rect").data(data).join("rect")
    .attr("x", d=> x(d.year)!)
    .attr("y", d=> y(d.attribute)!)
    .attr("width", x.bandwidth()).attr("height", y.bandwidth())
    .style("fill", d=> color(d.corr))
    .style("stroke","#fff").style("stroke-width",1)
    .on("mouseover", (e, d) => {
      tooltip.style("opacity",1)
        .html("Year: <b>"+d.year+"</b><br/>Attr: <b>"+d.attribute+"</b><br/>r = <b>"+d.corr.toFixed(2)+"</b>")
        .style("left", e.pageX+"px").style("top", e.pageY+"px");
    })
    .on("mouseout", ()=> tooltip.style("opacity",0));
}