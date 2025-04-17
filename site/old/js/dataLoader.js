/**
 * Data Loader Module
 * Handles loading and caching data for the Olympic visualization
 */
const DataLoader = (function() {
    // Private variables to store data
    let olympicBubbles = null;
    let olympicGeneticsData = null;
    let sportSummary = null;
    let isLoading = false;
    let loadingPromise = null;

    // Load all data at once
    function loadAllData() {
        if (loadingPromise) {
            return loadingPromise;
        }

        isLoading = true;
        
        // Show loading screen
        document.getElementById('loading-screen').style.display = 'flex';
        
        // Fetch data with better error handling
        const fetchWithErrorHandling = (url) => {
            return fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok for ${url}: ${response.status} ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(text => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error(`JSON parse error in ${url}:`, e);
                        console.error(`JSON snippet around error:`, text.substring(0, 100) + '...');
                        throw new Error(`JSON parse error in ${url}: ${e.message}`);
                    }
                });
        };
        
        loadingPromise = Promise.all([
            fetchWithErrorHandling('data/olympic_bubbles.json'),
            fetchWithErrorHandling('data/olympic_genetics_data.json'),
            fetchWithErrorHandling('data/sport_summary.json')
        ])
        .then(([bubbles, genetics, sports]) => {
            olympicBubbles = bubbles;
            olympicGeneticsData = genetics;
            sportSummary = sports;
            isLoading = false;
            
            // Hide loading screen with a slight delay for smooth transition
            setTimeout(() => {
                document.getElementById('loading-screen').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loading-screen').style.display = 'none';
                }, 500);
            }, 500);
            
            return {
                olympicBubbles,
                olympicGeneticsData,
                sportSummary
            };
        })
        .catch(error => {
            console.error('Error loading data:', error);
            isLoading = false;
            
            // Display error message in loading screen
            const loadingContent = document.querySelector('.loading-content');
            const loadingError = document.getElementById('loading-error');
            
            // Update header
            loadingContent.querySelector('h2').textContent = 'Error Loading Data';
            loadingContent.querySelector('p').textContent = 'There was a problem loading the Olympic data.';
            
            // Show detailed error in debug panel
            if (loadingError) {
                loadingError.style.display = 'block';
                loadingError.innerHTML = `
                    <strong>Error Details:</strong><br>
                    ${error.message}<br><br>
                    <strong>Troubleshooting:</strong><br>
                    1. Check that data files exist in the 'data' directory<br>
                    2. Try running 'python prepare_simple_data.py' to regenerate the data<br>
                    3. Check browser console for more details
                `;
            }
            
            // Add retry button
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry';
            retryButton.onclick = () => location.reload();
            retryButton.style.margin = '20px 10px';
            retryButton.style.padding = '8px 16px';
            
            // Add generate data button
            const generateButton = document.createElement('button');
            generateButton.textContent = 'Generate Test Data';
            generateButton.onclick = () => {
                fetch('/generate-test-data')
                    .then(response => {
                        if (response.ok) {
                            alert('Test data generated! Reloading the page...');
                            location.reload();
                        } else {
                            alert('Failed to generate test data. Please check the server logs.');
                        }
                    })
                    .catch(e => {
                        alert('Error: ' + e.message);
                    });
            };
            generateButton.style.margin = '20px 10px';
            generateButton.style.padding = '8px 16px';
            
            // Add buttons to loading screen
            const buttonContainer = document.createElement('div');
            buttonContainer.appendChild(retryButton);
            buttonContainer.appendChild(generateButton);
            loadingContent.appendChild(buttonContainer);
            
            throw error;
        });
        
        return loadingPromise;
    }

    // Public API
    return {
        // Load all data
        loadData: loadAllData,
        
        // Check if data is currently loading
        isLoading: function() {
            return isLoading;
        },
        
        // Get Olympic bubbles data (overview)
        getOlympicBubbles: function() {
            if (!olympicBubbles) {
                return loadAllData().then(() => olympicBubbles);
            }
            return Promise.resolve(olympicBubbles);
        },
        
        // Get detailed Olympic genetics data
        getOlympicGeneticsData: function() {
            if (!olympicGeneticsData) {
                return loadAllData().then(() => olympicGeneticsData);
            }
            return Promise.resolve(olympicGeneticsData);
        },
        
        // Get sport summary data
        getSportSummary: function() {
            if (!sportSummary) {
                return loadAllData().then(() => sportSummary);
            }
            return Promise.resolve(sportSummary);
        },
        
        // Get data for a specific Olympic year
        getOlympicYear: function(year) {
            if (!olympicGeneticsData) {
                return loadAllData().then(() => olympicGeneticsData[year] || null);
            }
            return Promise.resolve(olympicGeneticsData[year] || null);
        },
        
        // Get data for a specific sport in a specific Olympic year
        getOlympicSport: function(year, sport) {
            if (!olympicGeneticsData) {
                return loadAllData().then(() => {
                    const yearData = olympicGeneticsData[year] || null;
                    return yearData ? (yearData.sports[sport] || null) : null;
                });
            }
            const yearData = olympicGeneticsData[year] || null;
            return Promise.resolve(yearData ? (yearData.sports[sport] || null) : null);
        },
        
        // Get data for a specific event in a specific Olympic year
        getOlympicEvent: function(year, sport, event) {
            if (!olympicGeneticsData) {
                return loadAllData().then(() => {
                    const yearData = olympicGeneticsData[year] || null;
                    const sportData = yearData ? (yearData.sports[sport] || null) : null;
                    return sportData ? (sportData.events[event] || null) : null;
                });
            }
            const yearData = olympicGeneticsData[year] || null;
            const sportData = yearData ? (yearData.sports[sport] || null) : null;
            return Promise.resolve(sportData ? (sportData.events[event] || null) : null);
        }
    };
})();