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
    attribute?: 'height' | 'weight' | 'age'; // New attribute parameter
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
    }),
    attribute = $bindable('height') // Default value for the new attribute
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
  const ATTRIBUTES = ['height', 'weight', 'age']; // Options for the new attribute

  // Internal state for validation
  let errors = $state({
    yearRange: false
  });

  // Derived states
  const isValidRange = $derived(startYear <= endYear);

  // Effect to validate year range
  $effect(() => {
    errors.yearRange = !isValidRange;
  });

  // Handler functions
  function handleStartYearChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);
    if (value >= MIN_YEAR && value <= MAX_YEAR) {
      startYear = value;
      if (endYear < value) {
        endYear = value;
      }
    }
  }

  function handleEndYearChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);
    if (value >= MIN_YEAR && value <= MAX_YEAR) {
      endYear = value;
      if (startYear > value) {
        startYear = value;
      }
    }
  }

  function handleGenderChange(event: Event) {
    const input = event.target as HTMLInputElement;
    gender = input.value as 'male' | 'female' | 'all';
  }

  function handleMedalToggle(medalType: 'gold' | 'silver' | 'bronze' | 'noMedal') {
    medals[medalType] = !medals[medalType];
  }

  function handleAttributeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    attribute = input.value as 'height' | 'weight' | 'age';
  }
</script>

<div class="olympic-filter">
  <div class="filter-group">
    <div class="filter-section">
      <h4>📅 Year Range</h4>
      <div class="input-row">
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
        <span class="range-separator">to</span>
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
      {#if !isValidRange}
        <span class="error-text">
          ⚠️ Invalid range: Start year must be less than or equal to end year
        </span>
      {/if}
    </div>

    <div class="filter-section">
      <h4>👥 Gender</h4>
      <div class="options-grid">
        {#each ['female', 'male', 'all'] as genderOption}
          <label class="radio-label">
            <input 
              type="radio" 
              name="gender" 
              value={genderOption}
              checked={gender === genderOption}
              onchange={handleGenderChange}
              class="hidden-radio"
            />
            <span class="custom-radio"></span>
            <span class="gender-icon">
              {genderOption === 'male' ? '👨' : genderOption === 'female' ? '👩' : '👥'}
            </span>
            {genderOption.charAt(0).toUpperCase() + genderOption.slice(1)}
          </label>
        {/each}
      </div>
    </div>
  </div>

  <div class="filter-group">
    <div class="filter-section">
      <h4>🏆 Medal Types</h4>
      <div class="options-grid">
        {#each MEDAL_TYPES as medal}
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              checked={medals[medal.key]}
              onchange={() => handleMedalToggle(medal.key)}
              class="hidden-checkbox"
            />
            <span class="custom-checkbox" style="--medal-color: {medal.color};"></span>
            {medal.label}
          </label>
        {/each}
      </div>
    </div>

    <div class="filter-section">
      <h4>📊 Attributes</h4>
      <div class="options-grid">
        {#each ATTRIBUTES as attrOption}
          <label class="radio-label">
            <input 
              type="radio" 
              name="attribute" 
              value={attrOption}
              checked={attribute === attrOption}
              onchange={handleAttributeChange}
              class="hidden-radio"
            />
            <span class="custom-radio"></span>
            {attrOption.charAt(0).toUpperCase() + attrOption.slice(1)}
          </label>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .olympic-filter {
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1.5rem;
    border-radius: 12px;
    /* background-color: #f4f7f6; */
    /* border: 1px solid #e0e6ea; */

    /* --- Add these properties for scrollability --- */
    max-height: 45vh; 
    /* Or any height you deem appropriate, e.g., 80vh for 80% of viewport height */
    overflow-y: auto; /* Adds scrollbar only when content overflows vertically */
    /* overflow-y: scroll; will always show the scrollbar */
    /* ------------------------------------------- */
  }

  .filter-group {
    flex: 1; /* Each group takes equal space, allowing wrapping */
    min-width: 280px; /* Minimum width for each group before wrapping */
    display: flex;
    flex-direction: column;
    gap: 1.5rem; /* Space between filter sections within a group */
  }

  .filter-section {
    background: white;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    border: 1px solid #e9ecef;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .filter-section h4 {
    margin: 0 0 1rem 0;
    color: #343a40;
    font-size: 1.15rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Input Row for Year Range */
  .input-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .input-group label {
    font-size: 0.85rem;
    color: #555;
    font-weight: 500;
  }

  .input-group input[type="number"] {
    padding: 0.6rem 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 6px;
    width: 90px; /* Fixed width for number inputs */
    font-size: 1rem;
    color: #343a40;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .input-group input[type="number"]:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }

  .input-group input.error {
    border-color: #dc3545;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25);
  }

  .range-separator {
    font-weight: bold;
    color: #6c757d;
    margin-top: 1.25rem; /* Align with input labels */
  }

  .error-text {
    color: #dc3545;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    display: block; /* Ensures it takes its own line */
  }

  /* Radio and Checkbox Options Grid */
  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  /* Hidden native inputs for accessibility */
  .hidden-radio,
  .hidden-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  /* Custom Radio Button */
  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    padding: 0.6rem 1rem;
    border: 1px solid #dcdfe3;
    border-radius: 8px;
    background: #fdfdfd;
    color: #495057;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }

  .radio-label:hover {
    background: #e9ecef;
    border-color: #c4d8f2;
  }

  .radio-label:has(.hidden-radio:checked) {
    background: #007bff;
    color: white;
    border-color: #007bff;
    box-shadow: 0 2px 5px rgba(0, 123, 255, 0.2);
  }

  .custom-radio {
    width: 18px;
    height: 18px;
    border: 2px solid #adb5bd;
    border-radius: 50%;
    display: inline-block;
    position: relative;
    transition: all 0.2s ease;
    flex-shrink: 0; /* Prevent it from shrinking */
  }

  .radio-label:has(.hidden-radio:checked) .custom-radio {
    border-color: white;
    background-color: white;
  }

  .radio-label:has(.hidden-radio:checked) .custom-radio::after {
    content: '';
    width: 8px;
    height: 8px;
    background-color: #007bff;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  /* Custom Checkbox */
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    padding: 0.6rem 1rem;
    border: 1px solid #dcdfe3;
    border-radius: 8px;
    background: #fdfdfd;
    color: #495057;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }

  .checkbox-label:hover {
    background: #e9ecef;
    border-color: #c4d8f2;
  }

  .checkbox-label:has(.hidden-checkbox:checked) {
    background: #007bff;
    color: white;
    border-color: #007bff;
    box-shadow: 0 2px 5px rgba(0, 123, 255, 0.2);
  }

  .custom-checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid var(--medal-color, #adb5bd); /* Use medal color for border */
    border-radius: 4px;
    display: inline-block;
    position: relative;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .checkbox-label:has(.hidden-checkbox:checked) .custom-checkbox {
    background-color: var(--medal-color, #007bff); /* Fill with medal color */
    border-color: var(--medal-color, #007bff);
  }

  .checkbox-label:has(.hidden-checkbox:checked) .custom-checkbox::after {
    content: '✓';
    color: white;
    font-size: 14px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    line-height: 1;
  }

  /* Gender icons */
  .gender-icon {
    font-size: 1.1em;
    line-height: 1;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .olympic-filter {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    .filter-group {
      min-width: unset; /* Remove min-width on small screens */
      width: 100%; /* Take full width */
    }

    .input-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .range-separator {
      margin-top: 0;
      align-self: center; /* Center "to" when stacked vertically */
    }

    .input-group input[type="number"] {
      width: 100%; /* Full width inputs on small screens */
    }

    .options-grid {
      grid-template-columns: 1fr; /* Stack options vertically */
    }
  }
</style>