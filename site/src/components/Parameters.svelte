<script lang='ts'>
  // Define the interface for our filter parameters
  type FilterParams = {
    startYear?: number;
    endYear?: number;
    gender?: 'male' | 'female' | 'all';
    medals?: {
      gold: boolean;
      silver: boolean;
      bronze: boolean;
      noMedal: boolean;
    };
  }

  // Using $bindable for two-way binding with parent
  let { 
    startYear = $bindable(1900), 
    endYear = $bindable(2016),
    gender = $bindable('all'),
    medals = $bindable({
      gold: true,
      silver: true,
      bronze: true,
      noMedal: false
    })
  }: FilterParams = $props();

  // Constants for the component
  const MIN_YEAR = 1900;
  const MAX_YEAR = 2016;
  const MEDAL_TYPES = [
    { key: 'gold', label: 'Gold', color: '#FFD700' },
    { key: 'silver', label: 'Silver', color: '#C0C0C0' },
    { key: 'bronze', label: 'Bronze', color: '#CD7F32' },
    { key: 'noMedal', label: 'No Medal', color: '#6c757d' }
  ];

  // Internal state for validation
  let errors = $state({
    yearRange: false
  });

  // Derived states
  const yearRange = $derived(endYear - startYear + 1);
  const selectedMedalCount = $derived(
    Object.values(medals).filter(Boolean).length
  );
  const isValidRange = $derived(startYear <= endYear);

  // Effect to validate year range
  $effect(() => {
    errors.yearRange = !isValidRange;
  });

  // Handler functions
  function handleStartYearChange(event) {
    const value = parseInt(event.target.value);
    if (value >= MIN_YEAR && value <= MAX_YEAR) {
      startYear = value;
      // Auto-adjust end year if it becomes invalid
      if (endYear < value) {
        endYear = value;
      }
    }
  }

  function handleEndYearChange(event) {
    const value = parseInt(event.target.value);
    if (value >= MIN_YEAR && value <= MAX_YEAR) {
      endYear = value;
      // Auto-adjust start year if it becomes invalid
      if (startYear > value) {
        startYear = value;
      }
    }
  }

  function handleGenderChange(event) {
    gender = event.target.value;
  }

  function handleMedalToggle(medalType) {
    medals[medalType] = !medals[medalType];
  }

  function selectAllMedals() {
    medals = {
      gold: true,
      silver: true,
      bronze: true,
      noMedal: true
    };
  }

  function deselectAllMedals() {
    medals = {
      gold: false,
      silver: false,
      bronze: false,
      noMedal: false
    };
  }

  function resetToDefaults() {
    startYear = 1902;
    endYear = 2016;
    gender = 'all';
    medals = {
      gold: true,
      silver: true,
      bronze: true,
      noMedal: false
    };
  }
</script>

<div class="olympic-filter">
  <!-- Year Range Section -->
  <div class="filter-section">
    <h4>📅 Year Range</h4>
    <div class="year-inputs">
      <div class="input-group">
        <label for="start-year">Start Year:</label>
        <input 
          id="start-year"
          type="number" 
          min={MIN_YEAR} 
          max={MAX_YEAR}
          value={startYear}
          onchange={handleStartYearChange}
          class:error={errors.yearRange}
        />
      </div>
      <div class="range-separator">to</div>
      <div class="input-group">
        <label for="end-year">End Year:</label>
        <input 
          id="end-year"
          type="number" 
          min={MIN_YEAR} 
          max={MAX_YEAR}
          value={endYear}
          onchange={handleEndYearChange}
          class:error={errors.yearRange}
        />
      </div>
    </div>
    <div class="year-info">
      {#if isValidRange}
        <!-- <span class="info-text">
          📊 Selected range: {yearRange} years ({startYear}-{endYear})
        </span> -->
      {:else}
        <span class="error-text">
          ⚠️ Invalid range: Start year must be less than or equal to end year
        </span>
      {/if}
    </div>
  </div>

  <!-- Gender Section -->
  <div class="filter-section">
    <h4>👥 Gender</h4>
    <div class="gender-options">
      {#each ['female', 'male', 'all'] as genderOption}
        <label class="radio-label">
          <input 
            type="radio" 
            name="gender" 
            value={genderOption}
            checked={gender === genderOption}
            onchange={handleGenderChange}
           class='appearance-none'/>
          <span class="gender-icon">
            {genderOption === 'male' ? '👨' : genderOption === 'female' ? '👩' : '👥'}
          </span>
          {genderOption.charAt(0).toUpperCase()}
        </label>
      {/each}
    </div>
  </div>

  <!-- Medal Types Section -->
  <div class="filter-section">
    <h4>🏆 Medal Types</h4>
    <!-- <div class="medal-controls">
      <button class="control-btn" onclick={selectAllMedals}>
        Select All
      </button>
      <button class="control-btn" onclick={deselectAllMedals}>
        Deselect All
      </button>
    </div> -->
    <div class="medal-options">
      {#each MEDAL_TYPES as medal}
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            checked={medals[medal.key]}
            onchange={() => handleMedalToggle(medal.key)}
          />
          <span 
            class="medal-indicator" 
            style="background-color: {medal.color}"
          ></span>
          {medal.label}
        </label>
      {/each}
    </div>
    <div class="medal-summary">
      <!-- Selected: {selectedMedalCount} of {MEDAL_TYPES.length} medal types -->
    </div>
  </div>

  <!-- Current Selection Summary -->
  <!-- <div class="filter-summary">
    <h4>📋 Current Selection</h4>
    <div class="summary-grid">
      <div><strong>Years:</strong> {startYear} - {endYear}</div>
      <div><strong>Gender:</strong> {gender.charAt(0).toUpperCase() + gender.slice(1)}</div>
      <div><strong>Medals:</strong> 
        {Object.entries(medals)
          .filter(([_, selected]) => selected)
          .map(([type, _]) => MEDAL_TYPES.find(m => m.key === type)?.label)
          .join(', ') || 'None selected'}
      </div>
    </div>
  </div> -->
</div>

<style>
  .olympic-filter {
    /* border: 2px solid #007bff; */
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1rem;
    /* background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); */
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    /* box-shadow: 0 4px 6px rgba(0, 123, 255, 0.1); */
  }
/* 
  .filter-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #dee2e6;
  } */

  .filter-section h4 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1.1rem;
  }

  /* Year Range Styles */
  .year-inputs {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .input-group label {
    font-size: 0.9rem;
    color: #6c757d;
    font-weight: 500;
  }

  .input-group input {
    padding: 0.5rem;
    border: 2px solid #ced4da;
    border-radius: 4px;
    width: 100px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }

  .input-group input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .input-group input.error {
    border-color: #dc3545;
  }

  .range-separator {
    font-weight: bold;
    color: #6c757d;
    margin-top: 1.5rem;
  }

  .year-info {
    margin-top: 0.5rem;
  }

  .error-text {
    color: #dc3545;
    font-size: 0.9rem;
  }

  /* Gender Styles */
  .gender-options {
    display: flex;
    gap: 1rem;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    background: #f8f9fa;
    transition: all 0.2s ease;
  }

  .radio-label:hover {
    background: #e9ecef;
    border-color: #007bff;
  }

  .radio-label:has(input:checked) {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .gender-icon {
    font-size: 1.2rem;
  }


  .medal-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background 0.2s ease;
  }

  .checkbox-label:hover {
    background: #f8f9fa;
  }

  .medal-indicator {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #dee2e6;
  }

  .medal-summary {
    font-size: 0.9rem;
    color: #6c757d;
    font-style: italic;
  }


  .summary-grid {
    display: grid;
    gap: 0.5rem;
  }

  .summary-grid div {
    padding: 0.25rem 0;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .year-inputs {
      flex-direction: column;
      align-items: stretch;
    }

    .range-separator {
      text-align: center;
      margin: 0.5rem 0;
    }

    .gender-options {
      flex-direction: column;
    }

    .medal-options {
      grid-template-columns: 1fr;
    }
  }
</style>