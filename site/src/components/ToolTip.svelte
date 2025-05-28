<!-- CleanTooltip.svelte -->
<script>
    let {
      children,
      content = 'Tooltip text',
      position = 'top', // 'top' or 'bottom'
      html = false // Set to true to render HTML content
    } = $props();
  
    let showTooltip = $state(false);
    let triggerElement = $state(null);
    let tooltipPosition = $state({ x: 0, y: 0 });
  
    function handleMouseEnter() {
      if (triggerElement) {
        updateTooltipPosition();
      }
      showTooltip = true;
    }
  
    function handleMouseLeave() {
      showTooltip = false;
    }
  
    function updateTooltipPosition() {
      if (!triggerElement) return;
      
      const rect = triggerElement.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      const offset = 8; // Distance from trigger element
      
      let x = rect.left + scrollX + rect.width / 2;
      let y;
      
      if (position === 'bottom') {
        y = rect.bottom + scrollY + offset;
      } else { // default to 'top'
        y = rect.top + scrollY - offset;
      }
      
      tooltipPosition = { x, y };
    }
  </script>
  
  <span 
    class="tooltip-wrapper"
    bind:this={triggerElement}
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
  >
    {@render children()}
  </span>
  
  <!-- Portal the tooltip to escape stacking contexts -->
  {#if showTooltip && typeof document !== 'undefined'}
    <div
      class="tooltip-portal tooltip-{position}"
      style:left="{tooltipPosition.x}px"
      style:top="{tooltipPosition.y}px"
    >
      {#if html}
        {@html content}
      {:else}
        {content}
      {/if}
      <div class="tooltip-arrow arrow-{position}"></div>
    </div>
  {/if}
  
  <style>
    .tooltip-wrapper {
      cursor: pointer;
      display: inline;
    }
  
    :global(.tooltip-portal) {
      position: absolute;
      z-index: 999999;
      padding: 8px 12px;
      background: white;
      color: #374151;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.4;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid #e5e7eb;
      animation: tooltipFadeIn 0.2s ease-out;
    }
  
    /* Allow line breaks when HTML is used */
    :global(.tooltip-portal:has(*)) {
      white-space: normal;
      max-width: 300px;
    }
  
    /* Style common HTML elements inside tooltip */
    :global(.tooltip-portal strong),
    :global(.tooltip-portal b) {
      font-weight: 600;
      color: #111827;
    }
  
    :global(.tooltip-portal em),
    :global(.tooltip-portal i) {
      font-style: italic;
    }
  
    :global(.tooltip-portal .text-blue) {
      color: #3b82f6;
    }
  
    :global(.tooltip-portal .text-red) {
      color: #ef4444;
    }
  
    :global(.tooltip-portal .text-green) {
      color: #10b981;
    }
  
    :global(.tooltip-portal .text-yellow) {
      color: #f59e0b;
    }
  
    :global(.tooltip-portal .text-purple) {
      color: #8b5cf6;
    }
  
    :global(.tooltip-portal small) {
      font-size: 12px;
      opacity: 0.8;
    }
  
    :global(.tooltip-portal .highlight) {
      background: #fef3c7;
      padding: 1px 3px;
      border-radius: 2px;
    }
  
    :global(.tooltip-top) {
      transform: translate(-50%, -100%);
    }
  
    :global(.tooltip-bottom) {
      transform: translate(-50%, 0%);
    }
  
    :global(.tooltip-arrow) {
      position: absolute;
      width: 0;
      height: 0;
    }
  
    :global(.arrow-top) {
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid white;
      filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.1));
    }
  
    :global(.arrow-bottom) {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid white;
      filter: drop-shadow(0 -2px 1px rgba(0, 0, 0, 0.1));
    }
  
    @keyframes tooltipFadeIn {
      from {
        opacity: 0;
        transform: translate(-50%, -100%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -100%) scale(1);
      }
    }
  
    :global(.tooltip-bottom) {
      animation: tooltipFadeInBottom 0.2s ease-out;
    }
  
    @keyframes tooltipFadeInBottom {
      from {
        opacity: 0;
        transform: translate(-50%, 0%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0%) scale(1);
      }
    }
  </style><!-- CleanTooltip.svelte -->