// TruthLens Content Script
// Injects analysis UI and handles page-level detection

let analysisOverlay = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showAnalysis') {
    showAnalysisOverlay(request.type, request.content);
  }
});

function showAnalysisOverlay(type, content) {
  // Remove existing overlay
  if (analysisOverlay) {
    analysisOverlay.remove();
  }

  // Create overlay
  analysisOverlay = document.createElement('div');
  analysisOverlay.id = 'truthlens-overlay';
  analysisOverlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    background: #1a1a2e;
    color: #fff;
    border-radius: 12px;
    padding: 16px;
    z-index: 999999;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
  `;

  analysisOverlay.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <strong style="color:#6366f1">TruthLens</strong>
      <button id="tl-close" style="background:none;border:none;color:#888;cursor:pointer;font-size:18px">&times;</button>
    </div>
    <div id="tl-status" style="color:#aaa">Analyzing...</div>
    <div id="tl-result" style="margin-top:8px"></div>
  `;

  document.body.appendChild(analysisOverlay);

  document.getElementById('tl-close').onclick = () => {
    analysisOverlay.remove();
    analysisOverlay = null;
  };

  // Request analysis
  chrome.runtime.sendMessage(
    { action: 'analyze', data: { type, content } },
    (response) => {
      const statusEl = document.getElementById('tl-status');
      const resultEl = document.getElementById('tl-result');
      
      if (!statusEl || !resultEl) return;

      if (response && response.success) {
        const data = response.data;
        const score = data.credibility_score || data.ai_probability || 0;
        const pct = Math.round(score * 100);
        const color = score < 0.3 ? '#22c55e' : score < 0.7 ? '#f59e0b' : '#ef4444';
        
        statusEl.textContent = 'Analysis complete';
        resultEl.innerHTML = `
          <div style="margin-bottom:8px">
            <div style="font-size:12px;color:#888;margin-bottom:4px">AI/Fake Score</div>
            <div style="background:#333;border-radius:4px;height:8px">
              <div style="background:${color};width:${pct}%;height:100%;border-radius:4px"></div>
            </div>
            <div style="color:${color};font-weight:600;margin-top:4px">${pct}%</div>
          </div>
          ${data.flags ? `<div style="font-size:12px;color:#aaa">${data.flags.join(', ')}</div>` : ''}
        `;
      } else {
        statusEl.textContent = 'Analysis failed';
        resultEl.textContent = response?.error || 'Unknown error';
      }
    }
  );
}
