/**
 * Event Detail Module
 * Handles the detailed view of an Olympic event, showing genetic factors and distributions
 */
const EventDetail = (function() {
    // Private variables
    let currentYear = null;
    let currentSport = null;
    let currentEvent = null;
    let currentEventData = null;
    
    // Initialize the event detail view
    function init() {
        // Set up back button handler
        document.getElementById('back-to-olympic').addEventListener('click', () => {
            showView('olympic-detail-view');
        });
    }
    
    // Display event data
    function showEvent(year, sport, event, eventData) {
        currentYear = year;
        currentSport = sport;
        currentEvent = event;
        currentEventData = eventData;
        
        // Update header
        document.getElementById('event-title').textContent = `${event} (${year} ${sport})`;
        document.getElementById('event-stats').textContent = 
            `${eventData.total_athletes} athletes competed, ${eventData.total_medalists} won medals`;
        
        // Create distribution charts
        createDistributionCharts(eventData);
        
        // Create impact summary
        createImpactSummary(eventData);
        
        // Switch to event detail view
        showView('event-detail-view');
    }
    
    // Create distribution charts for height, weight, and age
    function createDistributionCharts(eventData) {
        const factors = ['height', 'weight', 'age'];
        const labels = {
            'height': 'Height (cm)',
            'weight': 'Weight (kg)',
            'age': 'Age (years)'
        };
        
        factors.forEach(factor => {
            if (eventData[factor] && 
                eventData[factor].medalist_dist && 
                eventData[factor].non_medalist_dist) {
                
                const chartContainer = document.querySelector(`#${factor}-chart .chart`);
                const medalistData = eventData[factor].medalist_dist;
                const nonMedalistData = eventData[factor].non_medalist_dist;
                
                // Create traces for Plotly
                const traces = [
                    {
                        type: 'violin',
                        x: medalistData,
                        name: 'Medalists',
                        side: 'positive',
                        line: {
                            color: 'rgba(0, 82, 136, 0.8)'
                        },
                        fillcolor: 'rgba(0, 82, 136, 0.3)',
                        meanline: {
                            visible: true,
                            color: 'rgba(0, 82, 136, 1)'
                        },
                        points: false
                    },
                    {
                        type: 'violin',
                        x: nonMedalistData,
                        name: 'Non-Medalists',
                        side: 'negative',
                        line: {
                            color: 'rgba(244, 192, 51, 0.8)'
                        },
                        fillcolor: 'rgba(244, 192, 51, 0.3)',
                        meanline: {
                            visible: true,
                            color: 'rgba(244, 192, 51, 1)'
                        },
                        points: false
                    }
                ];
                
                // Layout configuration
                const layout = {
                    title: {
                        text: `${labels[factor]} Distribution`,
                        font: {
                            size: 14
                        }
                    },
                    xaxis: {
                        title: labels[factor]
                    },
                    yaxis: {
                        zeroline: false,
                        showticklabels: false
                    },
                    violingap: 0,
                    violinmode: 'overlay',
                    showlegend: true,
                    legend: {
                        x: 0,
                        y: 1
                    },
                    margin: {
                        l: 40,
                        r: 20,
                        t: 40,
                        b: 50
                    },
                    height: 300
                };
                
                // Create plot
                Plotly.newPlot(chartContainer, traces, layout, {responsive: true});
            } else {
                // Handle missing data
                const chartContainer = document.querySelector(`#${factor}-chart .chart`);
                chartContainer.innerHTML = '<div class="no-data">Insufficient data available</div>';
                chartContainer.style.display = 'flex';
                chartContainer.style.justifyContent = 'center';
                chartContainer.style.alignItems = 'center';
                chartContainer.style.height = '100%';
                chartContainer.style.color = '#777';
            }
        });
    }
    
    // Create impact summary text
    function createImpactSummary(eventData) {
        const impactText = document.getElementById('impact-text');
        let summaryHtml = '';
        
        if (eventData.is_significant) {
            const factor = eventData.most_significant_factor;
            const pValue = eventData.most_significant_p_value;
            const direction = getFactorDirection(eventData, factor);
            
            summaryHtml += `<p class="significant-finding"><strong>Significant Finding:</strong> `;
            summaryHtml += `${capitalizeFirstLetter(factor)} is a significant factor in medal success for this event (p = ${pValue.toExponential(2)}).</p>`;
            
            // Add interpretation
            summaryHtml += `<p>Medalists tend to have ${direction} ${factor} than non-medalists. `;
            summaryHtml += `This suggests that ${getFactorImplication(factor, direction)} may provide a competitive advantage in ${currentEvent}.</p>`;
            
            // Add details for each factor
            ['height', 'weight', 'age'].forEach(f => {
                if (eventData[f] && eventData[f].p_value !== null) {
                    const significant = eventData[f].significant;
                    const fDirection = getFactorDirection(eventData, f);
                    
                    summaryHtml += `<p><strong>${capitalizeFirstLetter(f)}:</strong> `;
                    
                    if (significant) {
                        summaryHtml += `Medalists have ${fDirection} ${f} (${formatMean(eventData[f].medalist_mean)} vs. ${formatMean(eventData[f].non_medalist_mean)} for non-medalists). `;
                        summaryHtml += `This difference is statistically significant (p = ${eventData[f].p_value.toExponential(2)}).</p>`;
                    } else {
                        summaryHtml += `No significant difference between medalists (${formatMean(eventData[f].medalist_mean)}) and non-medalists (${formatMean(eventData[f].non_medalist_mean)}). `;
                        summaryHtml += `(p = ${eventData[f].p_value.toExponential(2)}).</p>`;
                    }
                }
            });
            
        } else {
            summaryHtml += `<p><strong>No significant genetic factors found.</strong></p>`;
            summaryHtml += `<p>Analysis of height, weight, and age distributions revealed no statistically significant differences between medalists and non-medalists in this event.</p>`;
            
            // Add details for each factor
            ['height', 'weight', 'age'].forEach(f => {
                if (eventData[f] && eventData[f].medalist_mean !== undefined && eventData[f].non_medalist_mean !== undefined) {
                    summaryHtml += `<p><strong>${capitalizeFirstLetter(f)}:</strong> `;
                    summaryHtml += `Medalists average ${formatMean(eventData[f].medalist_mean)} vs. ${formatMean(eventData[f].non_medalist_mean)} for non-medalists. `;
                    
                    if (eventData[f].p_value !== null) {
                        summaryHtml += `This difference is not statistically significant (p = ${eventData[f].p_value.toExponential(2)}).</p>`;
                    } else {
                        summaryHtml += `Insufficient data for statistical analysis.</p>`;
                    }
                }
            });
            
            summaryHtml += `<p>This suggests that success in ${currentEvent} may be more dependent on training, technique, or other non-physical factors.</p>`;
        }
        
        // Add a holistic interpretation
        summaryHtml += `<p class="interpretation"><strong>Interpretation:</strong> `;
        
        if (eventData.is_significant) {
            summaryHtml += `While ${eventData.most_significant_factor} appears to be an important factor in ${currentEvent}, `;
            summaryHtml += `it's important to note that many other variables such as training, technique, psychology, and access to resources `;
            summaryHtml += `also play crucial roles in Olympic success.</p>`;
        } else {
            summaryHtml += `This analysis suggests that physical attributes may be less deterministic in ${currentEvent} `;
            summaryHtml += `compared to other factors like training, technique, psychology, and access to resources.</p>`;
        }
        
        impactText.innerHTML = summaryHtml;
    }
    
    // Helper function to get the direction of the factor (higher/lower)
    function getFactorDirection(eventData, factor) {
        if (!eventData[factor]) return 'similar';
        
        const medalistMean = eventData[factor].medalist_mean;
        const nonMedalistMean = eventData[factor].non_medalist_mean;
        
        if (medalistMean > nonMedalistMean * 1.02) {
            return 'higher';
        } else if (medalistMean < nonMedalistMean * 0.98) {
            return 'lower';
        } else {
            return 'similar';
        }
    }
    
    // Helper function to get implications based on factor and direction
    function getFactorImplication(factor, direction) {
        const implications = {
            height: {
                higher: 'being taller',
                lower: 'being shorter',
                similar: 'height'
            },
            weight: {
                higher: 'greater body mass',
                lower: 'lighter body mass',
                similar: 'weight'
            },
            age: {
                higher: 'more experience',
                lower: 'youth and agility',
                similar: 'age'
            }
        };
        
        return implications[factor][direction];
    }
    
    // Helper function to format mean values with appropriate precision
    function formatMean(value) {
        if (value === undefined || value === null) return 'N/A';
        return value.toFixed(1);
    }
    
    // Helper function to capitalize the first letter of a string
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
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
    
    // Public API
    return {
        init: init,
        showEvent: showEvent
    };
})();