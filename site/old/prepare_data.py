#!/usr/bin/env python3
"""
Data preparation script for the Olympic visualization.
This script processes the Olympic dataset and generates the necessary JSON files
for the visualization.
"""

import os
import json
import pandas as pd
import numpy as np
from scipy import stats

# Check if data directory exists
data_dir = 'data'
if not os.path.exists(data_dir):
    os.makedirs(data_dir)

# Attempt to load data
try:
    import kagglehub
    from kagglehub import KaggleDatasetAdapter
    
    print("Loading data from Kaggle...")
    df = kagglehub.dataset_load(
        KaggleDatasetAdapter.PANDAS, 
        "heesoo37/120-years-of-olympic-history-athletes-and-results", 
        'athlete_events.csv'
    )
    print("Data loaded successfully!")
except Exception as e:
    print(f"Error loading data from Kaggle: {e}")
    print("Checking for local CSV file...")
    
    # Try loading from local file
    if os.path.exists('data/athlete_events.csv'):
        df = pd.read_csv('data/athlete_events.csv')
        print("Data loaded from local file.")
    else:
        print("Could not load data. Generating sample dataset for demonstration...")
        
        # Create a sample dataset for demonstration
        np.random.seed(42)  # For reproducibility
        
        # Generate sample data
        sample_size = 10000
        years = np.random.choice(range(1900, 2017, 4), sample_size)
        sports = np.random.choice(['Basketball', 'Swimming', 'Athletics', 'Gymnastics', 'Football', 
                                   'Tennis', 'Volleyball', 'Cycling', 'Weightlifting', 'Rowing'], sample_size)
        events = []
        for sport in sports:
            if sport == 'Basketball':
                events.append(np.random.choice(["Men's Basketball", "Women's Basketball"]))
            elif sport == 'Swimming':
                events.append(np.random.choice(["Men's 100m Freestyle", "Women's 100m Freestyle", 
                                               "Men's 200m Butterfly", "Women's 200m Butterfly"]))
            elif sport == 'Athletics':
                events.append(np.random.choice(["Men's 100m", "Women's 100m", "Men's Long Jump", "Women's Long Jump"]))
            else:
                events.append(f"{np.random.choice(['Men', 'Women'])}'s {sport}")
        
        # Generate physiological data with realistic distributions
        heights = np.random.normal(175, 15, sample_size)  # Mean 175cm, std 15cm
        weights = np.random.normal(70, 15, sample_size)   # Mean 70kg, std 15kg
        ages = np.random.normal(26, 5, sample_size)       # Mean 26 years, std 5 years
        
        # Add correlation between height/weight and medals in certain sports
        medals = np.random.choice([np.nan, 'Gold', 'Silver', 'Bronze'], sample_size, p=[0.85, 0.05, 0.05, 0.05])
        
        # Adjust height/weight for basketball medalists
        for i in range(sample_size):
            if sports[i] == 'Basketball' and pd.notna(medals[i]):
                # Basketball medalists tend to be taller
                heights[i] = np.random.normal(195, 10)
            elif sports[i] == 'Weightlifting' and pd.notna(medals[i]):
                # Weightlifting medalists tend to be heavier
                weights[i] = np.random.normal(85, 15)
            elif sports[i] == 'Gymnastics' and pd.notna(medals[i]):
                # Gymnasts tend to be shorter and lighter
                heights[i] = np.random.normal(160, 8)
                weights[i] = np.random.normal(55, 8)
        
        # Create DataFrame
        df = pd.DataFrame({
            'ID': range(1, sample_size + 1),
            'Name': [f'Athlete_{i}' for i in range(sample_size)],
            'Sex': np.random.choice(['M', 'F'], sample_size),
            'Age': ages,
            'Height': heights,
            'Weight': weights,
            'Team': np.random.choice(['USA', 'China', 'Russia', 'Germany', 'France', 'Japan', 
                                     'Brazil', 'Australia', 'Italy', 'Netherlands'], sample_size),
            'NOC': np.random.choice(['USA', 'CHN', 'RUS', 'GER', 'FRA', 'JPN', 
                                     'BRA', 'AUS', 'ITA', 'NED'], sample_size),
            'Games': [f"{year} {'Summer' if year % 4 == 0 else 'Winter'}" for year in years],
            'Year': years,
            'Season': ['Summer' if year % 4 == 0 else 'Winter' for year in years],
            'City': np.random.choice(['London', 'Rio', 'Beijing', 'Athens', 'Sydney'], sample_size),
            'Sport': sports,
            'Event': events,
            'Medal': medals
        })
        
        # Save sample dataset for future use
        df.to_csv('data/athlete_events.csv', index=False)
        print("Sample dataset generated and saved to data/athlete_events.csv")

# Add medal indicator
df['has_medal'] = (~df['Medal'].isna()).astype(int)

# Get list of Olympic years
years = sorted(df['Year'].unique())

# Get list of sports
sports = sorted(df['Sport'].unique())

# Get list of events
events = sorted(df['Event'].unique())

# Filter events with enough participants for statistical significance
event_counts = df['Event'].value_counts()
valid_events = event_counts[event_counts >= 100].index.tolist()

# Function to analyze genetic impact by event
def analyze_genetic_impact(event_data):
    """Analyze the impact of genetic factors on medal winning for a specific event."""
    
    # Skip if too few data points
    if len(event_data) < 100:
        return None
    
    # Split data into medalists and non-medalists
    medalists = event_data[event_data['has_medal'] == 1]
    non_medalists = event_data[event_data['has_medal'] == 0]
    
    # Skip if too few medalists
    if len(medalists) < 10:
        return None
    
    # Initialize results
    results = {
        'total_athletes': len(event_data),
        'total_medalists': len(medalists),
        'height': {
            'medalist_mean': medalists['Height'].mean(),
            'non_medalist_mean': non_medalists['Height'].mean(),
            'significant': False,
            'p_value': None
        },
        'weight': {
            'medalist_mean': medalists['Weight'].mean(),
            'non_medalist_mean': non_medalists['Weight'].mean(),
            'significant': False,
            'p_value': None
        },
        'age': {
            'medalist_mean': medalists['Age'].mean(),
            'non_medalist_mean': non_medalists['Age'].mean(),
            'significant': False,
            'p_value': None
        }
    }
    
    # Calculate statistical significance for height
    if len(medalists['Height'].dropna()) > 10 and len(non_medalists['Height'].dropna()) > 10:
        try:
            _, height_p = stats.mannwhitneyu(
                medalists['Height'].dropna(), 
                non_medalists['Height'].dropna(), 
                alternative='two-sided'
            )
            results['height']['p_value'] = float(height_p)
            results['height']['significant'] = height_p < 0.05
        except:
            pass
    
    # Calculate statistical significance for weight
    if len(medalists['Weight'].dropna()) > 10 and len(non_medalists['Weight'].dropna()) > 10:
        try:
            _, weight_p = stats.mannwhitneyu(
                medalists['Weight'].dropna(), 
                non_medalists['Weight'].dropna(), 
                alternative='two-sided'
            )
            results['weight']['p_value'] = float(weight_p)
            results['weight']['significant'] = weight_p < 0.05
        except:
            pass
    
    # Calculate statistical significance for age
    if len(medalists['Age'].dropna()) > 10 and len(non_medalists['Age'].dropna()) > 10:
        try:
            _, age_p = stats.mannwhitneyu(
                medalists['Age'].dropna(), 
                non_medalists['Age'].dropna(), 
                alternative='two-sided'
            )
            results['age']['p_value'] = float(age_p)
            results['age']['significant'] = age_p < 0.05
        except:
            pass
    
    # Determine most significant factor
    p_values = [
        results['height']['p_value'] if results['height']['p_value'] is not None else 1,
        results['weight']['p_value'] if results['weight']['p_value'] is not None else 1,
        results['age']['p_value'] if results['age']['p_value'] is not None else 1
    ]
    
    factors = ['height', 'weight', 'age']
    
    if min(p_values) < 1:
        results['most_significant_factor'] = factors[np.argmin(p_values)]
        results['most_significant_p_value'] = min(p_values)
        results['is_significant'] = min(p_values) < 0.05
    else:
        results['most_significant_factor'] = None
        results['most_significant_p_value'] = None
        results['is_significant'] = False
    
    # Add distribution data for histograms
    if len(medalists['Height'].dropna()) > 10:
        results['height']['medalist_dist'] = medalists['Height'].dropna().tolist()
        results['height']['non_medalist_dist'] = non_medalists['Height'].dropna().tolist()
    
    if len(medalists['Weight'].dropna()) > 10:
        results['weight']['medalist_dist'] = medalists['Weight'].dropna().tolist()
        results['weight']['non_medalist_dist'] = non_medalists['Weight'].dropna().tolist()
    
    if len(medalists['Age'].dropna()) > 10:
        results['age']['medalist_dist'] = medalists['Age'].dropna().tolist()
        results['age']['non_medalist_dist'] = non_medalists['Age'].dropna().tolist()
    
    return results

# Create data structure for visualization
olympic_data = {}

# Process data by year and sport
for year in years:
    year_data = df[df['Year'] == year]
    
    olympic_data[str(year)] = {
        'sports': {},
        'total_athletes': len(year_data),
        'total_events': len(year_data['Event'].unique()),
        'total_countries': len(year_data['NOC'].unique())
    }
    
    # Add information about whether it's Summer or Winter Olympics
    season = year_data['Season'].iloc[0] if not year_data.empty else "Unknown"
    olympic_data[str(year)]['season'] = season
    
    # Add location information
    city = year_data['City'].iloc[0] if not year_data.empty else "Unknown"
    olympic_data[str(year)]['city'] = city
    
    # Process each sport in this Olympic year
    for sport in year_data['Sport'].unique():
        sport_data = year_data[year_data['Sport'] == sport]
        
        olympic_data[str(year)]['sports'][sport] = {
            'events': {},
            'total_athletes': len(sport_data),
            'total_events': len(sport_data['Event'].unique()),
            'total_countries': len(sport_data['NOC'].unique())
        }
        
        # Process each event in this sport
        for event in sport_data['Event'].unique():
            if event not in valid_events:
                continue
            
            event_data = sport_data[sport_data['Event'] == event]
            analysis = analyze_genetic_impact(event_data)
            
            if analysis:
                olympic_data[str(year)]['sports'][sport]['events'][event] = analysis

# Define a custom JSON encoder to handle numpy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return bool(obj)
        return super(NumpyEncoder, self).default(obj)

# Save complete dataset
with open('data/olympic_genetics_data.json', 'w') as f:
    json.dump(olympic_data, f, cls=NumpyEncoder)

print("Data processing complete. Output saved to data/olympic_genetics_data.json")

# Create a summary of the most significant genetic factors by sport across all Olympics
sport_summary = {}
for sport in sports:
    sport_data = df[df['Sport'] == sport]
    
    # Skip sports with too few data points
    if len(sport_data) < 100:
        continue
    
    analysis = analyze_genetic_impact(sport_data)
    if analysis:
        sport_summary[sport] = {
            'most_significant_factor': analysis['most_significant_factor'],
            'p_value': analysis['most_significant_p_value'],
            'is_significant': analysis['is_significant'],
            'total_athletes': analysis['total_athletes'],
            'total_medalists': analysis['total_medalists']
        }

# Save sport summary
with open('data/sport_summary.json', 'w') as f:
    json.dump(sport_summary, f, cls=NumpyEncoder)

print("Sport summary saved to data/sport_summary.json")

# Create a simplified dataset for the main visualization
olympic_bubbles = []
for year in sorted(years):
    if str(year) in olympic_data:
        year_info = olympic_data[str(year)]
        
        # Count events with significant genetic factors
        significant_events = 0
        total_analyzed_events = 0
        
        for sport in year_info['sports']:
            for event in year_info['sports'][sport]['events']:
                if year_info['sports'][sport]['events'][event]['is_significant']:
                    significant_events += 1
                total_analyzed_events += 1
        
        olympic_bubbles.append({
            'year': year,
            'season': year_info['season'],
            'city': year_info['city'],
            'total_athletes': year_info['total_athletes'],
            'total_events': year_info['total_events'],
            'total_countries': year_info['total_countries'],
            'analyzed_events': total_analyzed_events,
            'significant_events': significant_events,
            'genetic_impact_ratio': significant_events / total_analyzed_events if total_analyzed_events > 0 else 0
        })

# Save bubble data
with open('data/olympic_bubbles.json', 'w') as f:
    json.dump(olympic_bubbles, f, cls=NumpyEncoder)

print("Olympic bubbles data saved to data/olympic_bubbles.json")