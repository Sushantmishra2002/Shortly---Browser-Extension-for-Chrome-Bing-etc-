<img width="1231" height="362" alt="image" src="https://github.com/user-attachments/assets/129d103b-48af-4321-ae85-d4b36260bc27" />

<img width="301" height="546" alt="image" src="https://github.com/user-attachments/assets/3346e067-1c54-4af8-a838-4dcc76dcdc77" />


# Shortly — Quick Article Summaries

Shortly is a Chrome extension that extracts key points from long articles, blog posts, news pieces, or research papers and presents them as concise bullet points.

## Features
- **One-click summarization**: Click the extension icon to get bullet points.
- **Offline rule-based summarizer**: Works without internet or API keys.
- **Optional Hugging Face AI summarizer**: For higher-quality summaries (requires free API token).
- **Copy to clipboard** or **download summary as TXT**.
- **Cleans clutter** using a custom text extractor.

## Installation
1. Download and unzip the `Shortly.zip` file.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the `Shortly` folder.

## How to Use
1. Open any long article or blog post.
2. Click the **Shortly** icon in your Chrome toolbar.
3. Choose the number of bullet points.
4. Click **Summarize** to use the rule-based summarizer, or use **Hugging Face** for AI summarization.
5. Copy or download the results.

## Optional — Hugging Face API
- Get a free Hugging Face account: https://huggingface.co/
- Create a token from your settings.
- Paste it into the popup for AI-powered summaries.

## File Structure
```
Shortly/
├── manifest.json       # Chrome extension config
├── popup.html          # Popup UI
├── popup.js            # Main logic
├── styles.css          # Popup styling
├── extractor.js        # Script injected into pages to extract readable text
├── icons/
│   ├── icon48.png
│   └── icon128.png
└── README.md           # Instructions
```

## Notes
- Works best on pages with actual article content (not just homepages).
- The built-in summarizer is extractive, meaning it selects key sentences. Hugging Face option is abstractive.
- Hugging Face free tier may have rate limits.

---
© 2025 Shortly — Made for fast reading.
