function applyTagToTab(tabId, tag) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (tag) => {
      // Strip any existing [TAG] prefix, then apply the new one.
      const stripped = document.title.replace(/^\[[^\]]+\]\s*/, "");
      if (!window.__originalTitle) window.__originalTitle = stripped;
      document.title = tag ? `[${tag}] ${window.__originalTitle}` : window.__originalTitle;
    },
    args: [tag]
  });
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function refreshList() {
  const listEl = document.getElementById("list");
  listEl.innerHTML = "";
  const store = await chrome.storage.local.get(null);
  const tabs = await chrome.tabs.query({});
  const tagged = tabs.filter((t) => store[`tag_${t.id}`]);

  if (tagged.length === 0) {
    listEl.innerHTML = '<div style="font-size:12px;color:#999;">No tagged tabs yet.</div>';
    return;
  }

  tagged.forEach((t) => {
    const div = document.createElement("div");
    div.className = "tab-item";
    div.innerHTML = `<span class="tag-badge">${store[`tag_${t.id}`]}</span><span class="tab-title">${t.title}</span>`;
    div.onclick = () => {
      chrome.tabs.update(t.id, { active: true });
      chrome.windows.update(t.windowId, { focused: true });
    };
    listEl.appendChild(div);
  });
}

(async () => {
  const tab = await getCurrentTab();
  const store = await chrome.storage.local.get(`tag_${tab.id}`);
  const existing = store[`tag_${tab.id}`];
  if (existing) document.getElementById("tagInput").value = existing;

  document.getElementById("save").onclick = async () => {
    const tag = document.getElementById("tagInput").value.trim();
    if (!tag) return;
    await chrome.storage.local.set({ [`tag_${tab.id}`]: tag });
    applyTagToTab(tab.id, tag);
    refreshList();
  };

  document.getElementById("clear").onclick = async () => {
    await chrome.storage.local.remove(`tag_${tab.id}`);
    document.getElementById("tagInput").value = "";
    applyTagToTab(tab.id, "");
    refreshList();
  };

  refreshList();
})();
