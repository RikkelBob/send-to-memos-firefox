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
  });
}

browser.runtime.onInstalled.addListener(createContextMenus);
browser.runtime.onStartup.addListener(createContextMenus);

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
  const pageTitle = tab.title || pageUrl;
  const sourceLink = `[Source](${pageUrl})`;

  let content = "";

  if (info.menuItemId === "save-selection") {
    const selected = info.selectionText.trim();
    content = `${sourceLink}\n\n${selected}`;
  } else if (info.menuItemId === "save-image") {
    const src = info.srcUrl;
    content = `${sourceLink}\n\n![image](${src})`;
  } else if (info.menuItemId === "save-video") {
    const src = info.srcUrl;
    content = `${sourceLink}\n\n🎬 Video: [${src}](${src})`;
  } else if (info.menuItemId === "save-audio") {
    const src = info.srcUrl;
    content = `${sourceLink}\n\n🎵 Audio: [${src}](${src})`;
  } else if (info.menuItemId === "save-link") {
    const href = info.linkUrl;
    const linkText = info.linkText || href;
    content = `${sourceLink}\n\n[${linkText}](${href})`;
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
      body: JSON.stringify({ content, visibility: "PRIVATE" })
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
