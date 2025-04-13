#!/usr/bin/env python3
"""
Script to create simplified test data for the Olympic visualization
"""

import os
import json
import random

# Create data directory if it doesn't exist
if not os.path.exists('data'):
    os.makedirs('data')

# Create simplified Olympic bubbles data
olympic_bubbles = []
years = list(range(1900, 2017, 4))

for year in years:
    # Alternate between Summer and Winter Olympics
    season = "Summer" if year % 8 == 0 else "Winter"
    city = random.choice(["London", "Paris", "Berlin", "Rome", "Tokyo", "Beijing", "Sydney", "Rio"])
    
    olympic_bubbles.append({
        "year": year,
        "season": season,
        "city": city,
        "total_athletes": random.randint(1000, 10000),
        "total_events": random.randint(50, 300),
        "total_countries": random.randint(20, 200),
        "analyzed_events": random.randint(10, 50),
        "significant_events": random.randint(1, 10),
        "genetic_impact_ratio": random.uniform(0.1, 0.8)
    })

# Create simplified Olympic genetics data
olympic_genetics_data = {}

for bubble in olympic_bubbles:
    year = str(bubble["year"])
    olympic_genetics_data[year] = {
        "sports": {},
        "total_athletes": bubble["total_athletes"],
        "total_events": bubble["total_events"],
        "total_countries": bubble["total_countries"],
        "season": bubble["season"],
        "city": bubble["city"]
    }
    
    # Add some sports
    sports = ["Swimming", "Athletics", "Basketball", "Gymnastics", "Cycling"]
    
    for sport in sports:
        olympic_genetics_data[year]["sports"][sport] = {
            "events": {},
            "total_athletes": random.randint(100, 500),
            "total_events": random.randint(5, 20),
            "total_countries": random.randint(10, 50)
        }
        
        # Add some events
        events = []
        if sport == "Swimming":
            events = ["Men's 100m Freestyle", "Women's 100m Freestyle"]
        elif sport == "Athletics":
            events = ["Men's 100m", "Women's 100m"]
        elif sport == "Basketball":
            events = ["Men's Basketball", "Women's Basketball"]
        elif sport == "Gymnastics":
            events = ["Men's Floor Exercise", "Women's Floor Exercise"]
        elif sport == "Cycling":
            events = ["Men's Road Race", "Women's Road Race"]
        
        for event in events:
            # Create some random genetic data
            significant = random.choice([True, False])
            
            # Generate sample distributions
            medalist_height = [random.normalvariate(180, 10) for _ in range(30)]
            non_medalist_height = [random.normalvariate(175, 12) for _ in range(70)]
            medalist_weight = [random.normalvariate(75, 8) for _ in range(30)]
            non_medalist_weight = [random.normalvariate(72, 10) for _ in range(70)]
            medalist_age = [random.normalvariate(26, 3) for _ in range(30)]
            non_medalist_age = [random.normalvariate(24, 4) for _ in range(70)]
            
            olympic_genetics_data[year]["sports"][sport]["events"][event] = {
                "total_athletes": random.randint(20, 100),
                "total_medalists": random.randint(3, 10),
                "height": {
                    "medalist_mean": sum(medalist_height) / len(medalist_height),
                    "non_medalist_mean": sum(non_medalist_height) / len(non_medalist_height),
                    "significant": significant,
                    "p_value": random.uniform(0.001, 0.1),
                    "medalist_dist": medalist_height,
                    "non_medalist_dist": non_medalist_height
                },
                "weight": {
                    "medalist_mean": sum(medalist_weight) / len(medalist_weight),
                    "non_medalist_mean": sum(non_medalist_weight) / len(non_medalist_weight),
                    "significant": significant,
                    "p_value": random.uniform(0.001, 0.1),
                    "medalist_dist": medalist_weight,
                    "non_medalist_dist": non_medalist_weight
                },
                "age": {
                    "medalist_mean": sum(medalist_age) / len(medalist_age),
                    "non_medalist_mean": sum(non_medalist_age) / len(non_medalist_age),
                    "significant": significant,
                    "p_value": random.uniform(0.001, 0.1),
                    "medalist_dist": medalist_age,
                    "non_medalist_dist": non_medalist_age
                },
                "most_significant_factor": random.choice(["height", "weight", "age"]),
                "most_significant_p_value": random.uniform(0.001, 0.1),
                "is_significant": significant
            }

# Create simplified sport summary data
sport_summary = {}

for sport in ["Swimming", "Athletics", "Basketball", "Gymnastics", "Cycling"]:
    significant = random.choice([True, False])
    
    sport_summary[sport] = {
        "most_significant_factor": random.choice(["height", "weight", "age"]) if significant else None,
        "p_value": random.uniform(0.001, 0.1) if significant else None,
        "is_significant": significant,
        "total_athletes": random.randint(1000, 5000),
        "total_medalists": random.randint(100, 500)
    }

# Save the data as JSON
with open('data/olympic_bubbles.json', 'w') as f:
    json.dump(olympic_bubbles, f, indent=2)
    
with open('data/olympic_genetics_data.json', 'w') as f:
    json.dump(olympic_genetics_data, f, indent=2)
    
with open('data/sport_summary.json', 'w') as f:
    json.dump(sport_summary, f, indent=2)

print("Simple test data created successfully!")
print("- olympic_bubbles.json: Simplified data for Olympic Games bubbles")
print("- olympic_genetics_data.json: Simplified data for Olympic genetics analysis")
print("- sport_summary.json: Simplified data for sport summary")