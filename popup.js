// TruthLens Popup Script

let activeType = 'text';

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeType = tab.dataset.type;
    
    const placeholders = {
      text: 'Paste text to analyze for AI generation or misinformation...',
      image: 'Paste image URL to check for deepfakes...',
      url: 'Paste web URL to analyze page credibility...'
    };
    document.getElementById('input').placeholder = placeholders[activeType];
  });
});

document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const input = document.getElementById('input').value.trim();
  if (!input) return;
  
  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.textContent = 'Analyzing...';
  
  const resultEl = document.getElementById('result');
  resultEl.style.display = 'none';
  
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'analyze', data: { type: activeType, content: input } },
        (response) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(response);
        }
      );
    });
    
    if (response && response.success) {
      const data = response.data;
      const score = data.credibility_score || data.ai_probability || data.fake_probability || 0;
      const pct = Math.round(score * 100);
      const color = pct < 30 ? '#22c55e' : pct < 70 ? '#f59e0b' : '#ef4444';
      const verdict = pct < 30 ? 'Likely Authentic' : pct < 70 ? 'Suspicious - Verify' : 'Likely AI/Fake';
      
      document.getElementById('scoreFill').style.width = pct + '%';
      document.getElementById('scoreFill').style.background = color;
      document.getElementById('scoreValue').textContent = pct + '%';
      document.getElementById('scoreValue').style.color = color;
      document.getElementById('verdict').textContent = verdict;
      resultEl.style.display = 'block';
    } else {
      alert('Analysis failed: ' + (response?.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Analyze';
  }
});
