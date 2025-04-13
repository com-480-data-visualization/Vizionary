# Olympic Success & Genetics Visualization

This interactive visualization explores the influence of physical attributes (height, weight, age) on medal achievements in Olympic Games from 1900 to 2016.

## Features

- Interactive bubble chart visualization of Olympic Games (1900-2016)
- Detailed analysis of genetic factors by sport and event
- Statistical visualization of physical attribute distributions
- Comparison of medalists vs. non-medalists across different sports
- Visual significance testing with p-value display

## Getting Started

### Prerequisites

Make sure you have Python 3.6+ installed along with the required packages:

```bash
pip install -r requirements.txt
```

### Preparing the Data

Before running the visualization, you need to prepare the data:

```bash
cd src
python prepare_data.py
```

This script will:
1. Download the Olympic dataset from Kaggle
2. Process the raw data
3. Generate the necessary JSON files for the visualization

### Running the Visualization

Start the local web server:

```bash
cd src
./serve.py
```

This will launch a web server at http://localhost:8000 and open the visualization in your browser.

## Visualization Structure

The visualization consists of several interconnected views:

1. **Olympic Overview**: A bubble chart representing Olympic Games from 1900 to 2016
   - Each bubble represents an Olympic Games
   - Size represents the number of athletes
   - Color represents season (summer/winter) and genetic impact strength
   - Click on a bubble to explore that specific Olympics

2. **Olympic Detail View**: Shows sports from a specific Olympic Games
   - Sports are displayed as bubbles
   - Size represents the number of athletes in that sport
   - Click on a sport to see its events
   - Events with significant genetic factors are highlighted

3. **Event Detail View**: Statistical analysis of genetic factors for a specific event
   - Distribution charts for height, weight, and age
   - Comparison between medalists and non-medalists
   - Statistical significance testing
   - Interpretation of results

4. **Sport Summary View**: Overview of genetic factors across all sports
   - Bar chart showing the most significant genetic factor for each sport
   - Significance threshold visualization
   - Detailed sport comparison panel

## How to Use

1. Start at the Olympic Overview and click on any Olympic Games bubble
2. In the Olympic Detail view, select a sport to see its events
3. Click on an event to see detailed genetic analysis
4. Use the navigation buttons to switch between different views
5. In the Sport Summary view, click on a sport to see its genetic profile

## Methodology

This visualization uses statistical analysis to determine whether genetic characteristics significantly influence medal success:

- **Mann-Whitney U Test**: Compares distributions without assuming normality
- **P-value Calculation**: Determines statistical significance (p < 0.05)
- **Distribution Visualization**: Shows differences in physical attributes

## Dataset

The visualization uses the "120 years of Olympic history: athletes and results" dataset from Kaggle, which contains information about more than 200,000 athletes who participated in the Olympics from approximately 1900 to 2016.