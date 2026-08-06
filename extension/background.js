chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "OPEN_PANEL" && sender.tab?.windowId) {
    chrome.sidePanel.open({ windowId: sender.tab.windowId });
  }
});