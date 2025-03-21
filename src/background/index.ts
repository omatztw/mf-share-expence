import { DEFAULT_SETTINGS } from '../utils/storage';

// Track which tabs have content scripts ready
const contentScriptReadyTabs = new Set<number>();

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('MoneyForward 経費計算拡張機能がインストールされました');
  
  // Initialize settings in storage
  chrome.storage.sync.get([
    'partnerAccount',
    'expenceList',
    'expenceSubList',
    'rate',
    'partnerName'
  ], (result) => {
    // Set default values if settings don't exist
    const updates: Partial<typeof DEFAULT_SETTINGS> = {};
    
    if (!result.partnerAccount) {
      updates.partnerAccount = DEFAULT_SETTINGS.partnerAccount;
    }
    
    if (!result.expenceList) {
      updates.expenceList = DEFAULT_SETTINGS.expenceList;
    }
    
    if (!result.expenceSubList) {
      updates.expenceSubList = DEFAULT_SETTINGS.expenceSubList;
    }
    
    if (result.rate === undefined) {
      updates.rate = DEFAULT_SETTINGS.rate;
    }
    
    if (!result.partnerName) {
      updates.partnerName = DEFAULT_SETTINGS.partnerName;
    }
    
    // Save default values if needed
    if (Object.keys(updates).length > 0) {
      chrome.storage.sync.set(updates);
    }
  });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // MoneyForwardの家計簿ページが読み込まれたときにコンテンツスクリプトにメッセージを送信
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('moneyforward.com/cf')) {
    chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' });
  }
});

// Listen for browser action clicks
chrome.action.onClicked.addListener((tab) => {
  // Open MoneyForward page if not already on it
  if (!tab.url || !tab.url.includes('moneyforward.com/cf')) {
    chrome.tabs.create({ url: 'https://moneyforward.com/cf' });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptReady' && sender.tab?.id) {
    console.log('Content script ready in tab:', sender.tab.id);
    contentScriptReadyTabs.add(sender.tab.id);
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async responses
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  contentScriptReadyTabs.delete(tabId);
});

// This keeps the service worker active
export {};