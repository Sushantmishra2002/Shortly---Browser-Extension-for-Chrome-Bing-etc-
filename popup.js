// popup.js - Main logic for Shortly
const summarizeBtn = document.getElementById('summarize');
const resultArea = document.getElementById('resultArea');
const status = document.getElementById('status');
const sentencesInput = document.getElementById('sentences');
const copyBtn = document.getElementById('copy');
const downloadBtn = document.getElementById('download');
const hfBtn = document.getElementById('hfBtn');
const apiKeyRow = document.getElementById('apiKeyRow');
const hfSummBtn = document.getElementById('hfSummarize');
const hfTokenInput = document.getElementById('hfToken');

function setStatus(s){
  status.innerText = s;
}

async function extractPageText(){
  setStatus('Extracting page text…');
  // inject extractor.js and run
  const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
  try{
    const result = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['extractor.js']
    });
    const text = (result && result[0] && result[0].result) ? result[0].result : '';
    return text || '';
  }catch(err){
    console.error(err);
    return '';
  }
}

// Simple rule-based summarizer
function summarizeRuleBased(text, numSentences){
  if(!text) return [];
  // split into sentences (naive)
  const raw = text.replace(/\n+/g,'. ');
  const sentences = raw.match(/[^\.\!\?]+[\.\!\?]?/g) || [raw];
  // tokenize and compute word freq
  const stopwords = new Set(['the','and','is','in','to','of','a','it','that','for','on','with','as','are','this','was','be','by','an','or','from']);
  const freqs = {};
  for(const s of sentences){
    const words = s.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(Boolean);
    for(const w of words){
      if(stopwords.has(w) || w.length<=2) continue;
      freqs[w] = (freqs[w]||0) + 1;
    }
  }
  // score sentences
  const scored = sentences.map((s,i)=>{
    const words = s.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(Boolean);
    let score = 0;
    for(const w of words){
      if(freqs[w]) score += freqs[w];
    }
    // prefer earlier sentences slightly
    score *= (1 + (1 - i/sentences.length)*0.1);
    return {i, s: s.trim(), score};
  });

  scored.sort((a,b)=>b.score - a.score);
  const picked = scored.slice(0, Math.min(numSentences, scored.length)).sort((a,b)=>a.i - b.i);
  // Convert sentences to short bullets (trim to 140 chars with ellipses)
  const bullets = picked.map(p=>{
    let s = p.s.replace(/^["'\s]+|["'\s]+$/g,'');
    if(s.length>160) s = s.slice(0,157)+'...';
    return s;
  });
  return bullets;
}

// UI helpers
function showBullets(list){
  resultArea.innerHTML = '';
  if(!list || list.length===0){
    resultArea.innerHTML = '<em>No summary could be produced.</em>';
    return;
  }
  const ul = document.createElement('ul');
  for(const b of list){
    const li = document.createElement('li');
    li.className = 'bullet';
    li.textContent = b;
    ul.appendChild(li);
  }
  resultArea.appendChild(ul);
}

summarizeBtn.addEventListener('click', async ()=>{
  const n = parseInt(sentencesInput.value) || 5;
  setStatus('Working (rule-based) — extracting text…');
  const text = await extractPageText();
  if(!text || text.length < 120){
    setStatus('Page text too short or extraction failed. Try on a full article page.');
    showBullets([]);
    return;
  }
  setStatus('Summarizing…');
  const bullets = summarizeRuleBased(text, n);
  showBullets(bullets);
  setStatus('Done — showing summary. You can Copy or Download.');
});

copyBtn.addEventListener('click', ()=>{
  const txt = Array.from(resultArea.querySelectorAll('.bullet')).map(e=>e.textContent).join('\n- ');
  if(!txt) return;
  navigator.clipboard.writeText('- ' + txt).then(()=>setStatus('Copied to clipboard.'), ()=>setStatus('Copy failed.'));
});

downloadBtn.addEventListener('click', ()=>{
  const bullets = Array.from(resultArea.querySelectorAll('.bullet')).map(e=>e.textContent);
  if(bullets.length===0) { setStatus('Nothing to download'); return; }
  const content = bullets.map(b=>'• '+b).join('\n\n');
  const blob = new Blob([content], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shortly-summary.txt';
  a.click();
  URL.revokeObjectURL(url);
  setStatus('Downloaded summary.');
});

// HuggingFace optional integration
hfBtn.addEventListener('click', ()=>{ apiKeyRow.classList.toggle('hidden'); });
hfSummBtn.addEventListener('click', async ()=>{
  const token = hfTokenInput.value.trim();
  if(!token){ setStatus('Please enter a Hugging Face API token first.'); return; }
  setStatus('Extracting page text…');
  const text = await extractPageText();
  if(!text || text.length < 100){ setStatus('Page text too short or extraction failed.'); return; }
  setStatus('Calling Hugging Face inference API (this uses your token)…');
  try{
    // Trim text to a reasonable size for the free tiers (first 2000 chars)
    const payload = text.length > 3000 ? text.slice(0,3000) : text;
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({inputs: payload})
    });
    if(!response.ok){
      const textErr = await response.text();
      console.error('HF error', textErr);
      setStatus('Hugging Face API error. Check token / quota.');
      return;
    }
    const data = await response.json();
    // data might be [{summary_text: "..."}] or {summary_text: "..."}
    let summary = '';
    if(Array.isArray(data) && data[0] && data[0].summary_text) summary = data[0].summary_text;
    else if(data.summary_text) summary = data.summary_text;
    else if(typeof data === 'string') summary = data;
    else summary = JSON.stringify(data);
    // split summary into bullets by sentences
    const bullets = summary.match(/[^\.\!\?]+[\.\!\?]?/g) || [summary];
    showBullets(bullets.slice(0, parseInt(sentencesInput.value) || 5).map(s=>s.trim()));
    setStatus('HuggingFace summary displayed.');
  }catch(err){
    console.error(err);
    setStatus('Failed calling Hugging Face. See console for details.');
  }
});

// show install note when opened outside an active tab
document.addEventListener('DOMContentLoaded', ()=>setStatus('Ready — click Summarize.'));
