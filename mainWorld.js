(() => {
  const CONFIG_KEY = 'cgpt_optimizer_config_v1';
  const EXTRA_KEY = 'cgpt_optimizer_extra_v1';
  const DEFAULTS = {
    enabled: true,
    limit: 5,
    chunkSize: 5,
    autoTrim: true,
    showToolbar: false
  };

  let settings = loadSettings();
  let lastStatus = {
    layoutSupported: null,
    totalMessages: 0,
    renderedMessages: 0,
    hiddenMessages: 0,
    hasOlderMessages: false,
    extraMessages: 0,
    active: Boolean(settings.enabled && settings.autoTrim)
  };

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

  function loadSettings() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (!raw) {
        return { ...DEFAULTS };
      }
      return sanitize(JSON.parse(raw));
    } catch (error) {
      return { ...DEFAULTS };
    }
  }

  function postStatus(patch) {
    lastStatus = {
      ...lastStatus,
      ...patch,
      active: Boolean(settings.enabled && settings.autoTrim)
    };
    window.postMessage({
      source: 'cgpt_optimizer_main',
      type: 'cgptopt-status',
      payload: lastStatus
    }, '*');
  }

  function parseExtra() {
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

  function isConversationGet(url, method) {
    return method === 'GET' && /\/backend-api\/conversation\//.test(url) && !/\/backend-api\/conversations(\/|\?|$)/.test(url);
  }

  function isMessageNode(node) {
    if (!node || typeof node !== 'object') {
      return false;
    }
    return Boolean(node.message && typeof node.message === 'object');
  }

  function buildPath(mapping, currentNode) {
    const path = [];
    let id = currentNode;
    const guard = new Set();
    while (id && mapping[id] && !guard.has(id)) {
      guard.add(id);
      path.unshift(id);
      id = mapping[id].parent;
    }
    return path;
  }

  function cloneNode(node) {
    return JSON.parse(JSON.stringify(node));
  }

  function trimConversationPayload(payload) {
    if (!payload || typeof payload !== 'object' || !payload.mapping || !payload.current_node) {
      return null;
    }

    const mapping = payload.mapping;
    const path = buildPath(mapping, payload.current_node);
    if (path.length === 0) {
      return null;
    }

    const bubblePath = path.filter((id) => isMessageNode(mapping[id]));
    const extra = parseExtra();
    const keepCount = clamp(settings.limit + extra, 1, 5000);

    let startIndex = 0;
    if (bubblePath.length > keepCount) {
      const firstKeptBubble = bubblePath[bubblePath.length - keepCount];
      const idx = path.indexOf(firstKeptBubble);
      startIndex = idx >= 0 ? idx : 0;
    }

    const keptPath = path.slice(startIndex);
    const keptSet = new Set(keptPath);
    const newMapping = {};

    for (let i = 0; i < keptPath.length; i += 1) {
      const id = keptPath[i];
      const src = mapping[id];
      if (!src) {
        continue;
      }
      const node = cloneNode(src);
      node.children = Array.isArray(node.children) ? node.children.filter((childId) => keptSet.has(childId)) : [];
      if (i === 0) {
        node.parent = null;
      } else if (!keptSet.has(node.parent)) {
        node.parent = keptPath[i - 1] || null;
      }
      newMapping[id] = node;
    }

    const renderedBubbles = keptPath.filter((id) => isMessageNode(mapping[id])).length;
    const totalBubbles = bubblePath.length;
    const hidden = Math.max(0, totalBubbles - renderedBubbles);

    return {
      json: {
        ...payload,
        mapping: newMapping,
        current_node: keptSet.has(payload.current_node) ? payload.current_node : keptPath[keptPath.length - 1],
        root: keptPath[0]
      },
      status: {
        layoutSupported: true,
        totalMessages: totalBubbles,
        renderedMessages: renderedBubbles,
        hiddenMessages: hidden,
        hasOlderMessages: hidden > 0,
        extraMessages: extra
      }
    };
  }

  function resetExtraAfterNewPrompt(url, method) {
    if (method !== 'POST') {
      return;
    }
    if (!/\/backend-api\/conversation(\?|$)/.test(url)) {
      return;
    }
    try {
      localStorage.setItem(EXTRA_KEY, JSON.stringify({ url: location.href, extra: 0 }));
    } catch (error) {
      return;
    }
  }

  function patchFetch() {
    if (window.__cgptoptFetchPatched) {
      return;
    }
    window.__cgptoptFetchPatched = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const input = args[0];
      const init = args[1] || {};
      const url = input instanceof Request ? input.url : String(input);
      const method = (init.method || (input instanceof Request ? input.method : 'GET') || 'GET').toUpperCase();

      resetExtraAfterNewPrompt(url, method);

      if (!(settings.enabled && settings.autoTrim && isConversationGet(url, method))) {
        return originalFetch(...args);
      }

      const response = await originalFetch(...args);

      try {
        const text = await response.clone().text();
        const parsed = JSON.parse(text);
        const trimmed = trimConversationPayload(parsed);
        if (!trimmed) {
          postStatus({ layoutSupported: false });
          return response;
        }

        postStatus(trimmed.status);

        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.delete('content-encoding');

        const body = JSON.stringify(trimmed.json);
        const rewritten = new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });

        return rewritten;
      } catch (error) {
        postStatus({ layoutSupported: false });
        return response;
      }
    };
  }

  window.addEventListener('cgptopt-config', (event) => {
    const incoming = event && event.detail ? event.detail : null;
    if (!incoming || typeof incoming !== 'object') {
      return;
    }
    settings = sanitize({ ...settings, ...incoming });
    postStatus({ active: Boolean(settings.enabled && settings.autoTrim) });
  });

  window.addEventListener('cgptopt-request-status', () => {
    postStatus({});
  });

  patchFetch();
  postStatus({});
})();
