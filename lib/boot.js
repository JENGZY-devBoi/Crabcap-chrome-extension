// สคริปต์ธรรมดา (ไม่ใช่ module) โหลดใน <head> ของทุกหน้า เพื่อให้ทำงานก่อนหน้าแสดงผล
// 1. ใส่ธีมและภาษาที่ผู้ใช้เลือกทันที ไม่ให้หน้ากระพริบ
// 2. ถ้าเปิดหน้านี้นอก extension (dev preview ผ่าน http://localhost) ให้จำลอง chrome.* API ขั้นต่ำ
(() => {
  try {
    const lang = localStorage.getItem('ba-lang');
    document.documentElement.lang = lang === 'th' ? 'th' : 'en';
    const theme = localStorage.getItem('ba-theme');
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  } catch (_) {
    /* storage ถูกปิด ใช้ธีมตามระบบ */
  }

  const inExtension = Boolean(globalThis.chrome && chrome.runtime && chrome.runtime.id);
  if (inExtension) return;

  // ---------- dev mock ----------
  console.info('[CrabCap] dev preview: ใช้ chrome.* จำลอง');
  document.documentElement.dataset.dev = '';

  const store = {
    read() {
      try {
        return JSON.parse(localStorage.getItem('ba-dev-storage') || '{}');
      } catch (_) {
        return {};
      }
    },
    write(data) {
      try {
        localStorage.setItem('ba-dev-storage', JSON.stringify(data));
      } catch (_) {
        /* ignore */
      }
    },
  };

  const base = new URL('..', document.currentScript.src).href; // โฟลเดอร์ราก ba-capture/

  const mock = {
    runtime: {
      id: undefined,
      getURL: (path) => new URL(path, base).href,
      sendMessage: async (msg) => {
        console.info('[dev] runtime.sendMessage', msg);
        return undefined;
      },
      onMessage: { addListener() {} },
    },
    tabs: {
      query: async () => [{ id: 1, windowId: 1, index: 0, url: 'https://example.com/', title: 'Example' }],
      create: async ({ url }) => {
        if (url.startsWith('chrome://')) {
          console.info('[dev] tabs.create', url);
          return {};
        }
        window.open(url, '_blank');
        return {};
      },
    },
    commands: {
      getAll: async () => [
        { name: 'capture-full', shortcut: 'Alt+Shift+F' },
        { name: 'capture-visible', shortcut: 'Alt+Shift+V' },
        { name: 'capture-select', shortcut: 'Alt+Shift+S' },
      ],
    },
    storage: {
      local: {
        get: async (key) => {
          const data = store.read();
          if (key == null) return data;
          const keys = Array.isArray(key) ? key : [key];
          return Object.fromEntries(keys.filter((k) => k in data).map((k) => [k, data[k]]));
        },
        set: async (obj) => store.write({ ...store.read(), ...obj }),
      },
    },
  };

  const target = globalThis.chrome || {};
  for (const [k, v] of Object.entries(mock)) {
    try {
      target[k] = v;
    } catch (_) {
      Object.defineProperty(target, k, { value: v, configurable: true });
    }
  }
  if (!globalThis.chrome) globalThis.chrome = target;

  // popup จริงกว้างตามเนื้อหา ใน dev ให้มีกรอบเหมือนตอนเปิดจากแถบเครื่องมือ
  if (location.pathname.endsWith('/popup.html')) {
    document.documentElement.classList.add('dev-popup');
  }
})();
