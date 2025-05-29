import pandas as pd
import os
import json
import kagglehub
from kagglehub import KaggleDatasetAdapter 

# Download the country-continent dataset
path = kagglehub.dataset_download("statchaitya/country-to-continent")
country_info_df = pd.read_csv(os.path.join(path, 'countryContinent.csv'), sep=',', encoding='unicode_escape')

# Load Olympic dataset
df = pd.read_csv('site/src/data/df_filtered.csv', sep=',')
df["Medal"] = df["Medal"].fillna("No Medal")

# Output directory for Svelte static
out_dir = "site/static/statics"
os.makedirs(out_dir, exist_ok=True)

# Define constants
attrs = ["Age", "Height", "Weight"]
medals = ["Gold", "Silver", "Bronze", "No Medal"]
sexes = ["M", "F"]

def keyify(s): return s.lower().replace(" ", "_")

def clean(obj):
    if isinstance(obj, float) and pd.isna(obj): return None
    if isinstance(obj, dict): return {k: clean(v) for k,v in obj.items()}
    if isinstance(obj, list): return [clean(v) for v in obj]
    return obj

# Create a mapping between NOC codes and ISO codes
# This manually maps Olympic NOC codes to ISO 3166-1 alpha-3 codes
noc_to_iso_map = {
    # Common mismatches between NOC and ISO codes
    "AFG": "AFG",  # Afghanistan
    "ALB": "ALB",  # Albania
    "ALG": "DZA",  # Algeria
    "AND": "AND",  # Andorra
    "ANG": "AGO",  # Angola
    "ANT": "ATG",  # Antigua and Barbuda
    "ARG": "ARG",  # Argentina
    "ARM": "ARM",  # Armenia
    "ARU": "ABW",  # Aruba
    "ASA": "ASM",  # American Samoa
    "AUS": "AUS",  # Australia
    "AUT": "AUT",  # Austria
    "AZE": "AZE",  # Azerbaijan
    "BAH": "BHS",  # Bahamas
    "BAN": "BGD",  # Bangladesh
    "BAR": "BRB",  # Barbados
    "BDI": "BDI",  # Burundi
    "BEL": "BEL",  # Belgium
    "BEN": "BEN",  # Benin
    "BER": "BMU",  # Bermuda
    "BHU": "BTN",  # Bhutan
    "BIH": "BIH",  # Bosnia and Herzegovina
    "BIZ": "BLZ",  # Belize
    "BLR": "BLR",  # Belarus
    "BOL": "BOL",  # Bolivia
    "BOT": "BWA",  # Botswana
    "BRA": "BRA",  # Brazil
    "BRN": "BRN",  # Bahrain
    "BRU": "BRN",  # Brunei
    "BUL": "BGR",  # Bulgaria
    "BUR": "BFA",  # Burkina Faso
    "CAF": "CAF",  # Central African Republic
    "CAM": "KHM",  # Cambodia
    "CAN": "CAN",  # Canada
    "CAY": "CYM",  # Cayman Islands
    "CGO": "COG",  # Republic of the Congo
    "CHA": "TCD",  # Chad
    "CHI": "CHL",  # Chile
    "CHN": "CHN",  # China
    "CIV": "CIV",  # Ivory Coast
    "CMR": "CMR",  # Cameroon
    "COD": "COD",  # DR Congo
    "COK": "COK",  # Cook Islands
    "COL": "COL",  # Colombia
    "COM": "COM",  # Comoros
    "CPV": "CPV",  # Cape Verde
    "CRC": "CRI",  # Costa Rica
    "CRO": "HRV",  # Croatia
    "CUB": "CUB",  # Cuba
    "CYP": "CYP",  # Cyprus
    "CZE": "CZE",  # Czech Republic
    "DEN": "DNK",  # Denmark
    "DJI": "DJI",  # Djibouti
    "DMA": "DMA",  # Dominica
    "DOM": "DOM",  # Dominican Republic
    "ECU": "ECU",  # Ecuador
    "EGY": "EGY",  # Egypt
    "ERI": "ERI",  # Eritrea
    "ESA": "SLV",  # El Salvador
    "ESP": "ESP",  # Spain
    "EST": "EST",  # Estonia
    "ETH": "ETH",  # Ethiopia
    "FIJ": "FJI",  # Fiji
    "FIN": "FIN",  # Finland
    "FRA": "FRA",  # France
    "FSM": "FSM",  # Micronesia
    "GAB": "GAB",  # Gabon
    "GAM": "GMB",  # Gambia
    "GBR": "GBR",  # Great Britain
    "GBS": "GNB",  # Guinea-Bissau
    "GEO": "GEO",  # Georgia
    "GEQ": "GNQ",  # Equatorial Guinea
    "GER": "DEU",  # Germany
    "GHA": "GHA",  # Ghana
    "GRE": "GRC",  # Greece
    "GRN": "GRD",  # Grenada
    "GUA": "GTM",  # Guatemala
    "GUI": "GIN",  # Guinea
    "GUM": "GUM",  # Guam
    "GUY": "GUY",  # Guyana
    "HAI": "HTI",  # Haiti
    "HKG": "HKG",  # Hong Kong
    "HON": "HND",  # Honduras
    "HUN": "HUN",  # Hungary
    "INA": "IDN",  # Indonesia
    "IND": "IND",  # India
    "IRI": "IRN",  # Iran
    "IRL": "IRL",  # Ireland
    "IRQ": "IRQ",  # Iraq
    "ISL": "ISL",  # Iceland
    "ISR": "ISR",  # Israel
    "ISV": "VIR",  # US Virgin Islands
    "ITA": "ITA",  # Italy
    "IVB": "VGB",  # British Virgin Islands
    "JAM": "JAM",  # Jamaica
    "JOR": "JOR",  # Jordan
    "JPN": "JPN",  # Japan
    "KAZ": "KAZ",  # Kazakhstan
    "KEN": "KEN",  # Kenya
    "KGZ": "KGZ",  # Kyrgyzstan
    "KIR": "KIR",  # Kiribati
    "KOR": "KOR",  # South Korea
    "KOS": "XKX",  # Kosovo
    "KSA": "SAU",  # Saudi Arabia
    "KUW": "KWT",  # Kuwait
    "LAO": "LAO",  # Laos
    "LAT": "LVA",  # Latvia
    "LBA": "LBY",  # Libya
    "LBN": "LBN",  # Lebanon
    "LBR": "LBR",  # Liberia
    "LCA": "LCA",  # Saint Lucia
    "LES": "LSO",  # Lesotho
    "LIE": "LIE",  # Liechtenstein
    "LTU": "LTU",  # Lithuania
    "LUX": "LUX",  # Luxembourg
    "MAD": "MDG",  # Madagascar
    "MAR": "MAR",  # Morocco
    "MAS": "MYS",  # Malaysia
    "MAW": "MWI",  # Malawi
    "MDA": "MDA",  # Moldova
    "MDV": "MDV",  # Maldives
    "MEX": "MEX",  # Mexico
    "MGL": "MNG",  # Mongolia
    "MHL": "MHL",  # Marshall Islands
    "MKD": "MKD",  # North Macedonia
    "MLI": "MLI",  # Mali
    "MLT": "MLT",  # Malta
    "MNE": "MNE",  # Montenegro
    "MON": "MCO",  # Monaco
    "MOZ": "MOZ",  # Mozambique
    "MRI": "MUS",  # Mauritius
    "MTN": "MRT",  # Mauritania
    "MYA": "MMR",  # Myanmar
    "NAM": "NAM",  # Namibia
    "NCA": "NIC",  # Nicaragua
    "NED": "NLD",  # Netherlands
    "NEP": "NPL",  # Nepal
    "NGR": "NGA",  # Nigeria
    "NIG": "NER",  # Niger
    "NOR": "NOR",  # Norway
    "NRU": "NRU",  # Nauru
    "NZL": "NZL",  # New Zealand
    "OMA": "OMN",  # Oman
    "PAK": "PAK",  # Pakistan
    "PAN": "PAN",  # Panama
    "PAR": "PRY",  # Paraguay
    "PER": "PER",  # Peru
    "PHI": "PHL",  # Philippines
    "PLE": "PSE",  # Palestine
    "PLW": "PLW",  # Palau
    "PNG": "PNG",  # Papua New Guinea
    "POL": "POL",  # Poland
    "POR": "PRT",  # Portugal
    "PRK": "PRK",  # North Korea
    "PUR": "PRI",  # Puerto Rico
    "QAT": "QAT",  # Qatar
    "ROU": "ROU",  # Romania
    "RSA": "ZAF",  # South Africa
    "RUS": "RUS",  # Russia
    "RWA": "RWA",  # Rwanda
    "SAM": "WSM",  # Samoa
    "SEN": "SEN",  # Senegal
    "SEY": "SYC",  # Seychelles
    "SIN": "SGP",  # Singapore
    "SKN": "KNA",  # Saint Kitts and Nevis
    "SLE": "SLE",  # Sierra Leone
    "SLO": "SVN",  # Slovenia
    "SMR": "SMR",  # San Marino
    "SOL": "SLB",  # Solomon Islands
    "SOM": "SOM",  # Somalia
    "SRB": "SRB",  # Serbia
    "SRI": "LKA",  # Sri Lanka
    "SSD": "SSD",  # South Sudan
    "STP": "STP",  # São Tomé and Príncipe
    "SUD": "SDN",  # Sudan
    "SUI": "CHE",  # Switzerland
    "SUR": "SUR",  # Suriname
    "SVK": "SVK",  # Slovakia
    "SWE": "SWE",  # Sweden
    "SWZ": "SWZ",  # Eswatini
    "SYR": "SYR",  # Syria
    "TAN": "TZA",  # Tanzania
    "TGA": "TON",  # Tonga
    "THA": "THA",  # Thailand
    "TJK": "TJK",  # Tajikistan
    "TKM": "TKM",  # Turkmenistan
    "TLS": "TLS",  # East Timor
    "TOG": "TGO",  # Togo
    "TPE": "TWN",  # Chinese Taipei
    "TTO": "TTO",  # Trinidad and Tobago
    "TUN": "TUN",  # Tunisia
    "TUR": "TUR",  # Turkey
    "TUV": "TUV",  # Tuvalu
    "UAE": "ARE",  # United Arab Emirates
    "UGA": "UGA",  # Uganda
    "UKR": "UKR",  # Ukraine
    "URU": "URY",  # Uruguay
    "USA": "USA",  # United States
    "UZB": "UZB",  # Uzbekistan
    "VAN": "VUT",  # Vanuatu
    "VEN": "VEN",  # Venezuela
    "VIE": "VNM",  # Vietnam
    "VIN": "VCT",  # Saint Vincent and the Grenadines
    "YEM": "YEM",  # Yemen
    "ZAM": "ZMB",  # Zambia
    "ZIM": "ZWE",  # Zimbabwe
    # Add historical countries if needed
    "URS": "SUN",  # Soviet Union
    "TCH": "CSK",  # Czechoslovakia
    "YUG": "YUG",  # Yugoslavia
    "FRG": "DEU",  # West Germany
    "GDR": "DDR",  # East Germany
}

# Build per-sport JSON
for sport, grp in df.groupby("Sport"):
    key = keyify(sport)
    out = {"sport": sport, "scatter": [], "heatmap": [], "bar": [], "map": [], "treemap": []}

    # scatter: keep Sex so we can filter client‑side
    out["scatter"] = grp[["Year","Sex"] + attrs + ["Medal"]].to_dict(orient="records")

    # heatmap: corr by year/sex/attr
    grp["Won"] = grp["Medal"]!="No Medal"
    hm = []
    for (yr, sx), sub in grp.groupby(["Year","Sex"]):
        if len(sub) < 20: continue
        for a in attrs:
            r = sub[["Won",a]].corr().loc["Won",a]
            hm.append({"year":int(yr),"sex":sx,"attribute":a.lower(),"corr": None if pd.isna(r) else round(r,3)})
    out["heatmap"] = hm

    # grouped bar: avg by year/sex/medal/attr
    bars = []
    for yr, sub in grp.groupby("Year"):
        for sx in sexes:
            for m in medals:
                seg = sub[(sub.Sex==sx)&(sub.Medal==m)]
                for a in attrs:
                    bars.append({
                        "year":int(yr),
                        "sex":sx,
                        "medal":m,
                        "attribute":a.lower(),
                        "value": None if seg[a].empty else round(seg[a].mean(),2)
                    })
    out["bar"] = bars
    
    # Add ISO-3 code to the dataframe based on NOC
    grp['ISO_3'] = grp['NOC'].map(noc_to_iso_map)
    
    # Now merge with country_info_df using the mapped ISO-3 code
    grp_with_country_info = pd.merge(
        grp,
        country_info_df,
        left_on='ISO_3',
        right_on='code_3',
        how='left'
    )
    
    # MAP - Updated to include isonumeric code    
    map_records = (
        grp_with_country_info.groupby(["Year", "Team", "NOC", "country_code", "Sex", "Medal"]).size().reset_index(name="value")
    )
    
    # Create map records with formatted isonumeric code
    out["map"] = [
        {
            "year": int(rec["Year"]),
            "country": rec["Team"],
            "noc": rec["NOC"],
            "iso_numeric": str(int(rec["country_code"])).zfill(3) if pd.notna(rec["country_code"]) else None,
            "sex": rec["Sex"],
            "medal": rec["Medal"],
            "value": int(rec["value"])
        }
        for rec in map_records.to_dict("records")
    ]

    # TREEMAP - Updated logic
    treemap_records = (
        grp_with_country_info.groupby(["Year", "Team", "NOC", "continent", "country_code", "Sex"])["ID"].nunique().reset_index(name="value")
    )
    
    # Create treemap records with formatted isonumeric code
    out["treemap"] = [
        {
            "year": int(rec["Year"]),
            "country": rec["Team"],
            "noc": rec["NOC"],
            "continent": rec["continent"],
            "iso_numeric": str(int(rec["country_code"])).zfill(3) if pd.notna(rec["country_code"]) else None,
            "sex": rec["Sex"],
            "value": int(rec["value"])
        }
        for rec in treemap_records.to_dict("records")
    ]

    # EXPORT
    with open(f"{out_dir}/{key}.json","w") as f:
        json.dump(clean(out), f, indent=2)

print("JSON files successfully created!")