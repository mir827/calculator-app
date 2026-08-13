// History storage for calculator app (localStorage-based)

const STORAGE_KEY = 'calculator_history_v1';
const MAX_HISTORY_ITEMS = 50;

export function useHistoryStorage() {
  // Get all items currently in session-local memory (for demo)
  async function getHistory(maxAgeMs = null) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      
      if (!raw || !Array.isArray(JSON.parse(raw))) return [];
      
      let items = JSON.parse(raw);
      
      // Filter by max age if specified
      if (maxAgeMs !== null && Array.isArray(items)) {
        const nowMs = Date.now();
        items = items.filter(item => 
          new Date(item.timestamp).getTime() > nowMs - maxAgeMs
        );
      } else if (!Array.isArray(items)) return [];
      
      // Sort by timestamp (newest first) and limit count to MAX_HISTORY_ITEMS
      items.sort((a, b) => {
        const aDate = new Date(a.timestamp).getTime();
        const bDate = new Date(b.timestamp).getTime();
        if (bDate !== aDate) return bDate - aDate; // Sort by timestamp
        return String(b.id || '').localeCompare(String(a.id)); // Tie-breaker: id descending
      });
      
      return items.slice(0, MAX_HISTORY_ITEMS);
    } catch (_error) {
      console.error('Error getting history:', _error.message);
      return [];
    }
  }

  // Add new calculation to history
  async function addHistoryItem(item) {
    try {
      const currentItems = await getHistory();
      
      if (!item || !Number.isFinite(Number(String(item.result)))) {
        console.warn('Invalid item for storage');
        return null;
      }
      
      // Check for duplicate timestamps within same second (prevent duplicates)
      const nowMs = Date.now();
      if (currentItems.length > 0 && 
          Math.abs(currentItems[0].timestamp - nowMs) < 1000 &&
          currentItems[0]?.operation?.op === item.operation.op) {
        console.warn('Duplicate detected');
        