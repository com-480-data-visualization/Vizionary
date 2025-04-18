<script lang="ts">
	import '../app.css';
	let { children } = $props();
  </script>
  
  <div class="app">
	<main>
	  {@render children()}
	</main>
  </div>
  
  <style>
	.app {
	  display: flex;
	  flex-direction: column;
	  min-height: 100vh;
	  background-color: white;
	}
  
	main {
	  flex: 1;
	  display: flex;
	  flex-direction: column;
	  padding: 1rem;
	  padding-top: 4rem;
	  width: 100%;
	  max-width: 64rem;
	  margin: 0 auto;
	  box-sizing: border-box;
	}
  
	footer {
	  display: flex;
	  flex-direction: column;
	  justify-content: center;
	  align-items: center;
	  padding: 12px;
	  color: #666;
	  font-size: 0.9rem;
	}
  
	footer a {
	  font-weight: bold;
	  color: #4a4a4a;
	  text-decoration: none;
	}
  
	footer a:hover {
	  text-decoration: underline;
	}
  
	@media (min-width: 480px) {
	  footer {
		padding: 12px 0;
	  }
	}
  </style>