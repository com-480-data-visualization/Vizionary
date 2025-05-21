import * as d3 from "d3"; // data-driven-document librairie
import { feature } from "topojson-client";

export async function drawMap(
  container: HTMLElement,
  sportKey: string,
  sex: "M" | "F" = "M"
) {

//Geo data
  const world = await d3.json(`statics/countries-110m.json`);
  const countries = feature(world as any, (world as any).objects.countries).features; // translation du JSON dans un format DOM 

  const width = 960;
  const height = 500;

  container.innerHTML = ""; 

  ///JSON 

  const resp: any = await d3.json(`/statics/${sportKey}.json`);
  const raw = Array.isArray(resp?.map) ? resp.map : [];
  if (!raw.length) return;
  container.innerHTML = "";

  // Si chaque ligne possède une clé `sex`, on filtre ; sinon on garde tout
  const data: { country: string; value: number }[] =
    "sex" in raw[0] ? raw.filter((d: any) => d.sex === sex) : raw;



/// JSON 

  const svg = d3.select(container)
    .append("svg") // equivalent to <svg></svg> but here dynamically
    .attr("width", width)
    .attr("height", height);


// dessin des pays sur la base du json des countries 
  const projection = d3.geoMercator().fitSize([width, height], {
    type: "FeatureCollection",
    features: countries,
  });

  const path = d3.geoPath().projection(projection);

  // Code to map the values to the countries
  const valueById = new Map(data.map(d => [d.country, d.value]));
  const maxVal = d3.max(data, d => d.value) ?? 1;

  const color = d3.scaleSequential() // créer un map entre une couleur et une valeur continue 
    .domain([0, maxVal])              // possible values to represent
    .interpolator(d3.interpolateBlues); // translation between the value and different shades of blue 

  svg.selectAll("path")
    .data(countries)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
      const val = valueById.get(d.properties.name) ?? 0;
      return color(val); // apply the scaleSequential we configure prior 
    })
    .attr("stroke", "#999")
    .append("title")
    .text(d => `Code: ${d.id}`);
}
