<script lang="ts">
    let { children } = $props();
  </script>
  
    <main>
      {@render children()}
    </main>
  
  <style>
    main {
      flex: 1;
      width: 100%;
      box-sizing: border-box;
    }}
  </style>
  