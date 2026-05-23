// data_fetcher.js - Fetches live data from Google Sheets every 5 minutes
// This script handles the real-time data pipeline from your Google Sheet to the dashboard

// ==================== Configuration ====================
const SHEET_ID = '1NQq4h5uu3ci3KS-HJ4LR2d5N6yhAb3wly5yM1tj8gOM';

// Tab names in your Google Sheet
const TABS = [
    'weekly_spends',
    'daily_spends', 
    'weekly',
    'daily',
    'daily_adset',
    'weekly_adset'
];

// Cache to avoid excessive API calls
let dataCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 1000; // 30 seconds

// ==================== CSV to JSON Converter ====================

/**
 * Parse CSV text and convert to JSON array
 * Handles quoted fields, commas within quotes, and type conversion
 */
function csvToJson(csvText) {
    if (!csvText || csvText.trim() === '') {
        console.warn('Empty CSV text provided');
        return [];
    }

    try {
        const lines = csvText.trim().split('\n');
        if (lines.length < 1) return [];

        // Parse headers
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine);

        // Parse data rows
        const json = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue; // Skip empty lines

            try {
                const values = parseCSVLine(lines[i]);
                const obj = {};

                headers.forEach((header, index) => {
                    let value = values[index] || '';
                    value = value.trim();

                    // Type conversion
                    if (value === '' || value === 'null' || value === 'NULL') {
                        obj[header] = null;
                    } else if (value === 'true') {
                        obj[header] = true;
                    } else if (value === 'false') {
                        obj[header] = false;
                    } else if (!isNaN(value) && value !== '') {
                        obj[header] = parseFloat(value);
                    } else {
                        obj[header] = value;
                    }
                });

                if (Object.keys(obj).length > 0) {
                    json.push(obj);
                }
            } catch (lineError) {
                console.warn(`Error parsing line ${i}:`, lineError);
                continue;
            }
        }

        return json;
    } catch (error) {
        console.error('Error in csvToJson:', error);
        return [];
    }
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

// ==================== Google Sheets Data Fetching ====================

/**
 * Fetch a single tab from Google Sheets as CSV
 * Uses Google Sheets API export feature (no authentication needed)
 */
async function fetchTabAsCSV(tabName) {
    // Format: https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet={SHEET}
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${tabName}`;

    try {
        console.log(`  📡 Fetching ${tabName}...`);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csv = await response.text();
        console.log(`  ✓ ${tabName}: ${csv.split('\n').length - 1} rows`);
        return csv;
    } catch (error) {
        console.error(`  ✗ Error fetching tab ${tabName}:`, error);
        throw error;
    }
}

/**
 * Fetch all tabs from Google Sheets and convert to JSON
 */
async function fetchGoogleSheetsData() {
    const now = Date.now();

    // Return cached data if still fresh
    if (dataCache.data && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('📦 Using cached data');
        return dataCache.data;
    }

    const data = {};
    const results = [];

    console.log('🔄 Fetching data from Google Sheets...');
    console.time('Total fetch time');

    try {
        // Fetch all tabs in parallel
        const promises = TABS.map(async (tabName) => {
            try {
                const csv = await fetchTabAsCSV(tabName);
                const json = csvToJson(csv);
                data[tabName] = json;
                return { tab: tabName, rows: json.length, status: 'ok' };
            } catch (error) {
                console.error(`Failed to fetch ${tabName}:`, error);
                return { tab: tabName, error: error.message, status: 'error' };
            }
        });

        const allResults = await Promise.all(promises);

        // Log results
        console.table(allResults);
        console.timeEnd('Total fetch time');

        // Check for failures
        const failures = allResults.filter(r => r.status === 'error');
        if (failures.length > 0) {
            throw new Error(`Failed to fetch ${failures.length} tabs`);
        }

        // Cache the data
        dataCache.data = data;
        lastFetchTime = now;

        console.log(`✅ Successfully loaded ${TABS.length} tabs`);
        return data;

    } catch (error) {
        console.error('❌ Error fetching Google Sheets data:', error);
        throw error;
    }
}

// ==================== Data Processing ====================

/**
 * Apply focus shows filter to data
 */
function filterFocusShows(data) {
    if (!CONFIG || !CONFIG.FOCUS_SHOWS) {
        console.warn('CONFIG not loaded, skipping focus shows filter');
        return data;
    }

    const focusSet = new Set(CONFIG.FOCUS_SHOWS);
    const filtered = { ...data };

    // Filter tabs that have 'First Listening Show Title' column
    ['weekly', 'daily', 'weekly_adset', 'daily_adset'].forEach(tabName => {
        if (filtered[tabName]) {
            filtered[tabName] = filtered[tabName].filter(
                row => focusSet.has(row['First Listening Show Title'])
            );
            console.log(`  Filtered ${tabName}: ${filtered[tabName].length} rows (focus shows only)`);
        }
    });

    return filtered;
}

/**
 * Remove iOS-tagged adsets from Android data
 */
function removeIOSAdsets(data) {
    const cleaned = { ...data };

    ['weekly_adset', 'daily_adset'].forEach(tabName => {
        if (cleaned[tabName]) {
            const before = cleaned[tabName].length;
            cleaned[tabName] = cleaned[tabName].filter(
                row => !row['Adset']?.includes('|| IOS ||')
            );
            const removed = before - cleaned[tabName].length;
            if (removed > 0) {
                console.log(`  Removed ${removed} iOS-tagged rows from ${tabName}`);
            }
        }
    });

    return cleaned;
}

/**
 * Apply all data processing rules
 */
function processData(data) {
    console.log('⚙️ Processing data...');
    
    let processed = data;
    
    // Rule: Remove iOS-tagged adsets
    processed = removeIOSAdsets(processed);
    
    // Rule: Filter to focus shows
    processed = filterFocusShows(processed);
    
    console.log('✓ Data processing complete');
    return processed;
}

// ==================== Public API ====================

/**
 * Main function: Load and process live data
 * Can be called from index.html or other scripts
 */
async function loadLiveData() {
    try {
        console.log('📥 Loading live data from Google Sheets...');
        const rawData = await fetchGoogleSheetsData();
        const processedData = processData(rawData);
        
        console.log('✅ Data loaded successfully');
        console.log('Available tabs:', Object.keys(processedData));
        
        return processedData;
    } catch (error) {
        console.error('❌ Failed to load live data:', error);
        throw error;
    }
}

/**
 * Get cached data (if available)
 */
function getCachedData() {
    return dataCache.data || null;
}

/**
 * Clear cache (useful for manual refresh)
 */
function clearCache() {
    dataCache = {};
    lastFetchTime = 0;
    console.log('🗑️ Cache cleared');
}

/**
 * Get data freshness info
 */
function getDataStatus() {
    const now = Date.now();
    const age = now - lastFetchTime;
    const isFresh = age < CACHE_DURATION;
    
    return {
        hasCachedData: !!dataCache.data,
        ageMs: age,
        ageSeconds: Math.round(age / 1000),
        isFresh: isFresh,
        cacheExpiresIn: Math.max(0, CACHE_DURATION - age)
    };
}

// ==================== Auto-refresh Timer ====================

/**
 * Set up automatic data refresh
 */
function setupAutoRefresh(intervalMs = 5 * 60 * 1000) {
    console.log(`⏱️ Auto-refresh enabled (interval: ${intervalMs / 1000 / 60} minutes)`);
    
    setInterval(async () => {
        try {
            console.log('🔄 Auto-refresh: Fetching fresh data...');
            await loadLiveData();
            console.log('✓ Auto-refresh complete');
        } catch (error) {
            console.error('✗ Auto-refresh failed:', error);
        }
    }, intervalMs);
}

// ==================== Logging & Debugging ====================

/**
 * Log detailed data summary
 */
function logDataSummary(data) {
    console.group('📊 Data Summary');
    Object.entries(data).forEach(([tab, rows]) => {
        console.log(`${tab}: ${rows.length} rows`, rows);
    });
    console.groupEnd();
}

/**
 * Export data as JSON (for debugging)
 */
function exportDataAsJSON(data) {
    return JSON.stringify(data, null, 2);
}

// ==================== Error Handling ====================

// Suppress ResizeObserver errors (common with Chart.js)
window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('ResizeObserver')) {
        console.log('[ResizeObserver suppressed]');
        event.preventDefault();
    }
});

// ==================== Test/Debug Commands ====================

// Make functions available in console for debugging
window.__DASHBOARD_DEBUG = {
    loadLiveData,
    getCachedData,
    clearCache,
    getDataStatus,
    logDataSummary,
    exportDataAsJSON,
    fetchGoogleSheetsData,
    csvToJson,
};

console.log('%c✓ Data Fetcher Loaded', 'color: #0F6E56; font-weight: bold; font-size: 14px;');
console.log('Debug commands available: window.__DASHBOARD_DEBUG');
