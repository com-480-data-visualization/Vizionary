
import pandas as pd

import os

import json

import kagglehub

from kagglehub import KaggleDatasetAdapter 

# Download the dataset
path = kagglehub.dataset_download("statchaitya/country-to-continent")

# Load the country-to-continent dataset
country_info_df = pd.read_csv(os.path.join(path, 'countryContinent.csv'), sep=',', encoding='unicode_escape')

# Display the first few rows and columns to understand its structure
print(country_info_df.head())
print(country_info_df.columns)

# Original code snippet as provided by the user, with modifications for 'map' and 'treemap'

# Load dataset
df = pd.read_csv('site/src/data/df_filtered.csv', sep=',')

# Fill missing medals
df["Medal"] = df["Medal"].fillna("No Medal")

# Output directory for Svelte static
out_dir = "site/static/statics"
os.makedirs(out_dir, exist_ok=True)

# Attributes, medals, sexes
attrs = ["Age", "Height", "Weight"]
medals = ["Gold", "Silver", "Bronze", "No Medal"]
sexes = ["M", "F"]

def keyify(s): return s.lower().replace(" ", "_")

def clean(obj):
    if isinstance(obj, float) and pd.isna(obj): return None
    if isinstance(obj, dict): return {k: clean(v) for k,v in obj.items()}
    if isinstance(obj, list): return [clean(v) for v in obj]
    return obj

# Prepare the country information for merging
# Assuming 'Country' in country_info_df maps to 'Team' in df, and 'Alpha-3 code' is NOC
country_info_df_merged = country_info_df[['country', 'code_3', 'continent']]
country_info_df_merged.rename(columns={'country': 'Team', 'code_3': 'NOC'}, inplace=True)

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
    
    # MAP - Updated logic
    map_records = (
        grp.groupby(["Year", "Team", "Sex", "Medal"]).size().reset_index(name="value")
    )
    out["map"] = [
        {
            "year": int(rec["Year"]),
            "country": rec["Team"],
            "sex": rec["Sex"],
            "medal": rec["Medal"],
            "value": int(rec["value"])
        }
        for rec in map_records.to_dict("records")
    ]

    # TREEMAP - Updated logic
    # Merge country info with the current sport group
    grp_with_country_info = grp.merge(country_info_df_merged, on="Team", how="left")

    # print(grp_with_country_info.head())

    treemap_records = (
        grp_with_country_info.groupby(["Year", "Team", "NOC_x", "continent", "Sex"])["ID"].nunique().reset_index(name="value")
    )
    out["treemap"] = [
        {
            "year": int(rec["Year"]),
            "country": rec["Team"],
            "noc": rec["NOC_x"],
            "continent": rec["continent"],
            "sex": rec["Sex"],
            "value": int(rec["value"])
        }
        for rec in treemap_records.to_dict("records")
    ]

    #EXPORT
    with open(f"{out_dir}/{key}.json","w") as f:
        json.dump(clean(out), f, indent=2)

print("done")