// config.js - Configuration for Pocket FM Live Dashboard
// This file centralizes all configuration settings

const CONFIG = {
    // ==================== Google Sheets Configuration ====================
    SHEET: {
        // Your Google Sheet ID
        ID: '1NQq4h5uu3ci3KS-HJ4LR2d5N6yhAb3wly5yM1tj8gOM',
        
        // Tab names in your Google Sheet
        TABS: [
            'Daily',
            'Weekly',
            'Daily Adset',
            'Weekly Adset',
            'Spends Daily',
            'Spends Weekly'
        ]
    },

    // ==================== Auto-Refresh Settings ====================
    REFRESH: {
        // Interval in milliseconds (5 minutes = 300000)
        INTERVAL_MS: 5 * 60 * 1000,
        
        // Enable auto-refresh on page load
        ENABLED: true,
        
        // Show refresh status in header
        SHOW_STATUS: true
    },

    // ==================== Focus Shows (15 shows only) ====================
    // These shows are prioritized in the dashboard to keep file size manageable
    FOCUS_SHOWS: [
        "The Alpha's Bride",
        "Wolves of Blood Moon",
        "Twists of Love & Revenge",
        "Crowned in Shadow",
        "Lunar Curse",
        "The Duke's Masked Bride",
        "My Vampire System",
        "Heir in Hiding",
        "First Legendary Beast Master",
        "Weakest Beast Tamer",
        "The Royal Accident",
        "The Godfather's Son",
        "Born to Rule",
        "I'm Married to a Stranger",
        "Shadow Slave"
    ],

    // ==================== UI Configuration ====================
    UI: {
        // Page title
        TITLE: '📊 Pocket FM Ad Dashboard',
        
        // Header subtitle
        SUBTITLE: 'Live Data • Real-Time Updates',
        
        // Show live indicator
        SHOW_LIVE_BADGE: true,
        
        // Show last update time
        SHOW_TIMESTAMP: true,
        
        // Show auto-refresh countdown
        SHOW_REFRESH_COUNTDOWN: true,
        
        // Color scheme
        COLORS: {
            PRIMARY: '#185FA5',
            SUCCESS: '#0F6E56',
            WARNING: '#8a5500',
            ERROR: '#C13B00'
        }
    },

    // ==================== Data Processing Rules ====================
    PROCESSING: {
        // Remove iOS-tagged adsets from Android data
        REMOVE_IOS_TAGS: true,
        
        // Filter to focus shows only
        FILTER_FOCUS_SHOWS: true,
        
        // Convert NaN to null
        CLEAN_NAN: true,
        
        // Round floats to 4 decimals
        FLOAT_PRECISION: 4
    },

    // ==================== Cache Settings ====================
    CACHE: {
        // Enable data caching (reduces API calls)
        ENABLED: true,
        
        // Cache duration in milliseconds (30 seconds)
        DURATION_MS: 30 * 1000,
        
        // Enable localStorage for offline support
        PERSIST_TO_STORAGE: true
    },

    // ==================== Logging ====================
    DEBUG: {
        // Enable verbose logging
        ENABLED: false,
        
        // Log every API call
        LOG_API_CALLS: true,
        
        // Log data sizes
        LOG_DATA_SIZE: true,
        
        // Log timing
        LOG_TIMING: true
    },

    // ==================== Performance ====================
    PERFORMANCE: {
        // Maximum dashboard size in MB
        MAX_SIZE_MB: 50,
        
        // Lazy load images
        LAZY_LOAD_IMAGES: true,
        
        // Enable service worker for offline mode
        ENABLE_SERVICE_WORKER: false
    },

    // ==================== Feature Flags ====================
    FEATURES: {
        // Enable trend charts
        SHOW_TRENDS: true,
        
        // Enable RCA analysis
        SHOW_RCA: true,
        
        // Enable show overview
        SHOW_OVERVIEW: true,
        
        // Enable iOS deep dive
        SHOW_IOS_DEEP_DIVE: true,
        
        // Enable data export
        ALLOW_EXPORT: true
    },

    // ==================== Metrics Configuration ====================
    METRICS: {
        // List of metrics to display (order matters)
        PRIMARY: [
            'Total_Cost ($)',
            'Installs',
            'CPI ($)',
            'ARPU($) D3',
            'ARPPU($) D3',
            'Conversion% D3',
            'Recovery D3'
        ],
        
        // Secondary metrics (less frequently used)
        SECONDARY: [
            'LDAU % D3',
            'Activation% D3',
            'Listening % D3',
            'Avg Playtime (Hours) D3',
            'Avg Converted User Playtime D3'
        ]
    },

    // ==================== API Endpoints ====================
    ENDPOINTS: {
        // Google Sheets CSV export endpoint template
        // {ID} = Sheet ID, {SHEET} = Tab name
        SHEETS_CSV: 'https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet={SHEET}'
    },

    // ==================== Date Settings ====================
    DATES: {
        // Immature date thresholds
        IMMATURE_WEEKS: 3,
        IMMATURE_DAYS: 3,
        
        // Date format
        FORMAT: 'YYYY-MM-DD'
    },

    // ==================== Export Settings ====================
    EXPORT: {
        // Default export format
        FORMAT: 'json',
        
        // Include timestamps
        INCLUDE_TIMESTAMP: true,
        
        // Compress before export
        COMPRESS: false
    }
};

// ==================== Helper Functions ====================

/**
 * Get a config value by dot notation
 * Example: getConfig('SHEET.ID')
 */
function getConfig(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], CONFIG);
}

/**
 * Update a config value
 */
function setConfig(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const obj = keys.reduce((obj, key) => obj[key], CONFIG);
    if (obj) obj[lastKey] = value;
}

/**
 * Get all focus shows
 */
function getFocusShows() {
    return CONFIG.FOCUS_SHOWS;
}

/**
 * Check if a show is in focus list
 */
function isFocusShow(showName) {
    return CONFIG.FOCUS_SHOWS.includes(showName);
}

/**
 * Get primary metrics
 */
function getPrimaryMetrics() {
    return CONFIG.METRICS.PRIMARY;
}

/**
 * Get all metrics (primary + secondary)
 */
function getAllMetrics() {
    return [...CONFIG.METRICS.PRIMARY, ...CONFIG.METRICS.SECONDARY];
}

// ==================== Export ====================

// Make CONFIG globally available
window.CONFIG = CONFIG;
window.getConfig = getConfig;
window.setConfig = setConfig;
window.getFocusShows = getFocusShows;
window.isFocusShow = isFocusShow;
window.getPrimaryMetrics = getPrimaryMetrics;
window.getAllMetrics = getAllMetrics;

console.log('%c✓ Config Loaded', 'color: #185FA5; font-weight: bold; font-size: 14px;');
console.log('Sheet ID:', CONFIG.SHEET.ID);
console.log('Focus shows:', CONFIG.FOCUS_SHOWS.length);
console.log('Refresh interval:', CONFIG.REFRESH.INTERVAL_MS / 1000 / 60, 'minutes');
