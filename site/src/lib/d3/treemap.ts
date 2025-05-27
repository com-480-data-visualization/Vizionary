import * as d3 from "d3";
import { json } from "d3-fetch";

/**
 * Treemap choropleth – version inspirée du code drawMap
 * ------------------------------------------------------
 * Charge le fichier JSON généré côté Python (/statics/<sportKey>.json),
 * extrait la clé `treemap`, filtre/agrège par genre si demandé, puis construit
 * un treemap coloré par continent.
 *
 * @param container  <HTMLElement>  Élément cible (ex : <div bind:this={el} />)
 * @param sportKey   string         Nom de fichier ("swimming" → swimming.json)
 * @param sex        "M" | "F" | "all"   Filtre facultatif (défaut : "all")
 */
export async function drawTreemap(
  container: HTMLElement,
  sportKey: string,
  sex: "M" | "F" | "all" = "all",
  {
    minShare = 0.02,   // 2 % du total minimum pour être « majeur »
    maxShown = 15      // on n'affiche jamais plus de 15 rectangles
  } = {}
) {
  /* ------------------------------------------------------------------ */
  /* 1. Chargement JSON                                                 */
  /* ------------------------------------------------------------------ */
  const resp: any = await d3.json(`/statics/${sportKey}.json`);
  const raw = Array.isArray(resp?.treemap) ? resp.treemap : [];
  if (!raw.length) {
    console.warn(`⛔ Aucune donnée treemap trouvée pour ${sportKey}`);
    return;
  }

  // Filtre par sexe si la clé existe et que l'utilisateur ne souhaite qu'un genre
  const filtered: { country: string; sex?: string; value: number }[] =
    "sex" in raw[0] && sex !== "all" ? raw.filter((d: any) => d.sex === sex) : raw;

  /* ------------------------------------------------------------------ */
  /* 2. Agrégation par pays (utile si on ne filtre pas par sexe)        */
  /* ------------------------------------------------------------------ */
  const byCountry = new Map<string, number>();
  for (const rec of filtered) {
    byCountry.set(rec.country, (byCountry.get(rec.country) ?? 0) + rec.value);
  }

  const total = d3.sum(Array.from(byCountry.values()));
  const sorted = Array.from(byCountry, ([country, athletes]) => ({ country, athletes }))
    .sort((a, b) => b.athletes - a.athletes);

  const majors: { country: string; athletes: number }[] = [];
  let othersAthletes = 0;

  for (const rec of sorted) {
    const share = rec.athletes / total;
    if (majors.length < maxShown && share >= minShare) {
      majors.push(rec);                // on garde ce pays
    } else {
      othersAthletes += rec.athletes;  // on l'agrège dans « Rest »
    }
  }

  if (othersAthletes) {
    majors.push({ country: "Rest of the World", athletes: othersAthletes });
  }
  /* ------------------------------------------------------------------ */
  /* 3. Appariement continent → couleur                                 */
  /* ------------------------------------------------------------------ */

  const CONTINENTS = [
    "Africa", "Asia", "Europe",
    "North America", "South America",
    "Oceania",
  ] as const;
  type Continent = typeof CONTINENTS[number];
  type Region = Continent | "Other";

  const continentOf = await json<Record<string, Continent>>(
    "/statics/front/continents.json"
  );

  const data = majors.map(({ country, athletes }) => ({
    country,
    athletes,
    // « Rest of the World » n’est dans aucun continent : on le met en "Other"
    region: continentOf?.[country] ?? "Other" as Region,
  }));


  /* ------------------------------------------------------------------ */
  /* 4. Dimension + reset container                                     */
  /* ------------------------------------------------------------------ */
  const width = 960;
  const height = 500;
  container.innerHTML = "";

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("max-width", "100%");

  /* ------------------------------------------------------------------ */
  /* 5. Hiérarchie & mise en page treemap                               */
  /* ------------------------------------------------------------------ */
  const root = d3
    .hierarchy({ name: "root", children: data } as any)
    .sum((d: any) => d.athletes)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  d3
    .treemap<any>()
    .size([width, height])
    .paddingInner(2)(root);

  /* ------------------------------------------------------------------ */
  /* 6. Palette par continent                                           */
  /* ------------------------------------------------------------------ */
  const regionColor = new Map<string, string>([
    ["Europe", "#2C7BD1"],
    ["Americas", "#D72626"],
    ["Asia", "#F2C53D"],
    ["South America", "#F26B83"],
    ["Oceania", "#3DB96B"],
    ["Africa", "#9E5CF2"],
    ["Other", "#E8E5DA"],
  ]);

  /* ------------------------------------------------------------------ */
  /* 7. Dessin des rectangles + textes                                   */
  /* ------------------------------------------------------------------ */
  const nodes = svg
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  /* --- rectangles --- */
  nodes.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => {
      const base = regionColor.get((d.data as any).region) ?? "#ccc";
      const parentVal = d.parent?.value ?? d.value!;
      const ratio = Math.min(1, (d.value! / parentVal) * 2);
      return d3.color(base)!.brighter(1 - ratio).formatHex();
    })
    .attr("stroke", "#fff");

  /* --- clipPath pour enfermer le texte --- */
  nodes.append("clipPath")
      .attr("id", (d,i) => `clip-${i}`)
    .append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);

  const LABEL_PAD  = 4;     // marge interne
  const MIN_AREA   = 3_000; // px²

  const labels = nodes.filter(d => (d.x1-d.x0)*(d.y1-d.y0) >= MIN_AREA);

  labels.each(function (d, i) {
    const g   = d3.select(this);
    const w   = d.x1 - d.x0;
    const h   = d.y1 - d.y0;
    const side= Math.min(w, h);          // côté le plus court
    const fs1 = Math.min(24, side / 5);  // police « Pays »
    const fs2 = fs1 * 0.8;               // police « athlètes »
    const lh  = fs1 * 1.1;               // line-height

    /* pays ------------------------------------------------------------ */
    g.append("text")
    .attr("clip-path", `url(#clip-${i})`)
    .attr("x", LABEL_PAD)
    .attr("y", LABEL_PAD + fs1)         // première ligne = padding + taille de police
    .style("font-weight", 700)
    .style("font-size", `${fs1}px`)
    .text((d) => (d.data as any).country);

    /* valeur ---------------------------------------------------------- */
    g.append("text")
    .attr("clip-path", `url(#clip-${i})`)
    .attr("x", LABEL_PAD)
    .attr("y", LABEL_PAD + fs1 + lh)    // deuxième ligne = ligne 1 + interligne
    .style("font-style", "italic")
    .style("font-size", `${fs2}px`)
    .text((d) => `${d.value as number} athlètes`);
  });

}


        