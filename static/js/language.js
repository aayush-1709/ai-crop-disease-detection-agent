/* -------------------------------------------------------
   Simple multi-language support (client-side)
   - Persists user choice in localStorage
   - Translates page text nodes via backend /translate (Gemini)
   - Works across all pages
-------------------------------------------------------- */

(() => {
  const STORAGE_KEY = 'acd_lang';
  const CACHE_KEY = 'acd_lang_cache_v1';

  const LANGS = {
    en: 'English',
    hi: 'Hindi (हिन्दी)',
    te: 'Telugu (తెలుగు)',
    ta: 'Tamil (தமிழ்)',
    kn: 'Kannada (ಕನ್ನಡ)',
    ml: 'Malayalam (മലയാളം)',
    pa: 'Punjabi (ਪੰਜਾਬੀ)',
    bho: 'Bhojpuri (भोजपुरी)',
  };

  function getLang() {
    const v = (localStorage.getItem(STORAGE_KEY) || 'en').trim();
    return LANGS[v] ? v : 'en';
  }

  function setLang(lang) {
    if (!LANGS[lang]) lang = 'en';
    localStorage.setItem(STORAGE_KEY, lang);
  }

  function loadCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveCache(cache) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // ignore
    }
  }

  // Keep originals in-memory so switching back to English restores exactly.
  const originalTextByNode = new WeakMap();
  const originalAttrsByEl = new WeakMap();

  function isTranslatableTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return false;
    const text = node.nodeValue;
    if (!text) return false;
    if (!text.trim()) return false;
    const parent = node.parentElement;
    if (!parent) return false;
    if (parent.closest('[data-no-translate="true"]')) return false;
    const tag = parent.tagName;
    if (!tag) return false;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(tag)) return false;
    return true;
  }

  function collectTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (isTranslatableTextNode(n)) nodes.push(n);
    }
    return nodes;
  }

  function collectTranslatableAttributes(root) {
    const els = Array.from(root.querySelectorAll('input, textarea, button, a'));
    const items = [];
    for (const el of els) {
      if (el.closest('[data-no-translate="true"]')) continue;
      const attrs = ['placeholder', 'title', 'aria-label'];
      for (const attr of attrs) {
        const val = el.getAttribute(attr);
        if (val && val.trim()) {
          items.push({ el, attr, val: val.trim() });
        }
      }
    }
    return items;
  }

  async function translateBatch(lang, texts) {
    const res = await fetch('/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang, texts }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Translation failed');
    if (!Array.isArray(data.translations)) throw new Error('Invalid translation response');
    return data.translations;
  }

  async function applyLanguage(lang) {
    if (!LANGS[lang]) lang = 'en';

    // Ensure selectors match (desktop + mobile can both exist)
    document.querySelectorAll('.languageSelect').forEach((s) => {
      if (s.value !== lang) s.value = lang;
    });

    const root = document.body;
    if (!root) return;

    if (lang === 'en') {
      // Restore text nodes
      const nodes = collectTextNodes(root);
      for (const node of nodes) {
        const orig = originalTextByNode.get(node);
        if (typeof orig === 'string') node.nodeValue = orig;
      }
      // Restore attributes
      const attrItems = collectTranslatableAttributes(root);
      for (const { el, attr } of attrItems) {
        const origAttrs = originalAttrsByEl.get(el);
        if (origAttrs && typeof origAttrs[attr] === 'string') el.setAttribute(attr, origAttrs[attr]);
      }
      return;
    }

    const cache = loadCache();
    cache[lang] = cache[lang] || {};

    // Text nodes
    const nodes = collectTextNodes(root);
    const nodeTexts = nodes.map((n) => {
      if (!originalTextByNode.has(n)) originalTextByNode.set(n, n.nodeValue);
      return (n.nodeValue || '').trim();
    });

    // Attributes
    const attrItems = collectTranslatableAttributes(root);
    const attrTexts = attrItems.map(({ el, attr, val }) => {
      if (!originalAttrsByEl.has(el)) originalAttrsByEl.set(el, {});
      const origAttrs = originalAttrsByEl.get(el);
      if (origAttrs && origAttrs[attr] === undefined) origAttrs[attr] = val;
      return val;
    });

    const allTexts = [...nodeTexts, ...attrTexts].filter(Boolean);
    const uniqueTexts = Array.from(new Set(allTexts));

    // Determine which strings need translation (not cached yet).
    const missing = uniqueTexts.filter((t) => !cache[lang][t]);

    // Translate in chunks to avoid huge payloads.
    const CHUNK = 80;
    for (let i = 0; i < missing.length; i += CHUNK) {
      const slice = missing.slice(i, i + CHUNK);
      try {
        const translated = await translateBatch(lang, slice);
        for (let j = 0; j < slice.length; j++) {
          cache[lang][slice[j]] = translated[j] || slice[j];
        }
        saveCache(cache);
      } catch (e) {
        // If translation endpoint isn't configured, fail gracefully (leave English).
        console.warn('Translation unavailable:', e);
        return;
      }
    }

    // Apply translated nodes
    for (const node of nodes) {
      const orig = originalTextByNode.get(node) || node.nodeValue || '';
      const key = orig.trim();
      if (!key) continue;
      node.nodeValue = cache[lang][key] || orig;
    }

    // Apply translated attributes
    for (const item of attrItems) {
      const key = item.val;
      item.el.setAttribute(item.attr, cache[lang][key] || key);
    }
  }

  function initSelector() {
    const selects = Array.from(document.querySelectorAll('.languageSelect'));
    if (selects.length === 0) return;

    for (const select of selects) {
      // Populate if empty (safe to call multiple times)
      if (select.options.length === 0) {
        for (const [code, label] of Object.entries(LANGS)) {
          const opt = document.createElement('option');
          opt.value = code;
          opt.textContent = label;
          select.appendChild(opt);
        }
      }

      select.value = getLang();
      select.addEventListener('change', async () => {
        const lang = select.value;
        setLang(lang);
        document.querySelectorAll('.languageSelect').forEach((s) => (s.value = lang));
        await applyLanguage(lang);
      });
    }
  }

  // Expose for other scripts (e.g., sending lang to backend)
  window.AppLanguage = {
    LANGS,
    get: getLang,
    set: async (lang) => {
      setLang(lang);
      await applyLanguage(lang);
    },
    apply: applyLanguage,
  };

  document.addEventListener('DOMContentLoaded', async () => {
    initSelector();
    await applyLanguage(getLang());
  });
})();

