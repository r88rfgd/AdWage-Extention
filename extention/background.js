// Initialize extension state
let extensionEnabled = true;

// Set up storage to remember state between browser sessions
chrome.storage.local.get('enabled', ({ enabled }) => {
  if (enabled !== undefined) {
    extensionEnabled = enabled;
  } else {
    // Default to enabled on first run
    chrome.storage.local.set({ enabled: true });
  }
});

// Track tabs that need to be closed after timeout
const tabsToClose = new Map();

// Listen for tab updates to handle about: URLs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!extensionEnabled) return;
  
  // Handle about: URLs
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('about:')) {
    // Focus the tab
    chrome.tabs.update(tabId, { active: true });
    
    // Set timeout to close the tab after 15 seconds
    const timeoutId = setTimeout(() => {
      // Double-check that the extension is still enabled before closing
      if (extensionEnabled) {
        chrome.tabs.remove(tabId).catch((error) => {
          console.log(`Failed to close tab ${tabId}: ${error}`);
          // Tab might have been closed already
        });
      }
      tabsToClose.delete(tabId);
    }, 30000); // Changed from 11000 to 15000 ms
    
    tabsToClose.set(tabId, timeoutId);
  }
});

// Handle new tabs
chrome.tabs.onCreated.addListener((tab) => {
  if (!extensionEnabled) return;
  
  if (tab.url && tab.url.startsWith('about:')) {
    // Focus the tab
    chrome.tabs.update(tab.id, { active: true });
    
    // Set timeout to close the tab after 15 seconds
    const timeoutId = setTimeout(() => {
      // Double-check that the extension is still enabled before closing
      if (extensionEnabled) {
        chrome.tabs.remove(tab.id).catch((error) => {
          console.log(`Failed to close tab ${tab.id}: ${error}`);
          // Tab might have been closed already
        });
      }
      tabsToClose.delete(tab.id);
    }, 15000); // Changed from 11000 to 15000 ms
    
    tabsToClose.set(tab.id, timeoutId);
  }
});

// Clean up when tabs are closed manually
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabsToClose.has(tabId)) {
    clearTimeout(tabsToClose.get(tabId));
    tabsToClose.delete(tabId);
  }
});

// Listen for state changes from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getState') {
    sendResponse({ enabled: extensionEnabled });
  } else if (message.action === 'setState') {
    extensionEnabled = message.enabled;
    chrome.storage.local.set({ enabled: extensionEnabled });
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});