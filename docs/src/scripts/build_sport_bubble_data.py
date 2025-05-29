import pandas as pd
import os
import json


# Load data
df = pd.read_csv("src/data/df_filtered.csv")

# Replace missing medals
df["Medal"] = df["Medal"].fillna("No Medal")

# Where to write JSON
out_dir = "static/statics"
os.makedirs(out_dir, exist_ok=True)

# Compute summary per sport
bubble_data = []

for sport, grp in df.groupby("Sport"):
    athletes = grp["ID"].nunique()
    countries = grp["NOC"].nunique()
    medals = grp[grp["Medal"] != "No Medal"].shape[0]

    bubble_data.append({
        "name": sport,
        "participants": int(athletes),
        "countries": int(countries),
        "medals": int(medals)
    })

# Sort by participation
bubble_data.sort(key=lambda x: -x["participants"])

print("✅ Writing", len(bubble_data), "entries to:", os.path.join(out_dir, "sport_bubble_data.json"))


# Write to JSON
with open(f"{out_dir}/sport_bubble_data.json", "w") as f:
    json.dump(bubble_data, f, indent=2)