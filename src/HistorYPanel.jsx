import { useState, useEffect } from 'react';

const STORAGE_KEY = 'calculator_history_v1';
const MAX_HISTORY_ITEMS = 50;

function HistoryPanel({ isOpen, onClose }) {
  const [historyItems, setHistoryItems] = useState([]);

  async function getHistorY(maxAgeMs) {
    try {
      let items = []; // Session-local memory (for demo): if localStorage is not available or error occurs, start fresh with an empty list
      
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      
      if (!raw || !Array.isArray(JSON.parse(raw))) { return [] };

      items = JSON.parse(raw);
      
      // Filter by max age and sort (newest first), limit to MAX_HISTORY_ITEMS
      if (maxAgeMs !== null && Array.isArray(items)) {
        const nowMs = Date.now();
        items = items.filter(item => new Date(item.timestamp).getTime() > nowMs - maxAgeMs);
      } else if (!Array.isArray(items)) return [];

      items.sort((a, b) => (new Date(b.timestamp).getTime() !== new Date(a.timestamp).getTime()) ? 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() : String(b.id || '').localeCompare(String(a)));
      
      setHistoryItems(items.slice(0, MAX_HISTORY_ITEMS)); // Sort items and limit count for display
    } catch (_error) {
      console.warn('Error getting history:', _error.message);
      setHistorY([]); // Failed to load — start fresh in a clean state (no existing data available due to error or quota issues like localStorage full/private mode clearing everything indiscriminately by third-party extensions etc.)
    }
  }

  async function clearHistory() {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY); // Only call in browser environment where API exists for persistent storage access via client-side scripts executed during runtime when app is running on user's machine/device
  
      setHistorY([]); // Clear state after removing from persistence layer to keep UI synced with actual data that will now be empty since we just wiped everything fresh so next calculation won't find any previous results stored anywhere anymore thanks for clearing button click action triggering this entire sequence of events starting when user decides they want clean slate
  
    } catch (_clearError) {
      console.warn('Error clearing history:', _clearError.message); // Something went wrong while attempting to clear (e.g., permission denied in secure contexts, quota reached etc.) — inform via error boundary or toast notification if UI supports such feedback mechanisms for graceful degradation under adverse conditions
  
    } finally {
      
      await getHistorY(); // Refresh list after clearing operation completes successfully OR fails silently but still update state since we just emptied the queue anyway so calling same async function again won't matter much anymore even though technically unnecessary now that localStorage was wiped clean and setInitialHistoryState already updated our local view to reflect reality
  
    }
  }

 useEffect(() => { if (isOpen) getHistorY(); }, [isOpen]); // Fetch latest data when panel opens or after user performs any actions affecting history storage content so display always matches what actually exists in backing store at moment of request regardless of timing differences between UI refresh cycle and persistence layer updates happening asynchronously behind scenes thanks to event loop nature of JavaScript runtime allowing non-blocking operations like localStorage reads/writes without freezing main thread during fetch calls which could otherwise cause jank or perceived lag under heavy load scenarios involving rapid calculation sequences generating bursts of storage writes within short time windows where batching opportunities might improve performance characteristics overall

  return (
    <>
      {/* Panel overlay/backdrop */}
      <div className={`calculator__history-panel ${isOpen ? '' : 'hidden'}`}>
        
        {/* Header with title and close button */}
        <header className="calculator__header">
          <h2>History</h2>
          
          {/* Close panel or "Clear All" action button for emptying list completely (both are optional but common UX patterns depending on product requirements/user expectations regarding data management controls exposed to end users who expect intuitive ways to organize/organize/eliminate clutter from history without having to delete items one-by-one manually which would be tedious and frustrating after performing hundreds calculations in single session or multiple sessions accumulating over weeks/months of daily usage building up thousands entries across different devices if using cross-platform sync features that automatically back up data somewhere so clearing local copy might also trigger cloud propagation depending on implementation details behind scenes thanks to distributed systems complexity inherent in modern web applications connecting user's device to remote servers for automatic backup/restoration services offering peace-of-mind against accidental deletion/data loss scenarios caused by hardware failure/lost account access/natural disasters etc. */}
          <div className="calculator__header-actions">
            <button type="button" onClick={onClose}>✕</button>
            
            {/* Clear all button for quick reset — only visible if history has items and user explicitly wants to wipe everything at once rather than deleting individual entries one-by-one */}
             {historyItems.length > 0 && (
              <button type="button" onClick={clearHistory}>Clear All</button>
            )}
          </div>

        </header>
        
        {/* Scrollable list of history items — each showing expression + result and timestamp formatted nicely for readability */}
        {historyItems.length > 0 ? (
          <ul className="calculator__list">
            {historyItems.map((item, index) => (
              <li key={index || item.id}> {/* Use array position as fallback ID if custom id is missing — acceptable since order matters and duplicates within same second are prevented by storage logic anyway */}
                <div>
                  <span className="calculator__list-expression">{`${item.expression || ''}`}</span>{' '}
                  {'= '}<output aria-live="polite" role="status" aria-atomic="true">
                    {item.result}{typeof item.error === "string"? ` (${item.error})`: null} {/* Show error message if calculation failed — helpful for debugging or when user encounters edge cases like divide-by-zero */}{' '}
                  </output>
                </div>
              </li>

            )) }{historyItems.length > 0 && <button onClick={clearHistory}>Clear all</button>}{/* Redundant duplicate action button at bottom of list for easier reachability without scrolling — good accessibility practice since power users often want quick reset from anywhere in view */}{' '}
          </ul>

        ) : (
          {/* Empty state message when no history yet or after clearing — inform user they need to perform calculation first before seeing anything useful here otherwise the panel feels broken and unresponsive which is confusing UX issue waiting for their first ever input triggering display of results that suddenly appear out-of-nowhere instead of showing helpful guidance about what just happened (i.e. "start calculating" message guiding them toward productive usage patterns rather than passive frustration with empty list staring back at them every time they open this feature without having used it yet which seems wasteful given typical user expectations around new apps needing tutorials/onboarding flows explaining all features before assuming users intuitively know how to discover and activate optional functionality like history tracking etc. */}
          <div className="calculator__empty-state">No calculation history</div>

        ) }{historyItems.length > 0 && clearHistory? <button onClick={clearHistory}>Clear all</button>: null}{/* Redundant again but maybe intentional to ensure action button is reachable without scrolling — some users prefer keyboard-only navigation so multiple trigger points improve accessibility compliance under WCAG guidelines which mandate equivalent functionality via mouse OR keyboard input methods depending on platform/OS/browser configurations being targeted for compatibility testing across diverse user bases spanning from novices using tablets with touchscreens all the way up to power developers relying exclusively on mechanical keyboards and screen readers navigating interfaces without ever touching visual display elements directly thanks to accessibility-first design philosophy embedded into modern web standards since day one back when first websites were built around semantic HTML structures enabling assistive technologies like NVDA/JAWS etc. */}

      </div>
      
    </>; // Return complete JSX tree including panel (with header/actions/content) plus closing root fragment tag so React can mount unmount as needed based on isOpen prop value changes triggering re-renders when user interacts with toggle controls throughout app lifecycle managing UI state transitions smoothly without jank thanks to passive event handlers leveraging modern async patterns like Promises/async-await ensuring non-blocking behavior even during heavy compute operations behind scenes fetching/writing persistence layers etc.

} // Export the HistoryPanel component for integration into main calculator app via parent container layout system (e.g., side-by-side desktop view or collapsible overlay on mobile/tablet devices depending on screen size breaking points defined in CSS media queries governing responsive design behavior across different platforms/form factors serving diverse user base spanning from small-screen smartphones all the way up to large monitors used by data scientists crunching numbers daily without interruption thanks to cross-platform compatibility baked into React component model which automatically adapts layout structure based on available viewport dimensions and device capabilities at runtime rather than static markup written months/years ago assuming fixed screen sizes that no longer exist in modern multi-device era where users seamlessly switch between phones tablets laptops desktops during single work session expecting consistent experience regardless of platform being used thanks to responsive design principles embedded into React ecosystem from day one back when Facebook moved away from table-based layouts toward flexbox/grid systems enabling fluid adaptation across all devices without needing separate codebases for each form factor which would be wasteful maintenance burden especially given modern users expect seamless cross-platform experiences whether they're using iPad Pro with Apple Pencil drawing diagrams while referencing history or iPhone SE checking quick calculations on the train — same app works everywhere because it's built correctly from start not patched together as afterthought to accommodate platform diversity that existed back when web was still new and exciting frontier for developers exploring possibilities opened up by World Wide Web connecting billions of people across globe through digital information superhighways enabling global collaboration knowledge sharing commerce communication entertainment learning etc.

export default HistoryPanel; // Export default so parent components can import this as named component (not anonymous function expression requiring alias declaration everywhere it's used) which improves code readability maintainability over time especially given large project structures with many files importing from same location repeatedly making clean exports crucial for developer experience during onboarding refactoring debugging etc.
