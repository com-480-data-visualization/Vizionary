/**
 * Main Application Module
 * Coordinates the various components of the Olympic genetics visualization
 */
(function() {
    // Initialize the application when the DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize components
        initComponents();
        
        // Set up view navigation
        setupNavigation();
        
        // Load data and initialize visualization
        loadData();
    });
    
    // Initialize all components
    function initComponents() {
        // Initialize bubble chart
        BubbleChart.init('bubble-chart');
        
        // Initialize Olympic detail view
        OlympicDetail.init();
        
        // Initialize event detail view
        EventDetail.init();
        
        // Initialize sport summary
        SportSummary.init();
        
        // Set up event handling
        setupEventHandlers();
    }
    
    // Set up navigation between views
    function setupNavigation() {
        // Overview button
        document.getElementById('overview-btn').addEventListener('click', function() {
            showView('overview-view');
        });
        
        // Sport summary button
        document.getElementById('sport-summary-btn').addEventListener('click', function() {
            showView('sport-summary-view');
        });
        
        // About button
        document.getElementById('about-btn').addEventListener('click', function() {
            showView('about-view');
        });
    }
    
    // Load data and initialize visualizations
    function loadData() {
        DataLoader.loadData()
            .then(function(data) {
                // Initialize bubble chart with Olympic years data
                BubbleChart.update(data.olympicBubbles);
                
                // Initialize sport summary with sport data
                SportSummary.update(data.sportSummary);
            })
            .catch(function(error) {
                console.error('Error initializing visualizations:', error);
            });
    }
    
    // Set up event handlers between components
    function setupEventHandlers() {
        // Handle Olympic year selection from bubble chart
        BubbleChart.onBubbleClick(function(olympicData) {
            const year = olympicData.year.toString();
            
            // Load detailed data for this Olympic year
            DataLoader.getOlympicYear(year)
                .then(function(yearData) {
                    if (yearData) {
                        OlympicDetail.showOlympic(year, yearData);
                    } else {
                        console.error('No data available for year:', year);
                    }
                })
                .catch(function(error) {
                    console.error('Error loading Olympic year data:', error);
                });
        });
        
        // Handle sport selection in Olympic detail view
        OlympicDetail.onSportSelect(function(sport) {
            console.log('Sport selected:', sport);
        });
        
        // Handle event selection in Olympic detail view
        OlympicDetail.onEventSelect(function(sport, event) {
            const year = currentOlympicYear();
            
            // Load detailed data for this event
            DataLoader.getOlympicEvent(year, sport, event)
                .then(function(eventData) {
                    if (eventData) {
                        EventDetail.showEvent(year, sport, event, eventData);
                    } else {
                        console.error('No data available for event:', event);
                    }
                })
                .catch(function(error) {
                    console.error('Error loading event data:', error);
                });
        });
    }
    
    // Get the current Olympic year from the URL or default
    function currentOlympicYear() {
        // Check if Olympic detail view is active
        const olympicTitle = document.getElementById('olympic-title').textContent;
        const yearMatch = olympicTitle.match(/^(\d{4})/);
        
        return yearMatch ? yearMatch[1] : null;
    }
    
    // Utility function to show a specific view
    function showView(viewId) {
        // Hide all views
        document.querySelectorAll('.view').forEach(function(view) {
            view.classList.remove('active');
        });
        
        // Show the requested view
        document.getElementById(viewId).classList.add('active');
        
        // Update nav buttons
        document.querySelectorAll('#view-controls button').forEach(function(button) {
            button.classList.remove('active');
        });
        
        // Highlight the active button
        if (viewId === 'overview-view') {
            document.getElementById('overview-btn').classList.add('active');
        } else if (viewId === 'sport-summary-view') {
            document.getElementById('sport-summary-btn').classList.add('active');
        } else if (viewId === 'about-view') {
            document.getElementById('about-btn').classList.add('active');
        }
    }
})();