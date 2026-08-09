// Re-apply the saved tag whenever a tagged tab finishes loading/navigating,
// since the page's own title (e.g. from YouTube/Calendar) would otherwise
// overwrite it.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;

  const store = await chrome.storage.local.get(`tag_${tabId}`);
  const tag = store[`tag_${tabId}`];
  if (!tag) return;

  chrome.scripting.executeScript({
    target: { tabId },
    func: (tag) => {
      const stripped = document.title.replace(/^\[[^\]]+\]\s*/, "");
      window.__originalTitle = stripped;
      document.title = `[${tag}] ${stripped}`;
    },
    args: [tag]
  }).catch(() => {
    // Some pages (chrome://, extension pages) block script injection — ignore.
  });
});

// Clean up storage when a tagged tab is closed.
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`tag_${tabId}`);
});
