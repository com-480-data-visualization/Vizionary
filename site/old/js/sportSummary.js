/**
 * Sport Summary Module
 * Creates an overview visualization of genetic factors across different sports
 */
const SportSummary = (function() {
    // Private variables
    let sportData = null;
    
    // Initialize the sport summary view
    function init() {
        // Nothing specific to initialize
    }
    
    // Update the sport summary view with data
    function update(data) {
        sportData = data;
        createSportSummaryChart(data);
    }
    
    // Create the main sport summary chart
    function createSportSummaryChart(data) {
        const container = document.getElementById('sport-summary-chart');
        container.innerHTML = '';
        
        // Process data for plotting
        const sports = Object.keys(data).map(sport => {
            return {
                name: sport,
                factor: data[sport].most_significant_factor,
                p_value: data[sport].p_value,
                is_significant: data[sport].is_significant,
                total_athletes: data[sport].total_athletes,
                total_medalists: data[sport].total_medalists
            };
        });
        
        // Sort by significance and factor
        sports.sort((a, b) => {
            // First group by factor
            if (a.factor !== b.factor) {
                // Handle null factors
                if (!a.factor) return 1;
                if (!b.factor) return -1;
                return a.factor.localeCompare(b.factor);
            }
            
            // Then by significance
            if (a.is_significant !== b.is_significant) {
                return a.is_significant ? -1 : 1;
            }
            
            // Then by p-value
            return a.p_value - b.p_value;
        });
        
        // Create color mapping for factors
        const factors = ['height', 'weight', 'age', null];
        const factorColors = {
            'height': 'rgba(41, 128, 185, 0.8)',
            'weight': 'rgba(39, 174, 96, 0.8)',
            'age': 'rgba(211, 84, 0, 0.8)',
            'null': 'rgba(149, 165, 166, 0.8)'
        };
        
        // Create traces by factor
        const traces = factors.map(factor => {
            const sportsByFactor = sports.filter(s => s.factor === factor);
            
            return {
                type: 'bar',
                name: factor === null ? 'No significant factor' : capitalizeFirstLetter(factor),
                x: sportsByFactor.map(s => s.name),
                y: sportsByFactor.map(s => s.is_significant ? -Math.log10(s.p_value) : 0),
                marker: {
                    color: factorColors[factor === null ? 'null' : factor],
                    line: {
                        color: sportsByFactor.map(s => s.is_significant ? '#fff' : 'transparent'),
                        width: sportsByFactor.map(s => s.is_significant ? 1 : 0)
                    },
                    opacity: sportsByFactor.map(s => s.is_significant ? 1 : 0.5)
                },
                hovertemplate: '%{x}<br>' +
                               'Factor: %{data.name}<br>' +
                               'p-value: %{customdata}<br>' +
                               'Significance: %{text}<extra></extra>',
                customdata: sportsByFactor.map(s => s.p_value ? s.p_value.toExponential(2) : 'N/A'),
                text: sportsByFactor.map(s => s.is_significant ? 'Significant' : 'Not significant')
            };
        }).filter(trace => trace.x.length > 0);
        
        // Create layout
        const layout = {
            title: 'Genetic Factors Across Olympic Sports',
            xaxis: {
                title: 'Sport',
                tickangle: -45
            },
            yaxis: {
                title: '-log10(p-value)',
                hoverformat: '.2f'
            },
            barmode: 'group',
            hovermode: 'closest',
            legend: {
                orientation: 'h',
                y: -0.2
            },
            shapes: [{
                type: 'line',
                x0: -0.5,
                x1: sports.length - 0.5,
                y0: -Math.log10(0.05),
                y1: -Math.log10(0.05),
                line: {
                    color: 'red',
                    width: 2,
                    dash: 'dash'
                }
            }],
            annotations: [{
                x: 0,
                y: -Math.log10(0.05),
                xref: 'paper',
                yref: 'y',
                text: 'Significance threshold (p=0.05)',
                showarrow: true,
                arrowhead: 2,
                ax: 50,
                ay: -20
            }],
            margin: {
                l: 50,
                r: 50,
                t: 50,
                b: 150
            }
        };
        
        // Create the plot
        Plotly.newPlot(container, traces, layout, {responsive: true});
        
        // Add click event for comparing sports
        container.on('plotly_click', function(data) {
            const sport = data.points[0].x;
            showSportComparison(sport);
        });
        
        // Create sport comparison section
        createSportComparisonDefaultView();
    }
    
    // Create the default view for sport comparison
    function createSportComparisonDefaultView() {
        const container = document.getElementById('sport-comparison');
        container.innerHTML = `
            <div class="instruction-panel">
                <h3>Sport Comparison</h3>
                <p>Click on any sport in the chart above to see detailed genetic factor information.</p>
                <p>This will show you how physical attributes like height, weight, and age affect medal chances in that sport.</p>
                <div class="comparison-icons">
                    <i class="fas fa-ruler-vertical fa-2x"></i>
                    <i class="fas fa-weight fa-2x"></i>
                    <i class="fas fa-hourglass-half fa-2x"></i>
                </div>
            </div>
        `;
    }
    
    // Show comparison for a specific sport
    function showSportComparison(sportName) {
        if (!sportData || !sportData[sportName]) return;
        
        const sportInfo = sportData[sportName];
        const container = document.getElementById('sport-comparison');
        
        // Create comparison view
        container.innerHTML = `
            <div class="sport-comparison-card">
                <h3>${sportName}</h3>
                <div class="comparison-stats">
                    <p><strong>Athletes analyzed:</strong> ${sportInfo.total_athletes.toLocaleString()}</p>
                    <p><strong>Medalists:</strong> ${sportInfo.total_medalists.toLocaleString()} (${(sportInfo.total_medalists / sportInfo.total_athletes * 100).toFixed(1)}%)</p>
                </div>
                
                <div class="genetic-factors-summary">
                    <h4>Genetic Factors Impact</h4>
                    ${createGeneticFactorsSummary(sportInfo)}
                </div>
                
                <div class="factor-interpretation">
                    ${createFactorInterpretation(sportName, sportInfo)}
                </div>
                
                <button class="compare-button" onclick="SportSummary.compareAnotherSport()">
                    Compare another sport
                </button>
            </div>
        `;
    }
    
    // Create genetic factors summary HTML
    function createGeneticFactorsSummary(sportInfo) {
        if (!sportInfo.is_significant) {
            return `
                <p class="no-significance">No significant genetic factors were identified for this sport.</p>
                <p>This suggests that success in this sport may depend more on training, technique, skill development, or other non-physical factors.</p>
            `;
        }
        
        const factor = sportInfo.most_significant_factor;
        const pValue = sportInfo.p_value;
        
        return `
            <p class="significance-found">
                <strong>${capitalizeFirstLetter(factor)}</strong> is the most significant genetic factor 
                (p = ${pValue.toExponential(2)}).
            </p>
            <div class="factor-meter">
                <div class="factor-strength" style="width: ${getSignificancePercentage(pValue)}%"></div>
            </div>
            <p class="significance-scale">
                <span>Weak</span>
                <span>Moderate</span>
                <span>Strong</span>
            </p>
        `;
    }
    
    // Create factor interpretation HTML
    function createFactorInterpretation(sportName, sportInfo) {
        if (!sportInfo.is_significant) {
            return `
                <h4>What This Means</h4>
                <p>Athletes of varying body types and ages can potentially excel in ${sportName}.</p>
                <p>Success likely depends more on:</p>
                <ul>
                    <li>Skill development and technique</li>
                    <li>Mental fortitude and strategy</li>
                    <li>Training quality and dedication</li>
                    <li>Team dynamics (for team sports)</li>
                </ul>
            `;
        }
        
        const factor = sportInfo.most_significant_factor;
        
        const interpretations = {
            'height': `
                <h4>Height Advantage</h4>
                <p>In ${sportName}, medalists tend to have a different height profile than non-medalists.</p>
                <p>This advantage may be due to:</p>
                <ul>
                    <li>Longer reach and stride length</li>
                    <li>Mechanical advantage in certain movements</li>
                    <li>Better visibility or positioning</li>
                    <li>Psychological intimidation of opponents</li>
                </ul>
            `,
            'weight': `
                <h4>Weight Advantage</h4>
                <p>In ${sportName}, weight appears to be a significant factor in medal success.</p>
                <p>This advantage may be due to:</p>
                <ul>
                    <li>Greater power output or force generation</li>
                    <li>Improved momentum in contact situations</li>
                    <li>Better stability or balance</li>
                    <li>Optimized strength-to-weight ratio</li>
                </ul>
            `,
            'age': `
                <h4>Age Advantage</h4>
                <p>In ${sportName}, age appears to significantly influence medal chances.</p>
                <p>This advantage may be due to:</p>
                <ul>
                    <li>Greater experience and strategic knowledge</li>
                    <li>Optimized physical development</li>
                    <li>Mental maturity and competitive psychology</li>
                    <li>Accumulated technical refinement</li>
                </ul>
            `
        };
        
        return interpretations[factor] || '';
    }
    
    // Calculate a percentage for the significance meter
    function getSignificancePercentage(pValue) {
        // Convert p-value to a percentage scale
        // p=0.05 (threshold) = 50%
        // p=0.001 = 100%
        // p=1 = 0%
        
        if (pValue >= 0.05) return 50;
        
        const logP = -Math.log10(pValue);
        const logThreshold = -Math.log10(0.05);
        const logStrong = -Math.log10(0.001);
        
        // Scale between 50% and 100%
        return 50 + 50 * Math.min(1, (logP - logThreshold) / (logStrong - logThreshold));
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        if (!string) return 'None';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Public API
    return {
        init: init,
        update: update,
        
        // Allow direct sport comparison from outside
        compareAnotherSport: function() {
            createSportComparisonDefaultView();
        },
        
        showSportComparison: showSportComparison
    };
})();