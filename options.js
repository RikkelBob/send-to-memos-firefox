const urlInput = document.getElementById("memosUrl");
const tokenInput = document.getElementById("memosToken");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const status = document.getElementById("status");

function showStatus(msg, type, duration = 4000) {
  status.textContent = msg;
  status.className = `status ${type}`;
  if (duration) setTimeout(() => { status.textContent = ""; status.className = "status"; }, duration);
}

// Load saved settings on open
browser.storage.local.get(["memosUrl", "memosToken"]).then(({ memosUrl, memosToken }) => {
  if (memosUrl) urlInput.value = memosUrl;
  if (memosToken) tokenInput.value = memosToken;
});

// Auto-save as user types (debounced) so switching windows never loses input
let saveTimer;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistSettings, 800);
}
urlInput.addEventListener("input", scheduleSave);
tokenInput.addEventListener("input", scheduleSave);

async function persistSettings() {
  const memosUrl = urlInput.value.trim().replace(/\/$/, "");
  const memosToken = tokenInput.value.trim();
  if (memosUrl || memosToken) {
    await browser.storage.local.set({ memosUrl, memosToken });
  }
}

saveBtn.addEventListener("click", async () => {
  const memosUrl = urlInput.value.trim().replace(/\/$/, "");
  const memosToken = tokenInput.value.trim();

  if (!memosUrl || !memosToken) {
    showStatus("⚠ Please fill in both fields.", "error");
    return;
  }

  await browser.storage.local.set({ memosUrl, memosToken });
  showStatus("✓ Settings saved!", "success");
});

testBtn.addEventListener("click", async () => {
  const memosUrl = urlInput.value.trim().replace(/\/$/, "");
  const memosToken = tokenInput.value.trim();

  if (!memosUrl || !memosToken) {
    showStatus("⚠ Fill in both fields first.", "error");
    return;
  }

  // Save before testing so background script uses the latest values
  await browser.storage.local.set({ memosUrl, memosToken });

  testBtn.textContent = "Testing…";
  testBtn.disabled = true;
  showStatus("Connecting…", "info", 0);

  try {
    const res = await fetch(`${memosUrl}/api/v1/memos?pageSize=1`, {
      headers: { "Authorization": `Bearer ${memosToken}` }
    });

    if (res.ok) {
      showStatus("✓ Connected! Settings saved.", "success");
    } else {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg += `: ${j.message || j.error || ""}`; } catch (_) {}
      showStatus(`✗ ${msg}`, "error", 6000);
    }
  } catch (e) {
    showStatus(`✗ Could not reach Memos: ${e.message}`, "error", 6000);
  }

  testBtn.textContent = "Test Connection";
  testBtn.disabled = false;
});
