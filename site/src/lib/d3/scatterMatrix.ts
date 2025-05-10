import * as d3 from "d3";

export async function drawScatterMatrix(container: HTMLElement, sportKey: string,  sex: "M" | "F" = "F") {
  // load data
  const resp: any = await d3.json(`/statics/${sportKey}.json`);
  const raw = Array.isArray(resp?.scatter) ? resp.scatter : [];
  const data = raw.filter(d =>
    d.Height != null &&
    d.Weight != null &&
    d.Age != null &&
    d.Sex === sex // 👈 added
  );

  const columns = ["Height","Weight","Age"];
  const padding = 28;
  const size = 140;                // cell size
  const width = size * columns.length;

  // one scale per column
  const x = columns.map(c => d3.scaleLinear()
      .domain(d3.extent(data, d=>+d[c]) as [number,number])
      .range([padding/2, size-padding/2]));
  const y = x.map(s => s.copy().range([size-padding/2, padding/2]));

  // clear and svg
  container.innerHTML = "";
  const svg = d3.select(container).append("svg")
      .attr("width", width+padding)
      .attr("height", width+padding)
      .attr("viewBox", [-padding/2, -padding/2, width+padding, width+padding]);

  // axes
  const axisx = d3.axisBottom<number,number>().ticks(5).tickSize(size * columns.length);
  svg.append("g").call(g => g.selectAll("g")
    .data(x).join("g")
      .attr("transform", (_d,i)=>`translate(${i*size},0)`)
      .each(function(scale) { d3.select(this).call(axisx.scale(scale)); })
      .call(g=>g.select(".domain").remove())
      .call(g=>g.selectAll(".tick line").attr("stroke","#eee"))
  );

  const axisy = d3.axisLeft<number,number>().ticks(5).tickSize(-size * columns.length);
  svg.append("g").call(g => g.selectAll("g")
    .data(y).join("g")
      .attr("transform", (_d,i)=>`translate(0,${i*size})`)
      .each(function(scale) { d3.select(this).call(axisy.scale(scale)); })
      .call(g=>g.select(".domain").remove())
      .call(g=>g.selectAll(".tick line").attr("stroke","#eee"))
  );

  // cells
  const cell = svg.append("g").selectAll("g")
    .data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
    .join("g")
      .attr("transform", ([i,j])=>`translate(${i*size},${j*size})`);

  // frame
  cell.append("rect")
    .attr("x", padding/2+0.5).attr("y", padding/2+0.5)
    .attr("width", size-padding).attr("height", size-padding)
    .attr("fill","none").attr("stroke","#ccc");

  // points
  cell.each(function([i,j]) {
    d3.select(this).selectAll("circle")
      .data(data)
      .join("circle")
        .attr("cx", d=>x[i](d[columns[i]]))
        .attr("cy", d=>y[j](d[columns[j]]))
        .attr("r", 1.5)
        .attr("fill", d=> d.Medal==="Gold" ? "gold"
                          : d.Medal==="Silver" ? "silver"
                          : d.Medal==="Bronze" ? "peru" : "#bbb")
        .attr("opacity", 0.3);
  });

  const circles = cell.selectAll("circle");

  // diagonal labels
  svg.append("g").style("font","bold 10px sans-serif")
    .selectAll("text").data(columns).join("text")
      .attr("transform",(d,i)=>`translate(${i*size},${i*size})`)
      .attr("x", padding).attr("y", padding-4)
      .text(d=>d);

  // brushing
  let brushCell: any = null;
  const brush = d3.brush()
    .extent([[padding/2,padding/2],[size-padding/2,size-padding/2]])
    .on("start", function(this: any) {
      if (brushCell !== this) {
        d3.select(brushCell).call(brush.move, null);
        brushCell = this;
      }
    })
    .on("brush", function({selection}, [i,j]) {
      if (!selection) return;
      const [[x0,y0],[x1,y1]] = selection;
      circles.classed("hidden", (d:any)=>(
        x0 > x[i](d[columns[i]]) ||
        x1 < x[i](d[columns[i]]) ||
        y0 > y[j](d[columns[j]]) ||
        y1 < y[j](d[columns[j]])
      ));
      circles.classed("active", (d:any)=>!(
        x0 > x[i](d[columns[i]]) ||
        x1 < x[i](d[columns[i]]) ||
        y0 > y[j](d[columns[j]]) ||
        y1 < y[j](d[columns[j]])
      ));
    })
    .on("end", function({selection}) {
      if (!selection) circles.classed("hidden", false).classed("active", false);
    });

  cell.call(brush);

  // styles
  svg.append("style").text(`
    circle.hidden { opacity: 0.1 !important; }
    circle.active { r: 2 !important; opacity: 1 !important; }
  `);
}
