<!-- App.svelte (or your main page) -->
<script>
    import ParallelCoordinates from '../../components/ParallelCoordinates.svelte';
import BoxComponent from './../../components/BoxComponent.svelte';
    import DummyContent from './../../components/DummyContent.svelte';
  </script>
  
  <div class="m-0 p-0 h-screen w-screen bg-gray-100">
    <div class="h-screen w-full flex flex-col">
      <!-- Header -->
      <div class="header flex justify-center p-4">
        <span class="font-bold text-3xl text-gray-700">Basketball</span>
      </div>
      
      <!-- Main content area -->
      <div class="flex flex-col flex-1 w-full p-2 gap-4">
        <!-- Top row -->
        <div class="flex flex-row flex-1 w-full gap-4">
          <!-- Top left section - 3/5 width -->
          <div class="w-3/5 h-full bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
            <BoxComponent title="">
              <DummyContent name="WorldMap (Flavia)" />
            </BoxComponent>
          </div>
          
          <!-- Top right section - divided horizontally - 2/5 width -->
          <div class="w-2/5 h-full flex flex-col gap-4">
            <!-- Top right upper section -->
            <div class="w-full h-1/2 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
              <BoxComponent title="Top Right Upper">
                <DummyContent name="Basic sport info (Flavia)" />
              </BoxComponent>
            </div>
            
            <!-- Top right lower section -->
            <div class="w-full h-1/2 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
              <BoxComponent title="Top Right Lower">
                <DummyContent name="Similar sports (Arthur)" />
              </BoxComponent>
            </div>
          </div>
        </div>
        
        <!-- Bottom row - divided into 3 sections -->
        <div class="flex flex-row flex-1 w-full gap-4">
          <!-- Bottom left section -->
          <div class="w-1/3 h-full bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
            <BoxComponent title="Bottom Left">
              <ParallelCoordinates />
            </BoxComponent>
          </div>
          
          <!-- Bottom middle section -->
          <div class="w-1/3 h-full bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
            <BoxComponent title="Bottom Middle">
              <DummyContent name="Heatmap (David)" />
            </BoxComponent>
          </div>
          
          <!-- Bottom right section -->
          <div class="w-1/3 h-full bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm p-3">
            <BoxComponent title="Bottom Right">
              <DummyContent name="Radial stacked bar chart (David)" />
            </BoxComponent>
          </div>
        </div>
      </div>
    </div>
  </div>