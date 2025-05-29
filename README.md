# Project of Data Visualization (COM-480)

## 🌟 Overview

Vizionary is a web app built for the COM-480 Data Visualization course. It visualizes how attributes like age, height, and weight correlate with medal outcomes in the Olympic Games. Users can explore an engaging homepage of sports “bubbles” and dive into detailed analysis pages for each sport.

For this milestone, we delivered:
- A complete interactive visualization website (available [here](https://com-480-data-visualization.github.io/Vizionary))
- A process book outlining our development journey  
- A 2-minute screencast highlighting main features in a funny way,  

---

## 🚀 Features

✅ Interactive sport bubbles homepage  
✅ Detailed analytics pages for each sport  
✅ Gender toggle to explore differences  
✅ Smooth transitions and intuitive interactions  

---

## ⚙️ Tech Stack

- **Framework**: SvelteKit  
- **Styling**: Tailwind CSS  
- **Visualization**: D3.js  
- **Data format**: Pre-processed JSON files (one per sport)  

---

## 📂 Project Structure

Here’s what the key folders and files contain:

- **`docs/`** – The main SvelteKit app  
  - **`src/routes/`** – All page components, including the homepage and dynamic sport detail pages  
  - **`src/lib/components/`** – Reusable UI components (e.g., charts, layout)  
  - **`src/lib/charts/`** – D3 modules for different visualizations (like heatmaps, bar charts)  
  - **`static/data/`** – Pre-generated JSON data files for each sport  
  - **`tailwind.config.cjs` / `svelte.config.js`** – Tailwind and Svelte configuration  
- **`Process_Book-1.pdf`** – The process book report for this milestone  
- **`README.md`** – This file!  

---

## 🔧 Getting Started



### 1️⃣ Clone the repository
```bash
git clone https://github.com/com-480-data-visualization/Vizionary.git
cd Vizionary/site
```

### 2️⃣ Install dependencies
```
npm install
```

### 3️⃣ Run in development
```
npm run dev
```
Open http://localhost:5173 in your browser

### 4️⃣ Build for production
```
npm run build
npm run preview
```
The production-ready build will be in `docs/build/`

---

## 🎥 Screencast

Watch a 2-minute walkthrough video of the final product here:
🔗 [Paste Link]

---

## 🚀 Future Improvements

We have ideas for expanding the project in the future, such as:

• Adding live data feeds for upcoming Olympic Games  
• Incorporating economic and demographic data via APIs  
• Building predictive models (e.g., logistic regression for medal probabilities)  
• Implementing an avatar tool: users enter their own age, weight, height to generate an avatar and see which sports they’d be most likely to succeed in!

## 👥 Team


| Student's name | SCIPER |
| -------------- | ------ |
| David Gauch | 394014 |
| Flavia Wallenhorst | 264996 |
| Arthur Wuhrmann | 344752 |

---
Enjoy exploring how physical attributes influence Olympic success!
Feel free to open issues or suggest improvements.
