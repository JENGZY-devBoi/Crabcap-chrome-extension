// ของใช้ร่วมกันของหน้า popup / result / history
import { t, getLang, locale } from './i18n.js';

/** ไอคอนเส้น 24x24 ใช้กับ class "icon" */
export const ICONS = {
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 4v4h4"/><path d="M12 7.5V12l3 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="1.5"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5h10L18 7M9.5 7V4.5h5V7"/>',
  external: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M10 6H5.5v12.5H18V14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  select: '<path d="M5.5 3.5 18 12l-5.5 1.5L10 19Z"/>',
  eyedropper: '<path d="m3.5 20.5 1-1h2.8l8.4-8.4"/><path d="M4.5 19.5v-2.8l8.4-8.4"/><path d="m14.6 5.9 3.2-3.2a2 2 0 0 1 2.9 2.9l-3.2 3.2.4.4a2 2 0 0 1-2.9 2.9l-3.6-3.6a2 2 0 0 1 2.9-2.9Z"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.9 1.4-2l-.3-.8a1.6 1.6 0 0 1 1.5-2.2H17a3.5 3.5 0 0 0 3.5-3.5c0-4.7-3.8-8.5-8.5-8.5Z"/><circle cx="7.8" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="14.8" cy="7.8" r="1"/>',
  toFront: '<path d="M6 4h12M12 20V8.5M7.5 13 12 8.5l4.5 4.5"/>',
  forward: '<path d="M12 19V6.5M7.5 11 12 6.5l4.5 4.5"/>',
  backward: '<path d="M12 5v12.5M7.5 13l4.5 4.5 4.5-4.5"/>',
  toBack: '<path d="M6 20h12M12 4v11.5M7.5 11l4.5 4.5 4.5-4.5"/>',
  layers: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5Z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/><path d="m3.5 16 8.5 4.5 8.5-4.5" opacity=".55"/>',
  eraser: '<path d="M8.5 19.5 3.9 14.9a1.5 1.5 0 0 1 0-2.1l9-9a1.5 1.5 0 0 1 2.1 0l5.1 5.1a1.5 1.5 0 0 1 0 2.1L12.5 19.5Z"/><path d="m8.4 8.4 7.2 7.2M8.5 19.5h12"/>',
  duplicate: '<rect x="8.5" y="8.5" width="11" height="11" rx="1.5"/><path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5M14 12v4M12 14h4"/>',
  crop: '<path d="M6.5 2.5v13.5a1.5 1.5 0 0 0 1.5 1.5h13.5"/><path d="M2.5 6.5H16a1.5 1.5 0 0 1 1.5 1.5v13.5"/>',
  pen: '<path d="M2.5 18.5c3-8.5 6.5-10.5 8-7.5s-2 7.5 1 8 4-11 7-13c1.8-1.2 3.3-.2 3 1.8"/>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="1.5"/>',
  rename: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5Z"/><path d="M13.5 7l3 3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  zip: '<rect x="4.5" y="3.5" width="15" height="17" rx="1.5"/><path d="M12 3.5v1.8M12 7v1.8M12 10.5v1.8"/><rect x="10.2" y="14" width="3.6" height="3.8" rx=".6"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  langEn: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><text x="12" y="16.6" text-anchor="middle" font-size="12" font-weight="700" font-family="system-ui, sans-serif" fill="currentColor" stroke="none">A</text>',
  langTh: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><text x="12" y="16.8" text-anchor="middle" font-size="13" font-weight="700" font-family="&quot;IBM Plex Sans Thai&quot;, &quot;Noto Sans Thai&quot;, sans-serif" fill="currentColor" stroke="none">ก</text>',
  crabLight: '<ellipse cx="12" cy="14.5" rx="6" ry="4.2"/><path d="M4.6 9.6C2.6 9 2.1 6.4 3.6 4.9l1.3 2.1.8-2.4c1.4 1.4 1 4.2-1.1 5Z"/><path d="M19.4 9.6c2-.6 2.5-3.2 1-4.7l-1.3 2.1-.8-2.4c-1.4 1.4-1 4.2 1.1 5Z"/><path d="M4.8 9.7 6.9 12.3M19.2 9.7l-2.1 2.6"/><path d="M10 10.4V8.2M14 10.4V8.2"/><circle cx="10" cy="7.2" r="1"/><circle cx="14" cy="7.2" r="1"/><path d="M6.4 15.6 3.6 17M7.2 17.6l-2.2 2M17.6 15.6l2.8 1.4M16.8 17.6l2.2 2"/>',
  crabDark: '<ellipse cx="12" cy="14.5" rx="6" ry="4.2" fill="currentColor"/><path d="M4.6 9.6C2.6 9 2.1 6.4 3.6 4.9l1.3 2.1.8-2.4c1.4 1.4 1 4.2-1.1 5Z" fill="currentColor"/><path d="M19.4 9.6c2-.6 2.5-3.2 1-4.7l-1.3 2.1-.8-2.4c-1.4 1.4-1 4.2 1.1 5Z" fill="currentColor"/><path d="M4.8 9.7 6.9 12.3M19.2 9.7l-2.1 2.6"/><path d="M10 10.4V8.2M14 10.4V8.2"/><circle cx="10" cy="7.2" r="1" fill="currentColor"/><circle cx="14" cy="7.2" r="1" fill="currentColor"/><path d="M6.4 15.6 3.6 17M7.2 17.6l-2.2 2M17.6 15.6l2.8 1.4M16.8 17.6l2.2 2"/>',
  paste: '<path d="M9 4.5H6.5A1.5 1.5 0 0 0 5 6v13a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V6a1.5 1.5 0 0 0-1.5-1.5H15"/><rect x="9" y="3" width="6" height="3" rx="1"/>',
  images: '<path d="M5 4.5h4.5v15H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Z" fill="currentColor" fill-opacity=".3" stroke="none"/><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M9.5 4.5v15"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
  bubble: '<path d="M6 4.5h12a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2h-7l-4.5 3.5V16H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z"/>',
  loupe: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.2 15.2 5 5"/><path d="M10.5 8v5M8 10.5h5"/>',
  highlight: '<path d="M3.5 3.5h17v17h-17ZM7.5 7.5v9h9v-9Z" fill="currentColor" fill-opacity=".35" fill-rule="evenodd" stroke="none"/><rect x="7.5" y="7.5" width="9" height="9" rx="1"/>',
  arrow: '<path d="M5 19 19 5M10 5h9v9"/>',
  step: '<circle cx="12" cy="12" r="8.5"/><path d="M10.5 9 12.5 7.5V16.5"/>',
  text: '<path d="M5 6.5V5h14v1.5M12 5v14M9 19h6"/>',
  blur: '<path d="M12 3.5s-6 6.6-6 10.6a6 6 0 0 0 12 0c0-4-6-10.6-6-10.6Z"/><path d="M9.2 14.6a2.9 2.9 0 0 0 2.6 2.6" opacity=".55"/>',
  undo: '<path d="M9 14 4.5 9.5 9 5"/><path d="M4.5 9.5H15a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="m15 14 4.5-4.5L15 5"/><path d="M19.5 9.5H9a5 5 0 0 0 0 10h3"/>',
  clear: '<path d="M6 6l12 12M18 6 6 18"/>',
  minus: '<path d="M6 12h12"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
  full: '<rect x="4.5" y="2.5" width="15" height="19" rx="1.5"/><path d="M4.5 6.5h15"/><path d="M7.5 4.5h.01M10 4.5h.01" stroke-width="2.2"/><path d="M8 10.5h8M8 13.5h8M8 16.5h5"/>',
  visible: '<rect x="3" y="4.5" width="18" height="15" rx="1.5"/><path d="M3 8.5h18"/><path d="M6 6.5h.01M8.5 6.5h.01" stroke-width="2.2"/>',
  region: '<path d="M3.5 8V5.5a2 2 0 0 1 2-2H8M16 3.5h2.5a2 2 0 0 1 2 2V8M3.5 16v2.5a2 2 0 0 0 2 2H8"/><path d="m12.5 12 8 2.9-3.5 1.4-1.4 3.5Z"/>',
  gear: '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  all: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"/>',
  element: '<rect x="3.5" y="4.5" width="14" height="10" rx="1.5"/><path d="m12.5 11.5 8 2.9-3.5 1.4-1.4 3.5Z"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 2.5-2.5L20 19"/>',
};

export function icon(name, extraClass = '') {
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/** เติมไอคอนให้ทุก element ที่มี data-icon */
export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) {
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
    delete el.dataset.icon;
  }
}

// ---------- ธีม ----------
// มีแค่สว่างกับมืด ค่าเริ่มต้นเป็นมืด
const THEME_LABEL_KEY = { light: 'themeLight', dark: 'themeDark' };
const THEME_ICON = { light: 'sun', dark: 'moon' };

export function currentTheme() {
  const chosen = document.documentElement.dataset.theme;
  return chosen === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') return;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('ba-theme', theme);
  } catch (_) {
    /* ignore */
  }
  document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

/** ปุ่มสลับธีม สว่าง ⇄ มืด */
export function setupThemeButton(btn) {
  if (!btn) return;
  const render = () => {
    const theme = currentTheme();
    btn.innerHTML = icon(THEME_ICON[theme]);
    btn.title = t(THEME_LABEL_KEY[theme]);
    btn.setAttribute('aria-label', t(THEME_LABEL_KEY[theme]));
  };
  btn.addEventListener('click', () => {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    render();
  });
  document.addEventListener('langchange', render);
  // หน้าอื่นเปลี่ยนธีม ให้หน้านี้เปลี่ยนตาม
  window.addEventListener('storage', (e) => {
    if (e.key !== 'ba-theme') return;
    applyTheme(e.newValue);
    render();
  });
  render();
}

// ---------- คีย์ลัด ----------

const CODE_KEYS = { Minus: '-', Equal: '=', Slash: '/', Period: '.', Comma: ',', BracketLeft: '[', BracketRight: ']' };

/** Mac ใช้ ⌘, Windows และ Linux (Ubuntu) ใช้ Ctrl */
export function isMac() {
  const platform = navigator.userAgentData?.platform;
  if (platform) return platform === 'macOS';
  return /Mac|iPhone|iPad/i.test(navigator.platform || '');
}

/** คำนำหน้าปุ่มลัดที่ตามด้วยตัวอักษร: '⌘' หรือ 'Ctrl+' */
export function modKey() {
  return isMac() ? '⌘' : 'Ctrl+';
}

/** ป้ายคีย์ลัดทั้งชุด เช่น Z → ⌘Z / Ctrl+Z, Shift+Z → ⇧⌘Z / Ctrl+Shift+Z */
export function shortcutLabel(key, { shift = false } = {}) {
  if (isMac()) return `${shift ? '⇧' : ''}⌘${key}`;
  return shift ? `Ctrl+Shift+${key}` : `Ctrl+${key}`;
}

/**
 * ปุ่มที่กดตามตำแหน่งบนคีย์บอร์ด (e.code) ไม่ใช่ตัวอักษรที่พิมพ์ออกมา
 * คีย์ลัดจึงใช้ได้แม้เปลี่ยนแป้นเป็นภาษาไทยหรือภาษาอื่น เช่น ปุ่ม V ยังเป็น 'v' แม้พิมพ์ออกมาเป็น 'อ'
 * คืนค่าเป็นตัวพิมพ์เล็กแบบแป้นอังกฤษ ('v', '7', '-', 'escape', 'backspace' ...)
 */
export function shortcutKey(e) {
  const code = e.code || '';
  if (code.startsWith('Key')) return code.slice(3).toLowerCase();
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad') && /^\d$/.test(code.slice(6))) return code.slice(6);
  if (CODE_KEYS[code]) return CODE_KEYS[code];
  return (e.key || '').toLowerCase();
}

// ---------- toast ----------
let toastTimer;
export function toast(message, { error = false, ms = 2400 } = {}) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('p');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.toggle('error', error);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ---------- รูปแบบข้อความ ----------
const MODE_LABEL_KEY = { full: 'modeFull', visible: 'modeVisible', region: 'modeRegion', element: 'modeElement' };

export function modeLabel(mode) {
  return MODE_LABEL_KEY[mode] ? t(MODE_LABEL_KEY[mode]) : mode;
}

export const MODE_ICON = { full: 'full', visible: 'visible', region: 'region', element: 'element' };

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || url;
  } catch (_) {
    return url || '';
  }
}

export function relativeTime(ts) {
  const rtf = new Intl.RelativeTimeFormat(getLang(), { numeric: 'auto' });
  const diff = (ts - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return t('justNow');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day');
  return new Date(ts).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fullTime(ts) {
  return new Date(ts).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' });
}

export function fileStamp(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

// ---------- tooltip (ใช้ร่วมกันทุกหน้า) ----------

// แสดง tooltip เมื่อชี้ค้าง (หรือ focus ด้วยคีย์บอร์ด) 500ms ออกทันทีเมื่อเลื่อนออก/คลิก
const TIP_DELAY = 500;
let tipTarget = null;
let tipTimer = null;

function hideTip() {
  clearTimeout(tipTimer);
  tipTarget?.classList.remove('tip-on');
  tipTarget = null;
}

function showTipLater(el) {
  if (el === tipTarget) return;
  hideTip();
  tipTarget = el;
  tipTimer = setTimeout(() => el.classList.add('tip-on'), TIP_DELAY);
}

let tooltipsInstalled = false;

/** ตัวจัดการ tooltip ผูกครั้งเดียวต่อหน้า (เรียกเองตอน setTip ครั้งแรก) */
function installTooltips() {
  if (tooltipsInstalled) return;
  tooltipsInstalled = true;
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest?.('.has-tip');
    if (el) showTipLater(el);
    else if (tipTarget && !tipTarget.contains(e.target)) hideTip();
  });
  document.addEventListener('pointerout', (e) => {
    if (tipTarget && !tipTarget.contains(e.relatedTarget)) hideTip();
  });
  document.addEventListener('pointerdown', hideTip, true);
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('.has-tip');
    if (el?.matches(':focus-visible')) showTipLater(el);
  });
  document.addEventListener('focusout', hideTip);
}

/** tooltip ใต้ปุ่ม แสดงชื่อและปุ่มลัด (แทน title ของ browser ที่ขึ้นช้าและจัดรูปแบบไม่ได้) */
export function setTip(btn, label, key = '') {
  installTooltips();
  btn.removeAttribute('title');
  btn.classList.add('has-tip');
  let tip = btn.querySelector(':scope > .tip');
  if (!tip) {
    tip = document.createElement('span');
    tip.className = 'tip';
    tip.setAttribute('aria-hidden', 'true');
    btn.append(tip);
  }
  tip.textContent = label;
  if (key) {
    const kbd = document.createElement('kbd');
    kbd.textContent = key;
    tip.append(kbd);
  }
}

