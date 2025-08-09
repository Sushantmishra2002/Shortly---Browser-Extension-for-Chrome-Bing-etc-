// extractor.js
// Runs in page context when injected. Returns a string of the cleaned readable text.
(function(){
  // Try to pick an <article> element if available
  function getArticleText(){
    var article = document.querySelector('article');
    if(article && article.innerText.trim().length > 200) return article.innerText;
    // Common content selectors
    var selectors = [
      'main',
      '[role=main]',
      '.main-content',
      '.article-body',
      '.post-content',
      '.entry-content'
    ];
    for(var s of selectors){
      var el = document.querySelector(s);
      if(el && el.innerText.trim().length > 200) return el.innerText;
    }
    // Fallback: gather long <p> nodes
    var ps = Array.from(document.querySelectorAll('p'));
    ps = ps.filter(p=>p.innerText.trim().length > 40);
    if(ps.length===0) return document.body.innerText;
    // Return joined paragraphs near the longest paragraph
    // choose paragraphs whose text length >= 0.4 * median length
    var lengths = ps.map(p=>p.innerText.trim().length).sort((a,b)=>a-b);
    var median = lengths[Math.floor(lengths.length/2)] || 0;
    var chosen = ps.filter(p=>p.innerText.trim().length >= 0.4 * median);
    return chosen.map(p=>p.innerText.trim()).join('\n\n');
  }

  // Minimal cleanup
  function cleanText(s){
    // remove excessive whitespace and leading/trailing spaces
    s = s.replace(/\n{3,}/g,'\n\n');
    s = s.replace(/[\t\r]+/g,' ');
    s = s.replace(/\s{2,}/g,' ');
    return s.trim();
  }

  return cleanText(getArticleText());
})();
