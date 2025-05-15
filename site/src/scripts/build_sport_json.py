#!/usr/bin/env python3
import pandas as pd
import os
import json
import kagglehub
from kagglehub import KaggleDatasetAdapter
from pathlib import Path

# 1) Load
df = kagglehub.dataset_load(
    KaggleDatasetAdapter.PANDAS,
    "heesoo37/120-years-of-olympic-history-athletes-and-results",
    "athlete_events.csv"
)
df["Medal"] = df["Medal"].fillna("No Medal")
df["Year"] = df["Year"].astype(int)

# 2) Setup
out_dir = Path("static/statics")
out_dir.mkdir(parents=True, exist_ok=True)

attrs  = ["Age","Height","Weight"]
medals = ["Gold","Silver","Bronze","No Medal"]
sexes  = ["M","F"]

def keyify(s: str) -> str:
    return s.lower().replace(" ","_")

def clean(x):
    if isinstance(x, float) and pd.isna(x): return None
    if isinstance(x, dict): return {k: clean(v) for k,v in x.items()}
    if isinstance(x, list): return [clean(v) for v in x]
    return x

# 3) Emit per‐sport
for sport, grp in df.groupby("Sport", sort=False):
    key = keyify(sport)
    out = {"sport": sport}

    # --- HEATMAP: same as before ---
    grp["Won"] = grp["Medal"]!="No Medal"
    heatmap = {s:{a.lower():{"year":[], "corr":[]} for a in attrs} for s in sexes}
    for (yr,sx), sub in grp.groupby(["Year","Sex"]):
        if len(sub) < 20: 
            continue
        for a in attrs:
            try:
                r = sub[["Won",a]].corr().loc["Won",a]
            except Exception:
                continue
            if pd.notna(r):
                heatmap[sx][a.lower()]["year"].append(int(yr))
                heatmap[sx][a.lower()]["corr"].append(round(float(r),3))
    out["heatmap"] = heatmap

    # --- BAR: only years with any data for that sex+attribute ---
    bar = {s:{a.lower():{"year":[], "medal":[], "value":[]} for a in attrs} for s in sexes}
    # first compute all year‐sex‐medal‐attr means
    means = []
    for (yr,sx,m), sub in grp.groupby(["Year","Sex","Medal"]):
        for a in attrs:
            if not sub[a].empty:
                mv = sub[a].mean()
                if pd.notna(mv):
                    means.append((sx, a.lower(), int(yr), m, round(float(mv),2)))
    # now reorganize per sex+attr, but only include years that appear here
    for sx, a, yr, m, v in means:
        blk = bar[sx][a]
        blk["year"].append(yr)
        blk["medal"].append(m)
        blk["value"].append(v)
    out["bar"] = bar

    # write
    dest = out_dir / f"{key}.json"
    with open(dest,"w") as f:
        json.dump(clean(out), f, indent=2)
