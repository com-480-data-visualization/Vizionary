<!-- DummyContent.svelte -->
<script>
    export let name = "Content";
  </script>
  
  <div class="w-full h-full p-4 flex flex-col text-center">
    <h2 class="text-center text-gray-800 text-xl font-bold mb-2">{name}</h2>
    <div class="flex-1 bg-gray-100 p-3 rounded">
      <p></p>
      <!-- <p class="text-sm text-gray-500 mt-2">Content data will go here</p> -->
    </div>
  </div>