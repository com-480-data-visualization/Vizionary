import * as d3 from "d3";

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
  sex: "M" | "F" | "all" = "all"
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

  /* ------------------------------------------------------------------ */
  /* 3. Appariement continent → couleur                                 */
  /* ------------------------------------------------------------------ */
/**
 * Continent par pays (liste quasi-exhaustive, mai 2025)
 * Clés en anglais pour la cohérence, mais vous pouvez bien sûr
 * y ajouter des traductions/localisations si besoin.
 */
const continentOf: Record<string, "Africa" | "Asia" | "Europe" | "North America" | "South America" | "Oceania" | "Antarctica"> = {
  /* AFRICA (54) */
  "Algeria": "Africa",
  "Angola": "Africa",
  "Benin": "Africa",
  "Botswana": "Africa",
  "Burkina Faso": "Africa",
  "Burundi": "Africa",
  "Cabo Verde": "Africa",
  "Cameroon": "Africa",
  "Central African Republic": "Africa",
  "Chad": "Africa",
  "Comoros": "Africa",
  "Democratic Republic of the Congo": "Africa",
  "DR Congo": "Africa",
  "Republic of the Congo": "Africa",
  "Côte d'Ivoire": "Africa",
  "Ivory Coast": "Africa",
  "Djibouti": "Africa",
  "Egypt": "Africa",
  "Equatorial Guinea": "Africa",
  "Eritrea": "Africa",
  "Eswatini": "Africa",
  "Swaziland": "Africa",
  "Ethiopia": "Africa",
  "Gabon": "Africa",
  "Gambia": "Africa",
  "Ghana": "Africa",
  "Guinea": "Africa",
  "Guinea-Bissau": "Africa",
  "Kenya": "Africa",
  "Lesotho": "Africa",
  "Liberia": "Africa",
  "Libya": "Africa",
  "Madagascar": "Africa",
  "Malawi": "Africa",
  "Mali": "Africa",
  "Mauritania": "Africa",
  "Mauritius": "Africa",
  "Morocco": "Africa",
  "Mozambique": "Africa",
  "Namibia": "Africa",
  "Niger": "Africa",
  "Nigeria": "Africa",
  "Rwanda": "Africa",
  "São Tomé and Príncipe": "Africa",
  "Senegal": "Africa",
  "Seychelles": "Africa",
  "Sierra Leone": "Africa",
  "Somalia": "Africa",
  "South Africa": "Africa",
  "South Sudan": "Africa",
  "Sudan": "Africa",
  "Tanzania": "Africa",
  "Togo": "Africa",
  "Tunisia": "Africa",
  "Uganda": "Africa",
  "Zambia": "Africa",
  "Zimbabwe": "Africa",

  /* ASIA (50 + territoires) */
  "Afghanistan": "Asia",
  "Armenia": "Asia",               // géopol. Eurasie, rangé ici
  "Azerbaijan": "Asia",
  "Bahrain": "Asia",
  "Bangladesh": "Asia",
  "Bhutan": "Asia",
  "Brunei": "Asia",
  "Cambodia": "Asia",
  "China": "Asia",
  "People's Republic of China": "Asia",
  "Cyprus": "Asia",                // membre UE mais géograph. Asie
  "Georgia": "Asia",
  "India": "Asia",
  "Indonesia": "Asia",
  "Iran": "Asia",
  "Iraq": "Asia",
  "Israel": "Asia",
  "Japan": "Asia",
  "Jordan": "Asia",
  "Kazakhstan": "Asia",
  "Kuwait": "Asia",
  "Kyrgyzstan": "Asia",
  "Laos": "Asia",
  "Lebanon": "Asia",
  "Malaysia": "Asia",
  "Maldives": "Asia",
  "Mongolia": "Asia",
  "Myanmar": "Asia",
  "Burma": "Asia",
  "Nepal": "Asia",
  "North Korea": "Asia",
  "Democratic People's Republic of Korea": "Asia",
  "Oman": "Asia",
  "Pakistan": "Asia",
  "Palestine": "Asia",
  "Philippines": "Asia",
  "Qatar": "Asia",
  "Saudi Arabia": "Asia",
  "Singapore": "Asia",
  "South Korea": "Asia",
  "Republic of Korea": "Asia",
  "Sri Lanka": "Asia",
  "Syria": "Asia",
  "Taiwan": "Asia",
  "Thailand": "Asia",
  "Timor-Leste": "Asia",
  "Tajikistan": "Asia",
  "Turkey": "Asia",                // la majorité du territoire
  "Turkmenistan": "Asia",
  "United Arab Emirates": "Asia",
  "UAE": "Asia",
  "Uzbekistan": "Asia",
  "Vietnam": "Asia",
  "Yemen": "Asia",

  /* EUROPE (44) */
  "Albania": "Europe",
  "Andorra": "Europe",
  "Austria": "Europe",
  "Belarus": "Europe",
  "Belgium": "Europe",
  "Bosnia and Herzegovina": "Europe",
  "Bulgaria": "Europe",
  "Croatia": "Europe",
  "Czech Republic": "Europe",
  "Czechia": "Europe",
  "Denmark": "Europe",
  "Estonia": "Europe",
  "Finland": "Europe",
  "France": "Europe",
  "Germany": "Europe",
  "Greece": "Europe",
  "Hungary": "Europe",
  "Iceland": "Europe",
  "Ireland": "Europe",
  "Italy": "Europe",
  "Kosovo": "Europe",
  "Latvia": "Europe",
  "Liechtenstein": "Europe",
  "Lithuania": "Europe",
  "Luxembourg": "Europe",
  "Malta": "Europe",
  "Moldova": "Europe",
  "Monaco": "Europe",
  "Montenegro": "Europe",
  "Netherlands": "Europe",
  "North Macedonia": "Europe",
  "Norway": "Europe",
  "Poland": "Europe",
  "Portugal": "Europe",
  "Romania": "Europe",
  "Russia": "Europe",              // partie principale en Eurasie
  "San Marino": "Europe",
  "Serbia": "Europe",
  "Slovakia": "Europe",
  "Slovenia": "Europe",
  "Spain": "Europe",
  "Sweden": "Europe",
  "Switzerland": "Europe",
  "Ukraine": "Europe",
  "United Kingdom": "Europe",
  "Great Britain": "Europe",
  "Vatican City": "Europe",
  "Holy See": "Europe",

  /* NORTH AMERICA (23) */
  "Antigua and Barbuda": "North America",
  "Bahamas": "North America",
  "Barbados": "North America",
  "Belize": "North America",
  "Canada": "North America",
  "Costa Rica": "North America",
  "Cuba": "North America",
  "Dominica": "North America",
  "Dominican Republic": "North America",
  "El Salvador": "North America",
  "Grenada": "North America",
  "Guatemala": "North America",
  "Haiti": "North America",
  "Honduras": "North America",
  "Jamaica": "North America",
  "Mexico": "North America",
  "Nicaragua": "North America",
  "Panama": "North America",
  "Saint Kitts and Nevis": "North America",
  "Saint Lucia": "North America",
  "Saint Vincent and the Grenadines": "North America",
  "Trinidad and Tobago": "North America",
  "United States": "North America",
  "USA": "North America",

  /* SOUTH AMERICA (12) */
  "Argentina": "South America",
  "Bolivia": "South America",
  "Brazil": "South America",
  "Chile": "South America",
  "Colombia": "South America",
  "Ecuador": "South America",
  "Guyana": "South America",
  "Paraguay": "South America",
  "Peru": "South America",
  "Suriname": "South America",
  "Uruguay": "South America",
  "Venezuela": "South America",

  /* OCEANIA (14) */
  "Australia": "Oceania",
  "Fiji": "Oceania",
  "Kiribati": "Oceania",
  "Marshall Islands": "Oceania",
  "Micronesia": "Oceania",
  "Nauru": "Oceania",
  "New Zealand": "Oceania",
  "Palau": "Oceania",
  "Papua New Guinea": "Oceania",
  "Samoa": "Oceania",
  "Solomon Islands": "Oceania",
  "Tonga": "Oceania",
  "Tuvalu": "Oceania",
  "Vanuatu": "Oceania",

  /* ANTARCTICA (territoires sans population permanente) */
  "Antarctica": "Antarctica"
};


  const data = Array.from(byCountry, ([country, athletes]) => ({
    country,
    athletes,
    region: continentOf[country] ?? "Other",
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
    ["North America", "#D72626"],
    ["Asia", "#F2C53D"],
    ["South America", "#F26B83"],
    ["Oceania", "#3DB96B"],
    ["Africa", "#9E5CF2"],
    ["Other", "#8C8C8C"],
  ]);

  /* ------------------------------------------------------------------ */
  /* 7. Dessin des rectangles + textes                                   */
  /* ------------------------------------------------------------------ */
  const nodes = svg
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  // Rectangles
  nodes
    .append("rect")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill", (d) => {
      const base = regionColor.get((d.data as any).region) ?? "#ccc";
      const parentVal = d.parent?.value ?? d.value!;
      const ratio = Math.min(1, (d.value! / parentVal) * 2);
      return d3.color(base)!.brighter(1 - ratio).formatHex();
    })
    .attr("stroke", "#fff");

  // Textes
  const pad = 4;
  nodes
    .append("text")
    .attr("x", pad)
    .attr("y", 18)
    .style("font-weight", "700")
    .style("font-size", "clamp(12px,0.9vw,24px)")
    .text((d) => (d.data as any).country);

  nodes
    .append("text")
    .attr("x", pad)
    .attr("y", 36)
    .style("font-style", "italic")
    .style("font-size", "clamp(10px,0.7vw,18px)")
    .text((d) => `${d.value as number} athlètes`);
}
