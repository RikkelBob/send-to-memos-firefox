// Open settings page in a tab when toolbar icon is clicked
browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({ url: browser.runtime.getURL("options.html") });
});

function createContextMenus() {
  browser.contextMenus.removeAll(() => {
    browser.contextMenus.create({
      id: "save-selection",
      title: "Save to Memos",
      contexts: ["selection"]
    });
    browser.contextMenus.create({
      id: "save-image",
      title: "Save image to Memos",
      contexts: ["image"]
    });
    browser.contextMenus.create({
      id: "save-video",
      title: "Save video to Memos",
      contexts: ["video"]
    });
    browser.contextMenus.create({
      id: "save-audio",
      title: "Save audio to Memos",
      contexts: ["audio"]
    });
    browser.contextMenus.create({
      id: "save-link",
      title: "Save link to Memos",
      contexts: ["link"]
    });
    browser.contextMenus.create({
      id: "save-page",
      title: "Save page to Memos",
      contexts: ["page"]
    });
  });
}

browser.runtime.onInstalled.addListener(createContextMenus);
browser.runtime.onStartup.addListener(createContextMenus);

function formatDateTime(date) {
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getBaseUrl(fullUrl) {
  try {
    const u = new URL(fullUrl);
    // Strip www. prefix for display
    return u.hostname.replace(/^www\./, "");
  } catch (_) {
    return fullUrl;
  }
}

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const { memosUrl, memosToken } = await browser.storage.local.get(["memosUrl", "memosToken"]);

  if (!memosUrl || !memosToken) {
    browser.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Save to Memos",
      message: "Please configure your Memos URL and API token first (click the extension icon)."
    });
    return;
  }

  const pageUrl = info.pageUrl || tab.url;
  const baseUrl = getBaseUrl(pageUrl);
  const dateTime = formatDateTime(new Date());
  const header = `Saved from [${baseUrl}](${pageUrl}) at ${dateTime}`;

  let content = "";

  if (info.menuItemId === "save-selection") {
    content = `${header}\n\n${info.selectionText.trim()}`;
  } else if (info.menuItemId === "save-image") {
    content = `${header}\n\n![image](${info.srcUrl})`;
  } else if (info.menuItemId === "save-video") {
    content = `${header}\n\n🎬 Video: [${info.srcUrl}](${info.srcUrl})`;
  } else if (info.menuItemId === "save-audio") {
    content = `${header}\n\n🎵 Audio: [${info.srcUrl}](${info.srcUrl})`;
  } else if (info.menuItemId === "save-link") {
    const linkText = info.linkText || info.linkUrl;
    content = `${header}\n\n[${linkText}](${info.linkUrl})`;
  } else if (info.menuItemId === "save-page") {
    const title = tab.title || baseUrl;
    content = `[${title}](${pageUrl}) — saved at ${formatDateTime(new Date())}`;
  }

  if (!content) return;

  try {
    const base = memosUrl.replace(/\/$/, "");
    const response = await fetch(`${base}/api/v1/memos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${memosToken}`
      },
      body: JSON.stringify({ content: content + "\n\n#browser-extension", visibility: "PRIVATE" })
    });

    if (response.ok) {
      browser.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Saved to Memos ✓",
        message: "Your note has been saved successfully."
      });
    } else {
      let errMsg = `HTTP ${response.status}`;
      try {
        const errBody = await response.text();
        const parsed = JSON.parse(errBody);
        errMsg += `: ${parsed.message || parsed.error || errBody}`;
      } catch (_) {}
      browser.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Save to Memos failed",
        message: errMsg
      });
    }
  } catch (e) {
    browser.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Save to Memos failed",
      message: `Could not reach your Memos instance: ${e.message}`
    });
  }
});
