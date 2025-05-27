<!-- BoxComponent.svelte -->
<script>
    // This component is just a wrapper for content
    // It doesn't create the border or background - that's handled by the parent
    export let title = "Default Title";
  </script>
  
  <slot />