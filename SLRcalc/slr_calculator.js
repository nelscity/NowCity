// --- Configuration ---
const CURRENT_YEAR = 2025;
const BASE_YEAR = 2000; // Baseline year for NOAA projections
const METERS_TO_FEET = 3.28084;

// NOAA 2022 SLR Projections (Median) for Boston, MA (in meters relative to 2000)
// Using the 'High' scenario data as the default "worst-case"
const slrProjections = {
    high: {
        2000: 0.00,
        2050: 0.40,
        2100: 1.20,
        2150: 2.40
        // Add more data points if available/needed for longer lifespans
    }
};

// --- Helper Functions ---

// Linear interpolation function
function interpolate(x, x0, y0, x1, y1) {
    if (x1 === x0) {
        return y0; // Avoid division by zero
    }
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}

// Get projected SLR for a given year (returns value in METERS for the 'High' scenario)
function getProjectedSLR(year, scenarioData) {
    const knownYears = Object.keys(scenarioData).map(Number).sort((a, b) => a - b);

    if (year <= knownYears[0]) {
        return scenarioData[knownYears[0]];
    }

    for (let i = 0; i < knownYears.length - 1; i++) {
        const year0 = knownYears[i];
        const year1 = knownYears[i + 1];
        if (year >= year0 && year <= year1) {
            return interpolate(year, year0, scenarioData[year0], year1, scenarioData[year1]);
        }
    }

    // Extrapolation for years beyond the last known year
    const lastYear = knownYears[knownYears.length - 1];
    const secondLastYear = knownYears.length >= 2 ? knownYears[knownYears.length - 2] : knownYears[0];
     if (year > lastYear) {
         console.warn("Warning: Target year is beyond projection data; extrapolating linearly.");
         if (lastYear === secondLastYear) return scenarioData[lastYear]; // Avoid division by zero if only one point
         return interpolate(year, secondLastYear, scenarioData[secondLastYear], lastYear, scenarioData[lastYear]);
    }

    // Fallback
    return scenarioData[lastYear];
}


// --- Event Listener ---
document.getElementById('calculateBtn').addEventListener('click', () => {
    const lifespanInput = document.getElementById('lifespan');
    const resultDiv = document.getElementById('result');

    const lifespan = parseInt(lifespanInput.value, 10);
    const selectedScenarioKey = 'high'; // Hardcoded to use the 'High' scenario

    if (isNaN(lifespan) || lifespan <= 0) {
        resultDiv.textContent = "Please enter a valid lifespan (positive number of years).";
        // Optional: Add/remove an error class instead of setting style directly
        // resultDiv.classList.add('error');
        return;
    }
    // Optional: remove error class if calculation proceeds
    // resultDiv.classList.remove('error');


    const targetYear = CURRENT_YEAR + lifespan;
    const scenarioData = slrProjections[selectedScenarioKey];

    if (!scenarioData) {
         resultDiv.textContent = "Error: Scenario data not found.";
         // resultDiv.classList.add('error');
         return;
    }

    // Calculate SLR at the target year and current year relative to BASE_YEAR (always in meters)
    const slrTargetMeters = getProjectedSLR(targetYear, scenarioData);
    const slrCurrentMeters = getProjectedSLR(CURRENT_YEAR, scenarioData);

    // Calculate the rise specifically FROM the current year TO the target year (in meters)
    const riseFromNowMeters = slrTargetMeters - slrCurrentMeters;

    // Always calculate feet equivalent
    const riseFromNowFeet = riseFromNowMeters * METERS_TO_FEET;

    // Update result text to display both units
    resultDiv.textContent = `For a ${lifespan}-year lifespan (until ${targetYear}), based on the NOAA 'High' (worst-case planning) scenario, consider building approximately ${riseFromNowMeters.toFixed(2)} meters (${riseFromNowFeet.toFixed(2)} feet) higher than today's mean sea level.`;


});