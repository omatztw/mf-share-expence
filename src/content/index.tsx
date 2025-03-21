import { CalculationResults, MessageAction, MessageResponse, Transaction } from '../types';
import { loadSettings } from '../utils/storage';
import { calculateExpenses } from '../utils/calculations';

// Ensure Chrome types are available
declare const chrome: any;

// Store extracted data
let transactions: Transaction[] = [];

// Initialize content script
async function initialize() {
  console.log('MoneyForward Extension: Content script initialized');
  
  
  // Extract data when page is fully loaded
  if (document.readyState === 'complete') {
    extractData();
  } else {
    window.addEventListener('load', extractData);
  }
  
  // Send a ready message to the background script
  chrome.runtime.sendMessage({ action: 'contentScriptReady' }, (response: any) => {
    console.log('Content script ready message sent', response);
  });
}

// Extract data from MoneyForward page
function extractData() {
  console.log('MoneyForward: データ抽出を開始します');
  
  // Find the table
  const table = document.getElementById('cf-detail-table');
  if (!table) {
    console.error('MoneyForward: テーブルが見つかりません (cf-detail-table)');
    
    // Look for alternative tables
    const tables = document.querySelectorAll('table');
    console.log(`MoneyForward: ページ内のテーブル数: ${tables.length}`);
    
    // Log IDs and classes of all tables
    tables.forEach((t, index) => {
      console.log(`テーブル ${index}: id=${t.id}, class=${t.className}`);
    });
    
    return;
  }

  // Get transaction rows
  const rows = table.querySelectorAll('tbody tr.transaction_list');
  console.log(`MoneyForward: 取引行数: ${rows.length}`);
  transactions = [];

  // Process each row
  rows.forEach(row => {
    // Get columns
    const columns = row.querySelectorAll('td');
    if (columns.length < 10) return;

    // Check if transaction is included in calculation
    const isTargetElement = columns[0].querySelector('.icon-check, .icon-ban-circle');
    const isTarget = isTargetElement && isTargetElement.classList.contains('icon-check');
    
    // Get date
    const dateElement = columns[1].querySelector('span');
    const date = dateElement?.textContent?.trim() || '';
    
    // Get content
    const contentElement = columns[2].querySelector('span');
    const content = contentElement?.textContent?.trim() || '';
    
    // Get amount
    const amountElement = columns[3];
    let amount;

        // Check if it's a form-switch-td (editable financial institution)
    if (amountElement?.classList.contains('form-switch-td')) {
      // Get the name from the span inside the noform div
      const spanElement = amountElement.querySelector('.noform span');
      amount = spanElement?.textContent?.trim().replace(/[^0-9-]/g, '') || '0';
    } else {
      // Simple td case - get text content directly
      const spanElement = amountElement.querySelector('span.offset')
      amount = spanElement?.textContent?.trim().replace(/[^0-9-]/g, '') || '0';
    }


    
    // Get financial institution
    const accountElement = columns[4];
    let account = '';
    
    // Check if it's a form-switch-td (editable financial institution)
    if (accountElement?.classList.contains('form-switch-td')) {
      // Get the name from the span inside the noform div
      const spanElement = accountElement.querySelector('.noform span');
      account = spanElement?.textContent?.trim() || '';
    } else {
      // Simple td case - get text content directly
      account = accountElement?.textContent?.trim() || '';
    }
    
    
    // Get main category
    const categoryElement = columns[5].querySelector('a');
    const category = categoryElement?.textContent?.trim() || '';
    
    // Get sub-category
    const subcategoryElement = columns[6].querySelector('a');
    const subcategory = subcategoryElement?.textContent?.trim() || '';

   
    // Get memo
    const memoElement = columns[7].querySelector('span');
    const memo = memoElement?.textContent?.trim() || '';
    
    // Get transfer info
    const transferIconElement = columns[8].querySelector('.icon-exchange');
    const transfer = transferIconElement ? '1' : '0';

    // Create transaction object
    transactions.push({
      ID: `${Date.now()}-${transactions.length}`, // Generate unique ID
      計算対象: isTarget ? '1' : '0',
      日付: date,
      内容: content,
      '金額（円）': amount,
      保有金融機関: account,
      大項目: category,
      中項目: subcategory,
      メモ: memo,
      振替: transfer
    });
  });

  // Calculate expenses and inject result panel if data is available
  if (transactions.length > 0) {
    injectResultPanel();
  }
}

// Calculate expenses
async function getCalculationResults(): Promise<CalculationResults> {
  const settings = await loadSettings();
  return calculateExpenses(transactions, settings);
}

// Inject result panel into page
async function injectResultPanel() {
  // Remove existing panel if any
  const existingPanel = document.getElementById('mf-expense-result-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // Create panel container
  const panel = document.createElement('div');
  panel.id = 'mf-expense-result-panel';
  panel.style.position = 'fixed';
  panel.style.top = '70px';
  panel.style.right = '20px';
  panel.style.width = '300px';
  panel.style.backgroundColor = 'white';
  panel.style.border = '1px solid #ddd';
  panel.style.borderRadius = '4px';
  panel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  panel.style.zIndex = '9999';
  panel.style.padding = '16px';
  
  // Calculate results
  const results = await getCalculationResults();
  const settings = await loadSettings();
  
  // Create panel content
  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="margin: 0;">経費計算結果</h3>
      <button id="mf-close-panel" style="background: none; border: none; cursor: pointer; font-size: 20px;">×</button>
    </div>
    <div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div>経費合計:</div>
        <div style="font-weight: bold;">${results.sum.toLocaleString()} 円</div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div>${settings.partnerName}支払い:</div>
        <div style="font-weight: bold;">${results.need.toLocaleString()} 円</div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div>${settings.partnerName}持ち出し:</div>
        <div style="font-weight: bold;">${results.partner.toLocaleString()} 円</div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div>${settings.partnerName}不足:</div>
        <div style="font-weight: bold;">${results.lack.toLocaleString()} 円</div>
      </div>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(panel);
  
  // Add close button event listener
  const closeButton = document.getElementById('mf-close-panel');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      panel.remove();
    });
  }
}

// Set up message listener
chrome.runtime.onMessage.addListener((request: MessageAction, _sender: any, sendResponse: (response: MessageResponse) => void) => {
  console.log('MoneyForward: Message received in content script:', request);
  
  if (request.action === 'getResults') {
    // Return calculation results
    getCalculationResults().then(results => {
      console.log('MoneyForward: Sending calculation results:', results);
      sendResponse({ results });
    });
    return true; // Needed for async response
  } else if (request.action === 'refreshData') {
    // Re-extract data and calculate
    console.log('MoneyForward: Refreshing data');
    extractData();
    getCalculationResults().then(results => {
      console.log('MoneyForward: Sending refreshed results:', results);
      sendResponse({ results, success: true });
    });
    return true; // Needed for async response
  } else if (request.action === 'pageLoaded') {
    // Page load notification
    console.log('MoneyForward: Page loaded message received');
    extractData();
    sendResponse({ success: true });
    return true; // Needed for async response
  }
});

// Initialize content script
initialize();

// Set up MutationObserver to watch for page changes
const observer = new MutationObserver((mutations) => {
  // Re-extract data if table content changes
  for (const mutation of mutations) {
    if (mutation.type === 'childList' &&
        ((mutation.target as Element).id === 'cf-detail-table' ||
         (mutation.target as Element).closest?.('#cf-detail-table'))) {
      extractData();
      break;
    }
  }
});

// Observe table container
const tableContainer = document.getElementById('break_contents');
if (tableContainer) {
  observer.observe(tableContainer, { childList: true, subtree: true });
} else {
  // If table container not found, observe body and look for table later
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Periodically check for table
  const checkInterval = setInterval(() => {
    const container = document.getElementById('break_contents');
    if (container) {
      observer.disconnect();
      observer.observe(container, { childList: true, subtree: true });
      clearInterval(checkInterval);
      extractData(); // Extract data when table is found
    }
  }, 1000);
}