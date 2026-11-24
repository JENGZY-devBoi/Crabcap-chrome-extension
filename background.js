import { saveCapture, pruneCaptures } from './lib/db.js';
import { getSettings } from './lib/settings.js';
import { preparePage, settlePage, restorePage, locateMarkedElement } from './lib/page-prep.js';
import { makeThumb } from './lib/thumb.js';
import { defaultTitle } from './lib/rename.js';
import { t, loadLang, pick } from './lib/i18n.js';

// ข้อความที่ส่งเข้าไปใช้ในหน้าเว็บ (content script / ฟังก์ชันที่ฉีด import ไม่ได้)
const PAGE_MESSAGE_KEYS = [
  'stepScroll',
  'stepScrollPct',
  'stepImages',
  'stepAnimations',
  'stepSettle',
  'stepShoot',
  'noteScrollContainer',
  'noteScrollTimeout',
];
const PROGRESS_LABEL_KEYS = ['progressTitle', 'errorTitle', 'cancelling', 'cancel', 'close'];

const SEGMENT_CSS_HEIGHT = 4096; // แคปทีละท่อนเพื่อไม่ให้ชนเพดานขนาดภาพของ GPU
const MAX_CSS_HEIGHT = 50000;
const KEEP_CAPTURES = 30;

const RESTRICTED_URLS = [
  /^chrome:/,
  /^edge:/,
  /^about:/,
  /^devtools:/,
  /^view-source:/,
  /^chrome-extension:/,
  /^https:\/\/chromewebstore\.google\.com/,
  /^https:\/\/chrome\.google\.com\/webstore/,
  /^https:\/\/microsoftedge\.microsoft\.com\/addons/,
];

const busyTabs = new Set();

class CancelledError extends Error {
  constructor() {
    super(t('cancelled'));
    this.name = 'CancelledError';
  }
}

// ---------- entry points ----------

chrome.runtime.onMessage.addListener((msg, sender) => {
  switch (msg?.type) {
    case 'capture':
      chrome.tabs.get(msg.tabId).then((tab) => startCapture(msg.mode, tab));
      break;
    case 'selection':
      if (sender.tab) handleSelection(msg, sender.tab);
      break;
    default:
      break;
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  const mode = { 'capture-full': 'full', 'capture-visible': 'visible', 'capture-select': 'select' }[command];
  if (mode && tab) startCapture(mode, tab);
});

async function startCapture(mode, tab) {
  await loadLang();
  if (!tab?.url || RESTRICTED_URLS.some((re) => re.test(tab.url))) {
    showError(tab?.id, t('restricted'));
    return;
  }
  if (mode === 'select') {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (html) => {
          window.__baSelectHint = html;
        },
        args: [t('selectHint')],
      });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/select-overlay.js'] });
    } catch (err) {
      showError(tab.id, err.message);
    }
    return;
  }
  await runExclusive(tab, async () => {
    if (mode === 'visible') return captureVisible(tab);
    if (mode === 'full') return captureFull(tab);
    return null;
  });
}

async function handleSelection(msg, tab) {
  await loadLang();
  await runExclusive(tab, async () => {
    if (msg.kind === 'region') return captureRegion(tab, msg);
    if (msg.kind === 'element') return captureElement(tab);
    return null;
  });
}

async function runExclusive(tab, job) {
  if (busyTabs.has(tab.id)) return;
  busyTabs.add(tab.id);
  await setBadge(tab.id, '…', '#5B6877');
  try {
    const record = await job();
    if (record) await openResult(tab, record);
    await setBadge(tab.id, '');
  } catch (err) {
    if (err instanceof CancelledError) {
      await setBadge(tab.id, '');
    } else {
      console.error('[CrabCap]', err);
      showError(tab.id, err?.message || String(err));
    }
  } finally {
    busyTabs.delete(tab.id);
  }
}

// ---------- capture modes ----------

async function captureVisible(tab) {
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  return makeRecord(tab, 'visible', [await dataUrlToBlob(dataUrl)]);
}

async function captureRegion(tab, msg) {
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  const record = makeRecord(tab, 'region', [await dataUrlToBlob(dataUrl)]);
  record.crop = { ...msg.rect, viewportWidth: msg.innerWidth };
  return record;
}

async function captureElement(tab) {
  const tabId = tab.id;
  const blob = await withDebugger(tabId, async (send) => {
    await sleep(350); // รอแถบแจ้งเตือน debugger ของ Chrome แสดงผลและ layout ขยับเสร็จ
    const [{ result: rect }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: locateMarkedElement,
    });
    if (!rect || rect.width < 1 || rect.height < 1) throw new Error(t('elementMissing'));
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: true,
      clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 },
    });
    return base64ToBlob(shot.data);
  });
  return makeRecord(tab, 'element', [blob]);
}

/**
 * แคปทั้งหน้าแบบไม่ reload
 * ลำดับสำคัญ: attach debugger ก่อน (แถบเตือนของ Chrome ทำให้ viewport เปลี่ยนขนาด)
 * แล้วค่อยเตรียมหน้า จากนั้นขยาย viewport ครั้งเดียวและแคปทีละท่อน
 */
async function captureFull(tab) {
  const tabId = tab.id;
  const settings = await getSettings();
  const notes = [];

  await progress.show(tabId, t('stepConnect'), null, { reset: true });

  try {
    const result = await withDebugger(tabId, async (send) => {
      await sleep(350);
      let prepared = false;
      try {
        await progress.show(tabId, t('stepPrepare'));
        const [{ result: info }] = await chrome.scripting.executeScript({
          target: { tabId },
          func: preparePage,
          args: [{ ...settings, msg: pick(PAGE_MESSAGE_KEYS) }],
        });
        prepared = true;
        if (!info) throw new Error(t('prepareFailed'));
        if (info.cancelled) throw new CancelledError();
        notes.push(...info.notes);

        // เอาการ์ดความคืบหน้าออกก่อนถ่ายภาพ ไม่อย่างนั้นจะติดไปในภาพ
        await progress.remove(tabId);

        const width = info.clientWidth;
        let cssHeight = await contentHeight(send);

        // ขยาย viewport ให้สูงเท่าเนื้อหา เนื้อหาอาจยาวขึ้นหลังขยาย จึงวัดซ้ำได้สูงสุด 3 รอบ
        let viewportHeight = 0;
        for (let i = 0; i < 3; i += 1) {
          viewportHeight = Math.min(cssHeight, MAX_CSS_HEIGHT);
          await send('Emulation.setDeviceMetricsOverride', {
            width,
            height: viewportHeight,
            deviceScaleFactor: 0,
            mobile: false,
          });
          await chrome.scripting.executeScript({ target: { tabId }, func: settlePage, args: [settings.extraDelay] });
          const measured = await contentHeight(send);
          if (measured <= viewportHeight + 1 || viewportHeight >= MAX_CSS_HEIGHT) {
            cssHeight = measured;
            break;
          }
          cssHeight = measured;
        }

        const captureHeight = Math.min(cssHeight, viewportHeight);
        if (cssHeight > MAX_CSS_HEIGHT) notes.push(t('pageTooLong', { px: MAX_CSS_HEIGHT.toLocaleString() }));

        const total = Math.ceil(captureHeight / SEGMENT_CSS_HEIGHT);
        const segments = [];
        for (let y = 0; y < captureHeight; y += SEGMENT_CSS_HEIGHT) {
          if (total > 1) await setBadge(tabId, `${segments.length + 1}/${total}`, '#5B6877');
          const h = Math.min(SEGMENT_CSS_HEIGHT, captureHeight - y);
          const shot = await send('Page.captureScreenshot', {
            format: 'png',
            fromSurface: true,
            captureBeyondViewport: false,
            clip: { x: 0, y, width, height: h, scale: 1 },
          });
          segments.push(await base64ToBlob(shot.data));
        }
        return { segments, cssWidth: width, cssHeight: captureHeight };
      } finally {
        try {
          await send('Emulation.clearDeviceMetricsOverride');
        } catch (_) {
          /* ignore */
        }
        if (prepared) {
          try {
            await chrome.scripting.executeScript({ target: { tabId }, func: restorePage });
          } catch (_) {
            /* ignore */
          }
        }
      }
    });

    const record = makeRecord(tab, 'full', result.segments);
    record.cssWidth = result.cssWidth;
    record.cssHeight = result.cssHeight;
    record.notes = notes;
    return record;
  } finally {
    await progress.remove(tabId);
  }
}

// ---------- การ์ดความคืบหน้าในหน้าเว็บ ----------

const progress = {
  async ensure(tabId) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/progress-overlay.js'] });
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (labels) => window.__baProgress.setLabels(labels),
      args: [pick(PROGRESS_LABEL_KEYS)],
    });
  },
  async show(tabId, text, fraction = null, { reset = false } = {}) {
    try {
      await this.ensure(tabId);
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (t, f, r) => {
          if (r) window.__baProgress.reset();
          window.__baProgress.update(t, f);
        },
        args: [text, fraction, reset],
      });
    } catch (_) {
      /* หน้าที่ฉีดสคริปต์ไม่ได้ ใช้ badge อย่างเดียว */
    }
  },
  async remove(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.__baProgress?.remove(),
      });
    } catch (_) {
      /* ignore */
    }
  },
  async error(tabId, message) {
    try {
      await this.ensure(tabId);
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (m) => window.__baProgress.error(m),
        args: [message],
      });
    } catch (_) {
      /* ignore */
    }
  },
};

// ---------- helpers ----------

async function withDebugger(tabId, fn) {
  const target = { tabId };
  try {
    await chrome.debugger.attach(target, '1.3');
  } catch (err) {
    throw new Error(t('attachFailed', { msg: err.message }));
  }
  try {
    return await fn((method, params) => chrome.debugger.sendCommand(target, method, params));
  } finally {
    try {
      await chrome.debugger.detach(target);
    } catch (_) {
      /* แท็บอาจถูกปิดไปแล้ว */
    }
  }
}

async function contentHeight(send) {
  const metrics = await send('Page.getLayoutMetrics');
  const size = metrics.cssContentSize || metrics.contentSize;
  return Math.max(1, Math.ceil(size.height));
}

function makeRecord(tab, mode, segments) {
  const createdAt = Date.now();
  return {
    id: crypto.randomUUID(),
    createdAt,
    mode,
    url: tab.url,
    // ชื่อเริ่มต้น CrabCap_วันเวลา เก็บชื่อแท็บไว้ใน pageTitle (ลบชื่อจนว่างตอนเปลี่ยนชื่อ = กลับไปใช้ชื่อแท็บ)
    title: defaultTitle(createdAt),
    pageTitle: tab.title || '',
    renamed: false,
    segments,
    crop: null,
    notes: [],
  };
}

async function openResult(tab, record) {
  try {
    const { thumb, width, height } = await makeThumb(record);
    record.thumb = thumb;
    record.width = width;
    record.height = height;
  } catch (err) {
    console.warn('[CrabCap] could not build thumbnail', err);
  }
  await saveCapture(record);
  await pruneCaptures(KEEP_CAPTURES);
  await chrome.tabs.create({
    url: chrome.runtime.getURL(`result.html#${record.id}`),
    windowId: tab.windowId,
    index: tab.index + 1,
    openerTabId: tab.id,
  });
}

async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

function base64ToBlob(b64) {
  return dataUrlToBlob(`data:image/png;base64,${b64}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function setBadge(tabId, text, color) {
  if (tabId == null) return;
  try {
    await chrome.action.setBadgeText({ tabId, text });
    if (color) await chrome.action.setBadgeBackgroundColor({ tabId, color });
  } catch (_) {
    /* แท็บอาจถูกปิด */
  }
}

function showError(tabId, message) {
  console.warn('[CrabCap]', message);
  if (tabId == null) return;
  progress.error(tabId, message);
  setBadge(tabId, 'ERR', '#C2362B');
  chrome.action.setTitle({ tabId, title: `CrabCap: ${message}` }).catch(() => {});
  setTimeout(() => {
    setBadge(tabId, '');
    chrome.action.setTitle({ tabId, title: 'CrabCap' }).catch(() => {});
  }, 8000);
}
