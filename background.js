const API_BASE = 'https://truthlens-api.royscompany.workers.dev';

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze') {
    analyzeContent(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});

async function analyzeContent(data) {
  const endpoint = data.type === 'text' ? '/analyze/text' :
                   data.type === 'image' ? '/analyze/image' : '/analyze/url';
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Context menu for right-click analysis
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'truthlens-analyze-text',
    title: 'Analyze with TruthLens',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'truthlens-analyze-image',
    title: 'Check image with TruthLens',
    contexts: ['image']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'truthlens-analyze-text' && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'showAnalysis',
      type: 'text',
      content: info.selectionText
    });
  } else if (info.menuItemId === 'truthlens-analyze-image' && info.srcUrl) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'showAnalysis',
      type: 'image',
      content: info.srcUrl
    });
  }
});
