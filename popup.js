import { renderSettings } from './lib/settings-panel.js';
import { listCaptures } from './lib/db.js';
import { hydrateIcons, hostOf, relativeTime } from './lib/ui.js';
import { t, applyI18n } from './lib/i18n.js';

hydrateIcons();
applyI18n();

// เปิด popup ครั้งแรกของวัน: ปูเดินเข้ามาแล้วกระโดดทักทาย (ครั้งเดียวต่อวัน)
(function crabIntro() {
  const d = new Date();
  const today = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  try {
    if (localStorage.getItem('crabcap-intro-day') === today) return;
    localStorage.setItem('crabcap-intro-day', today);
  } catch (_) {
    return; // อ่าน/เขียน storage ไม่ได้: ข้ามไป ไม่ให้เล่นทุกครั้ง
  }
  const crab = document.querySelector('.top .mascot');
  crab?.classList.add('intro');
  crab?.addEventListener('animationend', () => crab.classList.remove('intro'), { once: true });
})();

// ภาษา ธีม และการรอก่อนแคป (แผงเดียวกับหน้าอื่น)
await renderSettings(document.getElementById('settings-body'));

// คำทักใต้ชื่อ
function renderGreeting() {
  document.getElementById('greeting').textContent = t('greeting');
}
renderGreeting();
document.addEventListener('langchange', renderGreeting);

const RESTRICTED = /^(chrome|edge|about|devtools|view-source|chrome-extension):|^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore|microsoftedge\.microsoft\.com\/addons)/;

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

if (tab?.url && RESTRICTED.test(tab.url)) {
  for (const btn of document.querySelectorAll('.mode')) btn.disabled = true;
  document.getElementById('blocked').hidden = false;
}

for (const btn of document.querySelectorAll('.mode')) {
  btn.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'capture', mode: btn.dataset.mode, tabId: tab.id });
    } catch (_) {
      /* service worker ไม่ตอบกลับ ซึ่งเป็นปกติ */
    }
    // ปิด popup เพื่อให้ overlay เลือกพื้นที่ใช้งานได้
    window.close();
  });
}

// เปิดหน้าประวัติเป็นแท็บใหม่ (ลิงก์ใน popup เปิดเองไม่ได้)
function openPage(path) {
  chrome.tabs.create({ url: chrome.runtime.getURL(path) });
  window.close();
}
document.getElementById('history').addEventListener('click', () => openPage('history.html'));
document.getElementById('all').addEventListener('click', (e) => {
  e.preventDefault();
  openPage('history.html');
});

// แสดงปุ่มลัดตามที่ผู้ใช้ตั้งไว้จริง
const commands = await chrome.commands.getAll();
// ปุ่มลัดไม่แสดงบนปุ่ม แต่บอกไว้ใน tooltip ตอนชี้
function renderShortcutTips() {
  for (const btn of document.querySelectorAll('.mode[data-command]')) {
    const cmd = commands.find((c) => c.name === btn.dataset.command);
    if (cmd?.shortcut) btn.title = t('shortcutTip', { key: cmd.shortcut });
    else btn.removeAttribute('title');
  }
}
renderShortcutTips();
document.addEventListener('langchange', renderShortcutTips);

// ภาพล่าสุด
try {
  const recent = await listCaptures(3);
  if (recent.length) {
    const wrap = document.getElementById('thumbs');
    for (const rec of recent) {
      const a = document.createElement('a');
      a.className = 'thumb';
      a.href = `result.html#${encodeURIComponent(rec.id)}`;
      a.title = `${rec.title || rec.url}\n${relativeTime(rec.createdAt)}`;
      const img = document.createElement('span');
      img.className = 'img';
      const src = rec.thumb || rec.segments?.[0];
      if (src) img.style.backgroundImage = `url(${URL.createObjectURL(src)})`;
      const cap = document.createElement('small');
      cap.textContent = hostOf(rec.url);
      a.append(img, cap);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openPage(`result.html#${encodeURIComponent(rec.id)}`);
      });
      wrap.append(a);
    }
    document.getElementById('recent').hidden = false;
  }
} catch (err) {
  console.warn('[CrabCap] could not read recent captures', err);
}
