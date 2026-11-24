import { listCaptures, deleteCapture, patchCapture } from './lib/db.js';
import { makeThumb } from './lib/thumb.js';
import {
  hydrateIcons,
  icon,
  toast,
  hostOf,
  relativeTime,
  fullTime,
  fileStamp,
  downloadBlob,
  modeLabel,
  MODE_ICON,
  shortcutKey,
  setTip,
} from './lib/ui.js';
import { t, applyI18n } from './lib/i18n.js';
import { setupSettingsPopover } from './lib/settings-panel.js';
import { renameCapture, fileName } from './lib/rename.js';
import { renderCapture } from './lib/compose.js';
import { makeZip } from './lib/zip.js';

hydrateIcons();
applyI18n();
setupSettingsPopover(document.getElementById('settings-btn'));
setTip(document.getElementById('settings-btn'), t('settings'));

function renderTitle() {
  document.title = `${t('historyTitle')} · CrabCap`;
}
renderTitle();
document.addEventListener('langchange', () => {
  renderTitle();
  setTip(document.getElementById('settings-btn'), t('settings'));
  render();
});

const els = {
  grid: document.getElementById('grid'),
  empty: document.getElementById('empty'),
  count: document.getElementById('count'),
  q: document.getElementById('q'),
  filters: document.getElementById('filters'),
  selectBar: document.getElementById('select-bar'),
  selCount: document.getElementById('sel-count'),
  selAll: document.getElementById('sel-all'),
  selClear: document.getElementById('sel-clear'),
  selFiles: document.getElementById('sel-files'),
  selZip: document.getElementById('sel-zip'),
};

const selected = new Set(); // id ของรูปที่เลือกไว้ดาวน์โหลด
let lastPicked = null; // สำหรับ Shift+คลิก เลือกเป็นช่วง
let busy = false;

let captures = [];
let mode = '';
const urls = new Map(); // id -> object URL ของภาพย่อ
const MASCOT = '<img class="mascot" src="icons/mascot.svg" alt="" width="104" height="80">';

await load();

// มาจากหน้าแก้ไขหลังลบรูปสุดท้าย
const pendingToast = sessionStorage.getItem('ba-toast');
if (pendingToast) {
  sessionStorage.removeItem('ba-toast');
  toast(pendingToast);
}

async function load() {
  captures = await listCaptures();
  render();
  // ภาพเก่าที่แคปก่อนมีระบบภาพย่อ: สร้างให้ทีหลังแล้วบันทึกไว้
  for (const rec of captures.filter((r) => !r.thumb)) {
    try {
      const { thumb, width, height } = await makeThumb(rec);
      Object.assign(rec, { thumb, width, height });
      await patchCapture(rec.id, { thumb, width, height });
      const card = els.grid.querySelector(`[data-id="${CSS.escape(rec.id)}"] .preview`);
      if (card) card.style.backgroundImage = `url(${thumbUrl(rec)})`;
    } catch (err) {
      console.warn('[CrabCap] could not build thumbnail', err);
    }
  }
}

function thumbUrl(rec) {
  if (!urls.has(rec.id)) {
    const src = rec.thumb || rec.segments?.[0];
    if (!src) return '';
    urls.set(rec.id, URL.createObjectURL(src));
  }
  return urls.get(rec.id);
}

function filtered() {
  const q = els.q.value.trim().toLowerCase();
  return captures.filter((r) => {
    if (mode && r.mode !== mode) return false;
    if (!q) return true;
    return `${r.title} ${r.pageTitle || ''} ${r.url}`.toLowerCase().includes(q);
  });
}

function render() {
  const list = filtered();
  els.count.textContent = captures.length === 1 ? t('countOne') : t('count', { n: captures.length });
  els.grid.replaceChildren(...groupBySite(list).map(siteSection));

  for (const id of [...selected]) if (!captures.some((r) => r.id === id)) selected.delete(id);
  syncSelection();

  els.empty.hidden = list.length > 0;
  if (!captures.length) {
    els.empty.innerHTML = `${MASCOT}<strong>${t('emptyTitle')}</strong>${t('emptyBody')}`;
  } else if (!list.length) {
    els.empty.innerHTML = `${MASCOT}<strong>${t('noMatchTitle')}</strong>${t('noMatchBody')}`;
  }
}

/** จัดกลุ่มตามโดเมน เว็บที่แคปล่าสุดขึ้นก่อน (list เรียงใหม่สุดก่อนอยู่แล้ว) */
function groupBySite(list) {
  const groups = new Map();
  for (const rec of list) {
    const host = hostOf(rec.url) || t('untitled');
    if (!groups.has(host)) groups.set(host, []);
    groups.get(host).push(rec);
  }
  return [...groups].map(([host, items]) => ({ host, items }));
}

function siteSection({ host, items }) {
  const section = document.createElement('section');
  section.className = 'site';

  const head = document.createElement('header');
  head.className = 'site-head';
  head.append(siteIcon(host, items[0].url));
  const name = document.createElement('h2');
  name.textContent = host;
  const count = document.createElement('span');
  count.className = 'count';
  count.textContent = items.length;
  const time = document.createElement('span');
  time.className = 'when';
  time.textContent = relativeTime(items[0].createdAt);
  time.title = fullTime(items[0].createdAt);
  head.append(name, count, time, clearButton(host, items, section));

  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.append(...items.map(card));

  section.append(head, grid);
  return section;
}

/** ปุ่มล้างภาพของเว็บนี้ กดครั้งแรกถามยืนยัน กดซ้ำภายใน 3 วิจึงลบจริง */
function clearButton(host, items, section) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'site-clear tip-end';
  const idle = () => {
    btn.classList.remove('confirm');
    btn.innerHTML = `${icon('trash')}<span>${t('clearSite')}</span>`;
    setTip(btn, t('clearSiteNamed', { host }));
  };
  idle();
  let timer;
  btn.addEventListener('click', async () => {
    if (!btn.classList.contains('confirm')) {
      btn.classList.add('confirm');
      btn.innerHTML = `${icon('trash')}<span>${t('clearSiteConfirm', { n: items.length })}</span>`; // ไม่มี tooltip ตอนถามยืนยัน
      timer = setTimeout(idle, 3000);
      return;
    }
    clearTimeout(timer);
    btn.disabled = true;
    await removeMany(items, section);
    const key = items.length === 1 ? 'siteClearedOne' : 'siteCleared';
    toast(t(key, { n: items.length, host }));
  });
  return btn;
}

async function removeMany(items, section) {
  for (const rec of items) {
    await deleteCapture(rec.id);
    const url = urls.get(rec.id);
    if (url) URL.revokeObjectURL(url);
    urls.delete(rec.id);
  }
  const gone = new Set(items);
  captures = captures.filter((r) => !gone.has(r));
  section.classList.add('removing');
  setTimeout(render, 150);
}

/** favicon จาก cache ของ Chrome (สิทธิ์ favicon) ถ้าไม่มีใช้ตัวอักษรแรกของโดเมน */
function siteIcon(host, url) {
  const box = document.createElement('span');
  box.className = 'site-icon';
  box.textContent = host.charAt(0).toUpperCase();
  if (chrome.runtime?.id && /^https?:/.test(url)) {
    const img = document.createElement('img');
    img.alt = '';
    img.width = 16;
    img.height = 16;
    img.src = chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`);
    img.addEventListener('load', () => box.classList.add('has-img'));
    box.append(img);
  }
  return box;
}

function pathOf(url) {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}` || '/';
  } catch (_) {
    return url;
  }
}

function card(rec) {
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.id = rec.id;

  const href = `result.html#${encodeURIComponent(rec.id)}`;
  const title = rec.title || hostOf(rec.url) || t('untitled');

  const preview = document.createElement('a');
  preview.className = 'preview';
  preview.href = href;
  preview.setAttribute('aria-label', t('open', { title }));
  const src = thumbUrl(rec);
  if (src) preview.style.backgroundImage = `url(${src})`;
  // กำลังเลือกอยู่: คลิกการ์ด = เลือก/เอาออก แทนการเปิด
  preview.addEventListener('click', (e) => {
    if (!selected.size) return;
    e.preventDefault();
    togglePick(rec.id, e.shiftKey);
  });

  const pick = document.createElement('button');
  pick.type = 'button';
  pick.className = 'pick';
  pick.classList.add('tip-start');
  setTip(pick, t('selectCapture'));
  pick.setAttribute('aria-label', t('selectCapture'));
  pick.innerHTML = icon('check');
  pick.addEventListener('click', (e) => togglePick(rec.id, e.shiftKey));
  if (selected.has(rec.id)) el.classList.add('selected');
  pick.setAttribute('aria-pressed', String(selected.has(rec.id)));

  const meta = document.createElement('div');
  meta.className = 'meta';
  const h2 = document.createElement('h2');
  h2.textContent = title;
  h2.title = `${title}\n${t('renameDblHint')}`;
  h2.addEventListener('dblclick', () => startRename(rec, h2));
  const host = document.createElement('span');
  host.className = 'host';
  host.textContent = pathOf(rec.url);
  host.title = rec.url;

  const info = document.createElement('div');
  info.className = 'info';
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.innerHTML = icon(MODE_ICON[rec.mode] || 'image');
  chip.append(modeLabel(rec.mode));
  const time = document.createElement('time');
  time.dateTime = new Date(rec.createdAt).toISOString();
  time.textContent = relativeTime(rec.createdAt);
  time.title = fullTime(rec.createdAt);
  info.append(chip, time);
  if (rec.width && rec.height) {
    const size = document.createElement('span');
    size.textContent = `${rec.width.toLocaleString()} × ${rec.height.toLocaleString()}`;
    info.append(size);
  }
  if (rec.annotations?.length) {
    const notes = document.createElement('span');
    notes.className = 'chip notes';
    notes.textContent = t('notesCount', { n: rec.annotations.length });
    info.append(notes);
  }
  meta.append(h2, host, info);

  const tools = document.createElement('div');
  tools.className = 'tools';
  const dl = document.createElement('button');
  dl.type = 'button';
  dl.className = 'tip-end';
  dl.setAttribute('aria-label', t('downloadNamed', { title }));
  dl.innerHTML = icon('download');
  setTip(dl, t('download'));
  dl.addEventListener('click', () => downloadOriginal(rec));

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'tip-end';
  del.setAttribute('aria-label', t('deleteNamed', { title }));
  del.innerHTML = icon('trash');
  setTip(del, t('delete'));
  let confirmTimer;
  del.addEventListener('click', async () => {
    if (!del.classList.contains('confirm')) {
      del.classList.add('confirm');
      del.innerHTML = `${icon('trash')}${t('deleteConfirm')}`;
      confirmTimer = setTimeout(() => {
        del.classList.remove('confirm');
        del.innerHTML = icon('trash');
        setTip(del, t('delete'));
      }, 3000);
      return;
    }
    clearTimeout(confirmTimer);
    await remove(rec, el);
  });
  const ren = document.createElement('button');
  ren.type = 'button';
  ren.className = 'tip-end';
  ren.setAttribute('aria-label', t('rename'));
  ren.innerHTML = icon('rename');
  setTip(ren, t('rename'));
  ren.addEventListener('click', () => startRename(rec, h2));
  tools.append(ren, dl, del);

  el.append(preview, pick, meta, tools);
  return el;
}

/** เปลี่ยนชื่อในการ์ด: Enter/คลิกที่อื่น = บันทึก, Esc = ยกเลิก, ลบจนว่าง = กลับไปชื่อเดิมของหน้าเว็บ */
function startRename(rec, h2) {
  if (h2.isContentEditable) return;
  const shown = () => rec.title || hostOf(rec.url) || t('untitled');
  h2.textContent = rec.title || '';
  h2.contentEditable = 'plaintext-only';
  h2.classList.add('editing');
  h2.focus();
  getSelection().selectAllChildren(h2);

  const done = async (save) => {
    if (!h2.isContentEditable) return;
    h2.contentEditable = 'false';
    h2.classList.remove('editing');
    h2.removeEventListener('keydown', onKey);
    h2.removeEventListener('blur', onBlur);
    document.removeEventListener('pointerdown', onOutside, true);
    h2.blur();
    if (save) {
      try {
        const { adjusted } = await renameCapture(rec, h2.textContent);
        if (adjusted) toast(t('renameDuplicate', { name: adjusted }));
      } catch (err) {
        toast(t('renameFailed', { msg: err.message }), { error: true });
      }
    }
    h2.textContent = shown();
    h2.title = `${shown()}\n${t('renameDblHint')}`;
  };
  const onKey = (e) => {
    e.stopPropagation(); // ไม่ให้ไปเรียกคีย์ลัด (เช่น / ค้นหา)
    if (e.key === 'Enter') {
      e.preventDefault();
      done(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      done(false);
    }
  };
  const onBlur = () => done(true);
  const onOutside = (e) => {
    if (!h2.contains(e.target)) done(true);
  };
  h2.addEventListener('keydown', onKey);
  h2.addEventListener('blur', onBlur);
  document.addEventListener('pointerdown', onOutside, true);
}

async function remove(rec, el) {
  await deleteCapture(rec.id);
  captures = captures.filter((r) => r !== rec);
  const url = urls.get(rec.id);
  if (url) URL.revokeObjectURL(url);
  urls.delete(rec.id);
  el.classList.add('removing');
  setTimeout(render, 150);
  toast(t('deleted'));
}

/** ดาวน์โหลดจากหน้าประวัติ: ภาพที่ต้องต่อ/ครอป/มีโน้ต ต้องประกอบในหน้า result จึงเปิดหน้านั้นแทน */
function downloadOriginal(rec) {
  if (rec.segments.length === 1 && !rec.crop && !rec.annotations?.length) {
    downloadBlob(rec.segments[0], `${fileName(rec)}.png`);
    toast(t('downloaded'));
    return;
  }
  location.href = `result.html#${encodeURIComponent(rec.id)}`;
}

// ---------- เลือกหลายรูปเพื่อดาวน์โหลด ----------

function togglePick(id, range = false) {
  if (range && lastPicked && lastPicked !== id) {
    // Shift+คลิก: เลือกทุกรูปที่แสดงอยู่ระหว่างรูปก่อนหน้ากับรูปนี้
    const ids = filtered().map((r) => r.id);
    const a = ids.indexOf(lastPicked);
    const b = ids.indexOf(id);
    if (a !== -1 && b !== -1) {
      for (const one of ids.slice(Math.min(a, b), Math.max(a, b) + 1)) selected.add(one);
      lastPicked = id;
      syncSelection();
      return;
    }
  }
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  lastPicked = id;
  syncSelection();
}

function clearSelection() {
  selected.clear();
  lastPicked = null;
  syncSelection();
}

/** อัปเดตการ์ดและแถบล่างตามรูปที่เลือก */
function syncSelection() {
  for (const card of els.grid.querySelectorAll('.card')) {
    const on = selected.has(card.dataset.id);
    card.classList.toggle('selected', on);
    card.querySelector('.pick')?.setAttribute('aria-pressed', String(on));
  }
  document.body.classList.toggle('selecting', selected.size > 0);
  els.selectBar.hidden = selected.size === 0;
  if (!busy) els.selCount.textContent = t('selectedCount', { n: selected.size });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ดาวน์โหลดรูปที่เลือก (ครอป + โน้ตแล้ว) เป็นไฟล์แยก หรือรวมเป็น ZIP ไฟล์เดียว */
async function downloadSelected(asZip) {
  const recs = captures.filter((r) => selected.has(r.id));
  if (!recs.length || busy) return;
  busy = true;
  for (const b of els.selectBar.querySelectorAll('button')) b.disabled = true;
  const files = [];
  const used = new Set();
  let failed = 0;
  try {
    for (const [i, rec] of recs.entries()) {
      els.selCount.textContent = t('preparingN', { i: i + 1, n: recs.length });
      let blobs;
      try {
        blobs = await renderCapture(rec);
      } catch (err) {
        console.warn('[CrabCap] could not prepare', rec.id, err);
        failed += 1;
        continue;
      }
      for (const [k, blob] of blobs.entries()) {
        const base = fileName(rec, blobs.length > 1 ? `_part${k + 1}` : '');
        let name = `${base}.png`;
        for (let n = 2; used.has(name.toLowerCase()); n += 1) name = `${base}_${n}.png`;
        used.add(name.toLowerCase());
        if (asZip) {
          files.push({ name, blob, date: new Date(rec.createdAt) });
        } else {
          downloadBlob(blob, name);
          files.push(name);
          await sleep(200); // เว้นจังหวะ ไม่ให้ browser ตัดไฟล์ที่โหลดติดๆ กัน
        }
      }
    }
    if (asZip && files.length) {
      downloadBlob(await makeZip(files), `CrabCap_${fileStamp(Date.now())}.zip`);
    }
    const n = recs.length - failed;
    if (n) toast(t(asZip ? 'zipDone' : 'downloadedN', { n }));
    if (failed) toast(t('someFailed', { n: failed }), { error: true });
  } finally {
    busy = false;
    for (const b of els.selectBar.querySelectorAll('button')) b.disabled = false;
    syncSelection();
  }
}

els.selAll.addEventListener('click', () => {
  for (const r of filtered()) selected.add(r.id);
  syncSelection();
});
els.selClear.addEventListener('click', clearSelection);
els.selFiles.addEventListener('click', () => downloadSelected(false));
els.selZip.addEventListener('click', () => downloadSelected(true));

// ---------- ตัวกรองและค้นหา ----------
els.q.addEventListener('input', render);
els.filters.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-mode]');
  if (!btn) return;
  mode = btn.dataset.mode;
  for (const b of els.filters.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b === btn));
  render();
});

document.addEventListener('keydown', (e) => {
  // ปุ่ม / ตามตำแหน่งบนแป้น (ใช้ได้แม้แป้นเป็นภาษาไทย)
  const typing = e.target instanceof HTMLInputElement && e.target !== els.q;
  if (shortcutKey(e) === '/' && document.activeElement !== els.q && !typing && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    els.q.focus();
  } else if (e.key === 'Escape' && document.activeElement === els.q) {
    els.q.value = '';
    render();
    els.q.blur();
  } else if (e.key === 'Escape' && selected.size && !busy) {
    clearSelection();
  }
});

// แท็บอื่นแคปภาพใหม่ระหว่างเปิดหน้านี้ไว้
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible') return;
  const fresh = await listCaptures();
  if (fresh.length !== captures.length || fresh[0]?.id !== captures[0]?.id) {
    captures = fresh;
    render();
  }
});
