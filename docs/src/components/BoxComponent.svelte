<!-- BoxComponent.svelte -->
<script>
    // This component is just a wrapper for content
    // It doesn't create the border or background - that's handled by the parent
    export let title = "Default Title";
  </script>
  
  <div class="flex-1 flex flex-col overflow-hidden">
    <slot />
  </div>