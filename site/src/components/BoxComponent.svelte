<!-- BoxComponent.svelte -->
<script>
    // This component is just a wrapper for content
    // It doesn't create the border or background - that's handled by the parent
    export let title = "Default Title";
  </script>
  
  <div class="w-full h-full flex flex-col">
    <div class="flex-1 overflow-auto">
      <!-- The <slot> allows child components to be inserted here -->
      <slot />
    </div>
  </div>