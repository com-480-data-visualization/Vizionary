/**
 * Olympic Detail Module
 * Handles the detailed view of an Olympic Games, showing sports and events
 */
const OlympicDetail = (function() {
    // Private variables
    let currentYear = null;
    let currentOlympicData = null;
    let svg = null;
    let width = 0;
    let height = 0;
    
    // Event handlers
    const sportSelectHandlers = [];
    const eventSelectHandlers = [];
    
    // Initialize the Olympic detail view
    function init() {
        // Set up back button handler
        document.getElementById('back-to-overview').addEventListener('click', () => {
            showView('overview-view');
        });
        
        // Initialize sports bubbles
        const container = document.getElementById('sports-bubbles');
        
        // Set dimensions
        width = container.clientWidth;
        height = container.clientHeight;
        
        // Create SVG element
        svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
            
        // Handle window resize
        window.addEventListener('resize', debounce(() => {
            if (container.clientWidth !== width) {
                width = container.clientWidth;
                height = container.clientHeight;
                
                svg.attr('width', width)
                   .attr('height', height)
                   .attr('viewBox', `0 0 ${width} ${height}`);
                   
                // Redraw if we have data
                if (currentOlympicData) {
                    drawSportBubbles(currentOlympicData);
                }
            }
        }, 250));
    }
    
    // Display Olympic data for a specific year
    function showOlympic(year, olympicData) {
        currentYear = year;
        currentOlympicData = olympicData;
        
        // Update header
        document.getElementById('olympic-title').textContent = `${year} ${olympicData.season} Olympics - ${olympicData.city}`;
        document.getElementById('olympic-stats').textContent = 
            `${olympicData.total_athletes.toLocaleString()} athletes from ${olympicData.total_countries} countries competed in ${olympicData.total_events} events`;
        
        // Draw sports bubbles
        drawSportBubbles(olympicData);
        
        // Reset sport detail panel
        document.getElementById('sport-title').textContent = 'Select a sport';
        document.getElementById('sport-stats').textContent = '';
        document.getElementById('events-list').innerHTML = '';
        
        // Switch to Olympic detail view
        showView('olympic-detail-view');
    }
    
    // Draw the sport bubbles visualization
    function drawSportBubbles(olympicData) {
        // Clear SVG
        svg.selectAll('*').remove();
        
        // Extract sports data
        const sports = Object.keys(olympicData.sports).map(sport => {
            const sportData = olympicData.sports[sport];
            
            // Calculate genetic impact
            let significantEvents = 0;
            let totalAnalyzedEvents = 0;
            
            Object.values(sportData.events || {}).forEach(event => {
                if (event.is_significant) {
                    significantEvents++;
                }
                totalAnalyzedEvents++;
            });
            
            const geneticImpactRatio = totalAnalyzedEvents > 0 ? significantEvents / totalAnalyzedEvents : 0;
            
            return {
                name: sport,
                athletes: sportData.total_athletes,
                events: sportData.total_events,
                countries: sportData.total_countries,
                geneticImpactRatio: geneticImpactRatio,
                significantEvents: significantEvents,
                totalAnalyzedEvents: totalAnalyzedEvents
            };
        });
        
        // Size scale for bubbles based on total athletes
        const sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(sports, d => d.athletes)])
            .range([20, 60]);
            
        // Color scale based on genetic impact
        const colorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['rgba(0, 82, 136, 0.3)', 'rgba(0, 82, 136, 0.9)']);
            
        // Create force simulation
        const simulation = d3.forceSimulation(sports)
            .force('charge', d3.forceManyBody().strength(5))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => sizeScale(d.athletes) + 2))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05));
            
        // Create bubble groups
        const bubbleGroups = svg.selectAll('.sport-bubble-group')
            .data(sports)
            .enter()
            .append('g')
            .attr('class', 'sport-bubble-group');
            
        // Create bubbles
        bubbleGroups.append('circle')
            .attr('class', 'bubble')
            .attr('r', d => sizeScale(d.athletes))
            .attr('fill', d => colorScale(d.geneticImpactRatio))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .classed('holographic-effect', true);
                    
                const tooltip = d3.select('#sports-bubbles')
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0, 0, 0, 0.8)')
                    .style('color', 'white')
                    .style('border-radius', '5px')
                    .style('padding', '10px')
                    .style('pointer-events', 'none')
                    .style('z-index', 100)
                    .style('opacity', 0);
                    
                tooltip.html(`
                    <strong>${d.name}</strong><br>
                    Athletes: ${d.athletes.toLocaleString()}<br>
                    Events: ${d.events}<br>
                    Significant genetic factors: ${d.significantEvents}/${d.totalAnalyzedEvents}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY + 10) + 'px')
                .transition()
                .duration(300)
                .style('opacity', 1);
                
                d3.select(this.parentNode).raise();
            })
            .on('mousemove', function(event) {
                d3.select('.tooltip')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .classed('holographic-effect', false);
                    
                d3.select('.tooltip').remove();
            })
            .on('click', function(event, d) {
                event.stopPropagation();
                
                // Reset any previously selected bubbles
                svg.selectAll('.bubble').classed('selected', false);
                
                // Set current selection
                d3.select(this).classed('selected', true);
                
                // Show sport details
                showSportDetails(d.name);
                
                // Notify click handlers
                sportSelectHandlers.forEach(handler => handler(d.name));
            });
            
        // Add sport labels
        bubbleGroups.append('text')
            .attr('class', 'bubble-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '.3em')
            .style('pointer-events', 'none')
            .text(d => d.name.length > 12 ? d.name.substring(0, 10) + '...' : d.name);
            
        // Set up simulation tick
        simulation.on('tick', () => {
            bubbleGroups.attr('transform', d => `translate(${d.x}, ${d.y})`);
        });
    }
    
    // Show details for a selected sport
    function showSportDetails(sportName) {
        if (!currentOlympicData || !currentOlympicData.sports[sportName]) {
            return;
        }
        
        const sportData = currentOlympicData.sports[sportName];
        
        // Update sport title and stats
        document.getElementById('sport-title').textContent = sportName;
        document.getElementById('sport-stats').textContent = 
            `${sportData.total_athletes.toLocaleString()} athletes from ${sportData.total_countries} countries competed in ${sportData.total_events} events`;
        
        // Create event list
        const eventsContainer = document.getElementById('events-list');
        eventsContainer.innerHTML = '';
        
        // Sort events by significance and alphabetically
        const events = Object.keys(sportData.events || {}).map(eventName => {
            const eventData = sportData.events[eventName];
            return {
                name: eventName,
                isSignificant: eventData.is_significant,
                pValue: eventData.most_significant_p_value
            };
        }).sort((a, b) => {
            // First sort by significance (significant first)
            if (a.isSignificant !== b.isSignificant) {
                return a.isSignificant ? -1 : 1;
            }
            // Then by p-value (smaller first)
            if (a.isSignificant && b.isSignificant) {
                return a.pValue - b.pValue;
            }
            // Then alphabetically
            return a.name.localeCompare(b.name);
        });
        
        // Create event items
        events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `event-item${event.isSignificant ? ' significant' : ''}`;
            eventElement.textContent = event.name;
            eventElement.title = event.isSignificant ? 
                'Significant genetic factors found!' : 
                'No significant genetic factors found';
                
            eventElement.addEventListener('click', () => {
                // Notify event selection handlers
                eventSelectHandlers.forEach(handler => handler(sportName, event.name));
            });
            
            eventsContainer.appendChild(eventElement);
        });
    }
    
    // Utility function to show a specific view
    function showView(viewId) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show the requested view
        document.getElementById(viewId).classList.add('active');
        
        // Update nav buttons
        document.querySelectorAll('#view-controls button').forEach(button => {
            button.classList.remove('active');
        });
        
        // Match the control button with the view
        if (viewId === 'overview-view') {
            document.getElementById('overview-btn').classList.add('active');
        } else if (viewId === 'sport-summary-view') {
            document.getElementById('sport-summary-btn').classList.add('active');
        } else if (viewId === 'about-view') {
            document.getElementById('about-btn').classList.add('active');
        }
    }
    
    // Utility function to debounce function calls
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Public API
    return {
        init: init,
        showOlympic: showOlympic,
        
        // Event handler for sport selection
        onSportSelect: function(handler) {
            if (typeof handler === 'function') {
                sportSelectHandlers.push(handler);
            }
            return this;
        },
        
        // Event handler for event selection
        onEventSelect: function(handler) {
            if (typeof handler === 'function') {
                eventSelectHandlers.push(handler);
            }
            return this;
        }
    };
})();