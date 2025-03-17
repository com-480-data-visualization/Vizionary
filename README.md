# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| David Gauch | |
| Flavia Wallenhorst | 264996 |
| Arthur Wuhrmann | 344752 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (21st March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

Suggested answer : 
===

### Dataset
We aimed for an Olympic dataset found on `Kaggle`, that contains information about more than 200k athletes that participated to the Olympics, from ~1900 to 2016. Some values regarding age, height and weight are missing, but most the data is very clean.

While this dataset might limit our research, this can easily be enhanced with some side information about the countries of the athletes (their GDP, etc., for example on [this dataset](https://github.com/bnokoro/Data-Science/blob/master/countries%20of%20the%20world.csv)). We could also take into account some weather conditions (while harder for older events, this could combine the exact date of some events that could be found online and weather APIs like [OpenWeatherMap](https://openweathermap.org/history))

### Problematic

Doing some exploratory analysis, we wondered whether some genetic factors could influence whether an athlete could have a medal or not. The first analysis indeed suggests that this is the case for some events. We thus consider a problematic like 

> ***Is genetic the key to an athlete's success ? An analysis on the olympic data.***

The exploratory can be found in `src/exploratory.ipynb`. It is in the form of a notebook with `matplotlib` and `plotly`, but the data can easily be converted to for example json to be easily loaded in a website.

### Exploratory DA

We mentionned the correlation between genetic and medals. Here is the distribution, in the event `Basketball Men's Basketball`, of the different genetic characteristics for medalists vs. non medalists. Here is what we found : 
![Figure](images/basket.png)

### Related work

On `Kaggle`, people can share their data analysis, we took some inspiration from notably [this analysis](https://www.kaggle.com/code/joshuaswords/does-hosting-the-olympics-improve-performance) that studies the effect of hosting the event for a country. 

---

### Dataset

> Find a dataset (or multiple) that you will explore. Assess the quality of the data it contains and how much preprocessing / data-cleaning it will require before tackling visualization. We recommend using a standard dataset as this course is not about scraping nor data processing.
>
> Hint: some good pointers for finding quality publicly available datasets ([Google dataset search](https://datasetsearch.research.google.com/), [Kaggle](https://www.kaggle.com/datasets), [OpenSwissData](https://opendata.swiss/en/), [SNAP](https://snap.stanford.edu/data/) and [FiveThirtyEight](https://data.fivethirtyeight.com/)), you could use also the DataSets proposed by the ENAC (see the Announcements section on Zulip).

### Problematic

> Frame the general topic of your visualization and the main axis that you want to develop.
> - What am I trying to show with my visualization?
> - Think of an overview for the project, your motivation, and the target audience.

### Exploratory Data Analysis

> Pre-processing of the data set you chose
> - Show some basic statistics and get insights about the data

### Related work


> - What others have already done with the data?
> - Why is your approach original?
> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).
> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class.

## Milestone 2 (18th April, 5pm)

**10% of the final grade**


## Milestone 3 (30th May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

