(() => {
  const DEFAULTS = {
    enabled: true,
    limit: 5,
    chunkSize: 5,
    autoTrim: true,
    showToolbar: false
  };

  const CONFIG_KEY = 'cgpt_optimizer_config_v1';
  const EXTRA_KEY = 'cgpt_optimizer_extra_v1';
  const TOAST_ID = 'cgptopt-toast';
  const TOAST_COOLDOWN_MS = 30000;

  let settings = { ...DEFAULTS };
  let lastStatus = {
    layoutSupported: null,
    totalMessages: 0,
    renderedMessages: 0,
    hiddenMessages: 0,
    hasOlderMessages: false,
    extraMessages: 0,
    active: false
  };

  let visibilityToastShown = false;
  let lastToastAt = 0;

  function storageArea() {
    return chrome.storage.sync || chrome.storage.local;
  }

  function t(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions) || key;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function sanitize(raw) {
    return {
      enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULTS.enabled,
      limit: clamp(Number(raw.limit) || DEFAULTS.limit, 1, 200),
      chunkSize: clamp(Number(raw.chunkSize) || DEFAULTS.chunkSize, 1, 100),
      autoTrim: typeof raw.autoTrim === 'boolean' ? raw.autoTrim : DEFAULTS.autoTrim,
      showToolbar: typeof raw.showToolbar === 'boolean' ? raw.showToolbar : DEFAULTS.showToolbar
    };
  }

  function showToast(text) {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = TOAST_ID;
      document.documentElement.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  function maybeShowActiveToast() {
    if (document.hidden) {
      return;
    }
    if (!(settings.enabled && settings.autoTrim)) {
      return;
    }
    if (lastStatus.layoutSupported === false) {
      return;
    }
    const now = Date.now();
    if (visibilityToastShown || now - lastToastAt < TOAST_COOLDOWN_MS) {
      return;
    }
    visibilityToastShown = true;
    lastToastAt = now;
    showToast(t('activeToast'));
  }

  function dispatchConfig() {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(settings));
    } catch (error) {
      return;
    }
    window.dispatchEvent(new CustomEvent('cgptopt-config', { detail: settings }));
  }

  function getExtraForCurrentUrl() {
    try {
      const raw = localStorage.getItem(EXTRA_KEY);
      if (!raw) {
        return 0;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.url !== location.href) {
        return 0;
      }
      return clamp(Number(parsed.extra) || 0, 0, 1000);
    } catch (error) {
      return 0;
    }
  }

  function setExtraForCurrentUrl(extra) {
    try {
      localStorage.setItem(EXTRA_KEY, JSON.stringify({
        url: location.href,
        extra: clamp(Number(extra) || 0, 0, 1000)
      }));
    } catch (error) {
      return;
    }
  }

  function notifyMainStatusRequest() {
    window.dispatchEvent(new Event('cgptopt-request-status'));
  }

  function applySettings(next) {
    settings = sanitize({ ...settings, ...next });
    dispatchConfig();
  }

  function setupWindowBridge() {
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data || event.data.source !== 'cgpt_optimizer_main') {
        return;
      }
      if (event.data.type === 'cgptopt-status' && event.data.payload && typeof event.data.payload === 'object') {
        lastStatus = { ...lastStatus, ...event.data.payload };
      }
    });
  }

  function setupVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        visibilityToastShown = false;
        return;
      }
      maybeShowActiveToast();
      notifyMainStatusRequest();
    });
  }

  function setupMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || typeof message.type !== 'string') {
        return;
      }

      if (message.type === 'settingsUpdated') {
        applySettings(message.payload || {});
        sendResponse({ ok: true });
      } else if (message.type === 'showActiveToast') {
        maybeShowActiveToast();
        sendResponse({ ok: true });
      } else if (message.type === 'trimNow') {
        setExtraForCurrentUrl(0);
        location.reload();
        sendResponse({ ok: true });
      } else if (message.type === 'loadOlder') {
        const extra = getExtraForCurrentUrl() + settings.chunkSize;
        setExtraForCurrentUrl(extra);
        location.reload();
        sendResponse({ ok: true });
      } else if (message.type === 'getStatus') {
        sendResponse({
          ok: true,
          layoutSupported: lastStatus.layoutSupported,
          enabled: settings.enabled,
          autoTrim: settings.autoTrim,
          limit: settings.limit,
          totalMessages: lastStatus.totalMessages,
          renderedMessages: lastStatus.renderedMessages,
          visibleMessages: lastStatus.renderedMessages,
          hiddenMessages: lastStatus.hiddenMessages,
          hasOlderMessages: lastStatus.hasOlderMessages,
          extraMessages: lastStatus.extraMessages,
          processing: false
        });
      }
    });
  }

  async function init() {
    try {
      const raw = await storageArea().get(DEFAULTS);
      applySettings(raw);
      setupWindowBridge();
      setupVisibility();
      setupMessages();
      notifyMainStatusRequest();
      if (!document.hidden) {
        maybeShowActiveToast();
      }
    } catch (error) {
      console.error('Optimizer init failed');
    }
  }

  init();
})();
