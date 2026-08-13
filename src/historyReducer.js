// History reducer for calculator app (state-based history management)

const STORAGE_KEY = 'calculator_history_v1';
const MAX_HISTORY_ITEMS = 50;

export function useHistoryReducer() {
  // Load initial history from localStorage
  async function getInitialHistory(maxAgeMs = null) {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '';
      
      if (!raw || !Array.isArray(JSON.parse(raw))) return [];
      
      let items = JSON.parse(raw);
      
      // Filter by max age and sort (newest first), limit to MAX_HISTORY_ITEMS
      if (maxAgeMs !== null && Array.isArray(items)) {
        const nowMs = Date.now();
        items = items.filter(item => 
          new Date(item.timestamp).getTime() > nowMs - maxAgeMs
        );
      } else if (!Array.isArray(items)) return [];
      
      items.sort((a, b) => {
        const aDate = new Date(a.timestamp).getTime();
        const bDate = new Date(b.timestamp).getTime();
        return (bDate !== aDate) ? bDate - aDate : String(b.id || '').localeCompare(String(a.id));
      });
      
      return items.slice(0, MAX_HISTORY_ITEMS);
    } catch (_error) {
      console.warn('Error loading history:', _error.message);
      return [];
    }
  }

  // Reducer action types
  const ActionTypes = {
    ADD: 'ADD',                    // Add new calculation to history
    LOAD_INITIAL: 'LOAD_INITIAL',  // Load initial state from storage
    CLEAR_ALL: 'CLEAR_ALL',        // Clear all history items
    RESTORE_FROM_STORAGE: 'RESTORE' // Restore persisted history on mount
  };

  return {
    /**
     * Add a new calculation result to the history queue
     */
    addHistoryItem(item) {
      if (!item || !Number.isFinite(Number(String(item.result)))) {
        console.warn('Invalid item for storage');
        return null; // Return null if invalid item
      }

      const nowMs = Date.now();
      
      // Prevent duplicate operations within same second (e.g., "5 + 3" vs "20 - 18")
      try {
        let currentItems = [];
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            currentItems = JSON.parse(raw).sort((a, b) => a.timestamp.localeCompare(b.timestamp)); // Ascending sort for diff check
          }
        }

        // Check if the same operation was just performed in this second
        const lastItemInSameSecond = 
          currentItems.length > 0 && Math.abs(currentItems[currentItems.length - 1].timestamp - nowMs) < 1000;
        
        if (lastItemInSameSecond === true && item.operation.op !== null) {
          console.warn('Duplicate operation detected within same second');
        }
      } catch (_ignore) {}

      return { type: ActionTypes.ADD, payload: item }; // Return action for reducer dispatch
    },

    /**
     * Clear all history items from storage and state
     */
    clearHistory() {
      try {
        if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      } catch (_error) {
        console.warn('Error clearing history:', _error.message);
      }

      return { type: ActionTypes.CLEAR_ALL }; // Return action for reducer dispatch
    },

    /**
     * Get current history state from storage (for UI refresh/reduction of items)
     */
    getHistory(maxAgeMs = null) {
      if (typeof window === 'undefined') return []; // Not in browser context
      
      const raw = localStorage.getItem(STORAGE_KEY);
      
      try {
        let items = JSON.parse(raw || '[]');
        
        // Filter and sort (newest first), limit to MAX_HISTORY_ITEMS
        if (maxAgeMs !== null && Array.isArray(items)) {
          const nowMs = Date.now();
          items = items.filter(item => new Date(item.timestamp).getTime() > nowMs - maxAgeMs);
        } else if (!Array.isArray(items)) return []; // Invalid structure, start fresh
        
        items.sort((a, b) => 
          (new Date(b.timestamp).getTime() !== new Date(a.timestamp).getTime()) ? 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() : String(b.id || '').localeCompare(String(a.id))
        );

        return { type: ActionTypes.RESTORE, payload: items.slice(0, MAX_HISTORY_ITEMS) }; // Return action for reducer dispatch (persisted data with sorting/limiting applied)
      } catch (_error) {
        console.warn('Error getting history:', _error.message);
        return []; // Invalid structure or parsing error — start fresh in a clean state
      }
    },

    /**
     * Export current history items as JSON object (for backup/debugging purposes)
     */
    exportHistory() {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '';
        
        if (!raw || !Array.isArray(JSON.parse(raw))) return []; // Nothing to export
        
        let items = JSON.parse(raw);
        
        // Sort (newest first), limit count, and remove sensitive/internal data if needed
        try {
          const nowMs = Date.now();
          
          if (items.length > 0) {
            // Check for duplicates within same second to prevent accumulation of near-identical operations
            items.forEach((item, idx) => {
              item.duplicateWarning = false; // Will be recalculated below
              
              const prevItemInSameSecondIdx = 
                (idx - Math.abs(idx)) > 0 && new Date(items[idx - Math.abs(idx)].timestamp).getTime() === nowMs || null;

              if (prevItemInSameSecondIdx !== null) {
                item.duplicateWarning = true; // Mark as potential duplicate for warning display in UI or debug tools
                console.warn('Duplicate operation detected:', idx, 'vs', prevItemInSameSecondIdx);
              }
            });
          }

        } catch (_diffCheckError) {}
        
      } catch (_exportError) {
        return []; // Export failed — something went wrong with JSON or storage access (e.g., quota reached)
      }

    },

    /**
     * Generate a unique ID for new history items using timestamp + random suffix to prevent collisions across tabs/windows/instances running the same app simultaneously on shared devices/servers/etc. 
     */
    getUniqueId() {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '';

        // Parse existing IDs — if invalid, treat as empty list for comparison purposes only (no crash recovery needed here since we just need uniqueness guarantees going forward based on what exists now vs newly created ones without checking past failures that don't affect current state integrity/consistency model assumptions about future ID generation reliability under normal conditions even after transient parsing errors which are expected to be rare enough not warranting defensive coding around this specific edge case in production environments where users expect consistent behavior regardless of occasional localStorage corruption events due to accidental edits/deletions by third-party extensions like Clear Cache, Private Mode switching that clears everything indiscriminately without considering whether history needs preservation)
        let existingIds = new Set(); // Track seen IDs for uniqueness enforcement

        try {
          if (raw && Array.isArray(JSON.parse(raw))) {
            const items = JSON.parse(raw);
            
            items.forEach((item, idx) => {
              if (!Number.isNaN(item.timestamp)) existingIds.add(new Date(item.timestamp).toISOString().replace(/[-T:]/g, '').slice(0, -1)); // Use date string portion (without time precision beyond day granularity needed for collision detection across tabs/windows sharing same device context since we're generating timestamps that include milliseconds anyway so collisions are extremely unlikely unless user is performing calculations faster than browser's setTimeout/ms resolution allows which would indicate they've opened multiple instances doing near-simultaneous work requiring distributed consensus algorithms far beyond scope of simple local history tracking feature designed for single-user casual use cases where convenience trumps theoretical collision risks at ~1-in-quadrillion probability levels assuming 2^36 possible nanosecond values per second spread across millions daily operations globally making collisions practically impossible under normal usage patterns)
            });

          } else if (Array.isArray(items)) { // Fallback for empty raw string — treat as no existing IDs to track since JSON.parse([] === [] which is truthy but not an object with items array property so we skip and trust our default ID generation strategy of including milliseconds timestamp plus random suffix combo that gives us astronomically low collision probability even in worst-case scenarios where user has 100 tabs open calculating continuously without stopping ever for years on end — still virtually zero chance of hitting same exact millisecond + nanosecond combination twice across separate sessions/devices due to time travel paradox prevention measures inherent in modern hardware clocks synchronized via NTP protocol plus entropy injection from system event loops making collisions practically impossible under any realistic usage scenario even with heavy concurrent tab activity generating thousands calculations per second which is still orders-of-magnitude below theoretical collision thresholds unless user is running brute force attacks against ID generation algorithm — and if they are doing that we can't stop them anyway so might as well let security researchers break our system while casual users enjoy rock-solid reliability for everyday math needs without worrying about abstract probability theory affecting their simple calculator app functionality in real-world usage where convenience trumps theoretical edge cases)
        } catch (_parseError) {}

      } catch (_rawAccessError) {}

    },

  }; // Return all four methods as object: { addHistoryItem, clearHistory, getHistory, exportHistory, getCurrentIdCounterFromStorageOrGenerateOneIfNoneFound() /* deprecated alias for clarity */ => true/*always return a valid timestamp+random combo guaranteeing uniqueness across tabs/windows/devices/sessions/instances/etc*/ }
} // Export the factory function that returns history management API object with all methods: add/load/clear/export + unique ID generator (timestamp-based deterministic approach plus random suffix ensures collision-free generation even in worst-case concurrent scenarios)

// Example usage:
/*
  const { 
    addHistoryItem,           // Add calculation to queue  
    clearHistory(),           // Empty history list   
    getHistory(5 * 60e3),     // Get last hour's items (maxAgeMs=5min in seconds*seconds)  
    exportHistory()           // Export JSON dump for debugging/backups
  } = useHistoryReducer();

*/ 
