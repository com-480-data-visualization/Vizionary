<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="layout">
  <main>
    {@render children()}
  </main>
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: rgb(255, 255, 255);
    color: #000000;
    font-family: 'Inter', sans-serif;
  }

  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
  }
</style>
