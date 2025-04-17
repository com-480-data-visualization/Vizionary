/**
 * Bubble Chart Module
 * Creates and manages the main Olympics bubble chart visualization
 */
const BubbleChart = (function() {
    // Private variables
    let svg = null;
    let width = 0;
    let height = 0;
    let data = [];
    let simulation = null;
    let yearSelected = null;
    
    // Event handlers for bubble selection
    const clickHandlers = [];
    
    // Initialize the bubble chart
    function init(containerId) {
        const container = document.getElementById(containerId);
        
        // Clear any existing content
        container.innerHTML = '';
        
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
        
        // Create a group for all elements
        const g = svg.append('g')
           .attr('transform', `translate(${0}, ${0})`);
            
        // Add title
        svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .text('Olympic Games 1900-2016');
            
        // Handle window resize
        window.addEventListener('resize', debounce(() => {
            if (container.clientWidth !== width) {
                width = container.clientWidth;
                height = container.clientHeight;
                
                svg.attr('width', width)
                   .attr('height', height)
                   .attr('viewBox', `0 0 ${width} ${height}`);
                   
                // Update simulation
                if (simulation && data.length > 0) {
                    simulation.force('center', d3.forceCenter(width / 2, height / 2));
                    simulation.alpha(0.3).restart();
                }
                
                // Update title position
                svg.select('.chart-title')
                   .attr('x', width / 2);
            }
        }, 250));
        
        return svg;
    }
    
    // Update the bubble chart with new data
    function update(newData) {
        data = newData;
        
        if (!svg) return;
        
        // Size scale for bubbles based on total athletes
        const sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.total_athletes)])
            .range([10, 70]);
            
        // Color scales for summer and winter Olympics
        const summerColorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['rgba(255, 158, 0, 0.3)', 'rgba(255, 158, 0, 0.9)']);
            
        const winterColorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['rgba(79, 195, 247, 0.3)', 'rgba(79, 195, 247, 0.9)']);
        
        // Create bubble nodes
        const bubbleGroup = svg.select('g');
        
        // Create bubble nodes
        const bubbles = bubbleGroup.selectAll('.bubble')
            .data(data, d => d.year);
            
        // Remove old bubbles
        bubbles.exit().remove();
        
        // Create new bubbles
        const newBubbles = bubbles.enter()
            .append('g')
            .attr('class', 'bubble-group');
            
        newBubbles.append('circle')
            .attr('class', 'bubble')
            .attr('r', d => sizeScale(d.total_athletes))
            .attr('fill', d => {
                const colorScale = d.season === 'Summer' ? summerColorScale : winterColorScale;
                return colorScale(d.genetic_impact_ratio);
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .classed('holographic-effect', true);
                    
                const tooltip = d3.select('#bubble-chart')
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
                    <strong>${d.year} ${d.season} Olympics - ${d.city}</strong><br>
                    Athletes: ${d.total_athletes.toLocaleString()}<br>
                    Countries: ${d.total_countries}<br>
                    Events: ${d.total_events}<br>
                    Genetic Impact: ${Math.round(d.genetic_impact_ratio * 100)}%
                `)
                .style('left', (event.pageX) + 'px')
                .style('top', (event.pageY) + 'px')
                .transition()
                .duration(300)
                .style('opacity', 1);
                
                d3.select(this.parentNode).raise();
            })
            .on('mousemove', function(event) {
                d3.select('.tooltip')
                    .style('left', (event.pageX - width/4) + 'px')
                    .style('top', (event.pageY - height/2) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .classed('holographic-effect', false);
                    
                d3.select('.tooltip').remove();
            })
            .on('click', function(event, d) {
                event.stopPropagation();
                
                // Add zoom effect
                d3.select(this.parentNode)
                    .classed('zoom-in', true);
                
                // Reset any previously selected bubbles
                if (yearSelected !== null && yearSelected !== d.year) {
                    bubbleGroup.selectAll('.bubble')
                        .filter(b => b.year === yearSelected)
                        .classed('selected', false);
                }
                
                // Set current selection
                yearSelected = d.year;
                d3.select(this).classed('selected', true);
                
                // Notify click handlers
                clickHandlers.forEach(handler => handler(d));
                
                // After animation, redirect to detail view
                setTimeout(() => {
                    d3.select(this.parentNode)
                        .classed('zoom-in', false);
                }, 1000);
            });
            
        // Add year labels
        newBubbles.append('text')
            .attr('class', 'bubble-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '.3em')
            .style('pointer-events', 'none')
            .text(d => d.year);
            
        // Merge enter + update
        const allBubbles = bubbles.merge(newBubbles);
        
        // Setup force simulation
        simulation = d3.forceSimulation(data)
            .force('charge', d3.forceManyBody().strength(5))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => sizeScale(d.total_athletes) + 2))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05))
            .on('tick', () => {
                allBubbles.attr('transform', d => `translate(${d.x}, ${d.y})`);
            });
            
        // Custom force to separate summer and winter Olympics
        simulation.force('season', function(alpha) {
            const summerY = height * 0.4;
            const winterY = height * 0.6;
            const strength = 0.2;
            
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                const targetY = d.season === 'Summer' ? summerY : winterY;
                d.y += (targetY - d.y) * strength * alpha;
            }
        });
            
        // Custom force to spread Olympics by year
        simulation.force('year', function(alpha) {
            const yearExtent = d3.extent(data, d => d.year);
            const yearScale = d3.scaleLinear()
                .domain(yearExtent)
                .range([width * 0.1, width * 0.9]);
                
            const strength = 0.3;
            
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                const targetX = yearScale(d.year);
                d.x += (targetX - d.x) * strength * alpha;
            }
        });
            
        // Create timeline
        createTimeline(data);
    }
    
    // Create a timeline below the bubble chart
    function createTimeline(data) {
        return; 
        const timelineContainer = document.getElementById('timeline-slider');
        timelineContainer.innerHTML = '';
        
        const margin = {top: 10, right: 30, bottom: 10, left: 30};
        const timelineWidth = timelineContainer.clientWidth - margin.left - margin.right;
        const timelineHeight = timelineContainer.clientHeight - margin.top - margin.bottom;
        
        const timelineSvg = d3.select(timelineContainer)
            .append('svg')
            .attr('width', timelineContainer.clientWidth)
            .attr('height', timelineContainer.clientHeight)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
            
        // Year scale
        const years = data.map(d => d.year);
        const xScale = d3.scaleLinear()
            .domain([d3.min(years), d3.max(years)])
            .range([0, timelineWidth]);
            
        // Draw axis
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d => d)
            .ticks(10);
            
        timelineSvg.append('g')
            .attr('transform', `translate(0, 100)`)
            .call(xAxis);
            
        // Draw circles on timeline
        timelineSvg.selectAll('.timeline-marker')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'timeline-marker')
            .attr('cx', d => xScale(d.year))
            .attr('cy', timelineHeight / 2)
            .attr('r', 5)
            .attr('fill', d => d.season === 'Summer' ? 'var(--summer-color)' : 'var(--winter-color)')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('r', 8);
                    
                timelineSvg.append('text')
                    .attr('class', 'timeline-label')
                    .attr('x', xScale(d.year))
                    .attr('y', timelineHeight / 2 )
                    .attr('text-anchor', 'middle')
                    .style('font-size', '12px')
                    .text(`${d.year} ${d.city}`);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('r', 5);
                    
                timelineSvg.selectAll('.timeline-label').remove();
            })
            .on('click', function(event, d) {
                // Highlight the corresponding bubble
                const bubble = svg.selectAll('.bubble')
                    .filter(b => b.year === d.year);
                    
                // Trigger bubble click event
                bubble.dispatch('click');
            });
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
        update: update,
        
        // Add a click handler for bubble selection
        onBubbleClick: function(handler) {
            if (typeof handler === 'function') {
                clickHandlers.push(handler);
            }
            return this;
        }
    };
})();