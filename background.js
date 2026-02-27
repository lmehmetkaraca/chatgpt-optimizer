const DEFAULTS = {
  enabled: true,
  limit: 5,
  chunkSize: 5,
  autoTrim: true,
  showToolbar: false
};

function storageArea() {
  return chrome.storage.sync || chrome.storage.local;
}

function isSupportedUrl(url) {
  if (typeof url !== 'string') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && (parsed.hostname === 'chatgpt.com' || parsed.hostname === 'chat.openai.com');
  } catch (error) {
    return false;
  }
}

async function getSettings() {
  const raw = await storageArea().get(DEFAULTS);
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULTS.enabled,
    limit: Number.isFinite(raw.limit) ? raw.limit : DEFAULTS.limit,
    chunkSize: Number.isFinite(raw.chunkSize) ? raw.chunkSize : DEFAULTS.chunkSize,
    autoTrim: typeof raw.autoTrim === 'boolean' ? raw.autoTrim : DEFAULTS.autoTrim,
    showToolbar: typeof raw.showToolbar === 'boolean' ? raw.showToolbar : DEFAULTS.showToolbar
  };
}

async function send(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    return;
  }
}

async function broadcastSettings() {
  const settings = await getSettings();
  const tabs = await chrome.tabs.query({});
  const targets = tabs.filter((tab) => tab.id && isSupportedUrl(tab.url));
  await Promise.all(targets.map((tab) => send(tab.id, { type: 'settingsUpdated', payload: settings })));
}

async function maybeShowActiveToast() {
  const settings = await getSettings();
  if (!settings.enabled) {
    return;
  }
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.id || !isSupportedUrl(tab.url)) {
    return;
  }
  await send(tab.id, { type: 'showActiveToast' });
}

chrome.runtime.onInstalled.addListener(async () => {
  const store = storageArea();
  const raw = await store.get(DEFAULTS);
  await store.set({
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULTS.enabled,
    limit: Number.isFinite(raw.limit) ? raw.limit : DEFAULTS.limit,
    chunkSize: Number.isFinite(raw.chunkSize) ? raw.chunkSize : DEFAULTS.chunkSize,
    autoTrim: typeof raw.autoTrim === 'boolean' ? raw.autoTrim : DEFAULTS.autoTrim,
    showToolbar: typeof raw.showToolbar === 'boolean' ? raw.showToolbar : DEFAULTS.showToolbar
  });
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  const expected = chrome.storage.sync ? 'sync' : 'local';
  if (areaName !== expected) {
    return;
  }
  const keys = Object.keys(changes);
  if (keys.some((key) => Object.prototype.hasOwnProperty.call(DEFAULTS, key))) {
    await broadcastSettings();
  }
});

chrome.tabs.onActivated.addListener(async () => {
  await maybeShowActiveToast();
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }
  await maybeShowActiveToast();
});
