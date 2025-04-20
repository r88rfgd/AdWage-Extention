// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusText = document.getElementById('statusText');

  // Get current state from background script
  chrome.runtime.sendMessage({ action: 'getState' }, ({ enabled }) => {
    toggleSwitch.checked = enabled;
    updateStatusText(enabled);
  });

  // Handle toggle changes
  toggleSwitch.addEventListener('change', () => {
    const enabled = toggleSwitch.checked;
    chrome.runtime.sendMessage({ action: 'setState', enabled }, () => {
      updateStatusText(enabled);
    });
  });

  function updateStatusText(enabled) {
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
    statusText.style.color = enabled ? '#4285F4' : '#999';
  }
});