import pandas as pd
import os
import json
import kagglehub
from kagglehub import KaggleDatasetAdapter

# Load dataset
df = pd.read_csv('df_filtered.csv', sep=',')

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

# Build per-sport JSON
for sport, grp in df.groupby("Sport"):
    key = keyify(sport)
    out = {"sport": sport, "scatter": [], "heatmap": [], "bar": [],"map": []}

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

    #MAP 
    medal_only = grp[grp["Medal"] != "No Medal"]
    map_records = (
        medal_only.groupby(["Year", "Team", "Sex"]).size().reset_index(name="value")
    )
    out["map"] = [
        {
            "year": int(rec["Year"]),
            "country": rec["Team"],
            "sex": rec["Sex"],
            "value": int(rec["value"])
        }
        for rec in map_records.to_dict("records")
    ]

    #TREEMAP
    treemap_records = (
        grp.groupby(["Year", "Team", "Sex"])["ID"].nunique().reset_index(name="value")
    )
    out["treemap"] = [
        {
            "year": int(rec["Year"]),
            "country": rec["Team"],
            "sex": rec["Sex"],
            "value": int(rec["value"])
        }
        for rec in treemap_records.to_dict("records")
    ]

    #EXPORT
    with open(f"{out_dir}/{key}.json","w") as f:
        json.dump(clean(out), f, indent=2)
        
print("done")