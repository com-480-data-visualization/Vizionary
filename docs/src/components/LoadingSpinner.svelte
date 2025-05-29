<div class="flex items-center justify-center h-full w-full">
    <div
      class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
    ></div>
    <p class="ml-4 text-gray-600">Loading...</p>
  </div>
  
  <style>
    /* Optional: if you want more control over the spinner appearance */
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  </style>