import { getCapture, patchCapture, listCaptures, deleteCapture } from './lib/db.js';
import { Cropper, cropBlob, shiftAnnotations } from './lib/crop.js';
import { makeThumb } from './lib/thumb.js';
import { buildImages } from './lib/compose.js';
import { Annotator, COLORS, TOOLS, SIZES, FILLS, HEADS, OUTLINES, SHAPES, DASHES, DASH_TYPES, BORDERS, BORDER_TYPES, FONT_SIZES, FONT_TYPES, SIZED_TYPES, FILLED_TYPES, HEAD_TYPES, OUTLINE_TYPES, SHAPE_TYPES, NO_COLOR_TYPES, DEFAULT_SIZE } from './lib/annotate.js';
import { hydrateIcons, icon, toast, hostOf, downloadBlob, shortcutKey, shortcutLabel, modKey, setTip } from './lib/ui.js';
import { t, applyI18n } from './lib/i18n.js';
import { setupSettingsPopover } from './lib/settings-panel.js';
import { renameCapture, fileName as captureFileName } from './lib/rename.js';

const ZOOMS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

hydrateIcons();
applyI18n();

// แถบเครื่องมือติดใต้แถบบนพอดี: วัดความสูงแถบบนจริง (เปลี่ยนได้ตามภาษา/ความกว้างจอ)
const header = document.querySelector('.bar');
const syncBarHeight = () => document.documentElement.style.setProperty('--bar-h', `${header.offsetHeight}px`);
new ResizeObserver(syncBarHeight).observe(header);
syncBarHeight();
// แถบรูปอื่นที่แคปไว้เริ่มใต้แถบเครื่องมือ
const toolbarEl = document.getElementById('toolbar');
const syncToolbarHeight = () => document.documentElement.style.setProperty('--toolbar-h', `${toolbarEl.offsetHeight}px`);
new ResizeObserver(syncToolbarHeight).observe(toolbarEl);
setupSettingsPopover(document.getElementById('settings-btn'));

const els = {
  title: document.getElementById('title'),
  url: document.getElementById('url'),
  size: document.getElementById('size'),
  notes: document.getElementById('notes'),
  canvas: document.getElementById('canvas'),
  copy: document.getElementById('copy'),
  download: document.getElementById('download'),
  downloadMore: document.getElementById('download-more'),
  downloadMenu: document.getElementById('download-menu'),
  zoomIn: document.getElementById('zoom-in'),
  zoomOut: document.getElementById('zoom-out'),
  zoomLabel: document.getElementById('zoom-label'),
  zoomMenu: document.getElementById('zoom-menu'),
  toolbar: document.getElementById('toolbar'),
  tools: document.getElementById('tools'),
  colors: document.getElementById('colors'),
  sizes: document.getElementById('sizes'),
  heads: document.getElementById('heads'),
  dashes: document.getElementById('dashes'),
  fontsizes: document.getElementById('fontsizes'),
  borders: document.getElementById('borders'),
  outlines: document.getElementById('outlines'),
  arrange: document.getElementById('arrange'),
  fills: document.getElementById('fills'),
  undo: document.getElementById('undo'),
  redo: document.getElementById('redo'),
  clear: document.getElementById('clear'),
  cropBtn: document.getElementById('crop-btn'),
  cropBar: document.getElementById('crop-bar'),
  cropMode: document.getElementById('crop-mode'),
  cropSize: document.getElementById('crop-size'),
  cropAll: document.getElementById('crop-all'),
  cropRestore: document.getElementById('crop-restore'),
  cropCancel: document.getElementById('crop-cancel'),
  cropApply: document.getElementById('crop-apply'),
  libraryBtn: document.getElementById('library-btn'),
  library: document.getElementById('library'),
  libraryList: document.getElementById('library-list'),
  deleteBtn: document.getElementById('delete-capture'),
  styleWrap: document.getElementById('style-wrap'),
  styleMore: document.getElementById('style-more'),
  styleGroup: document.getElementById('style-group'),
};

// ---------- จอเล็ก: รวมตัวเลือกรูปแบบ (ขนาดเส้น แบบเส้น หัวลูกศร ฯลฯ) ไว้ในปุ่มเดียว ----------
// จอกว้าง CSS แสดงทุกตัวเรียงตามปกติและซ่อนปุ่มนี้ จอเล็กซ่อนกลุ่มไว้ กดปุ่มแล้วเปิดเป็นแผงลอย
function openStyleGroup(show) {
  els.styleGroup.style.setProperty('--shift', '0px');
  els.styleGroup.classList.toggle('open', show);
  if (show) {
    // แผงกึ่งกลางใต้ปุ่มอาจล้นขอบจอ (จอแคบ): เลื่อนกลับเข้ามาในจอ
    const box = els.styleGroup.getBoundingClientRect();
    const shift = box.left < 8 ? 8 - box.left : box.right > innerWidth - 8 ? innerWidth - 8 - box.right : 0;
    els.styleGroup.style.setProperty('--shift', `${shift}px`);
  }
  els.styleMore.setAttribute('aria-expanded', String(show));
  els.styleMore.setAttribute('aria-pressed', String(show));
}
els.styleMore.addEventListener('click', (e) => {
  e.stopPropagation();
  openStyleGroup(!els.styleGroup.classList.contains('open'));
});
// ไม่ปิดตาม closemenus เพราะ dropdown ข้างในแผงส่ง closemenus ตอนเปิดตัวเอง
document.addEventListener('pointerdown', (e) => {
  if (els.styleGroup.classList.contains('open') && !els.styleWrap.contains(e.target) && !e.target.closest?.('.dd-menu')) {
    openStyleGroup(false);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && els.styleGroup.classList.contains('open') && !document.querySelector('.dd-menu:not([hidden])')) {
    openStyleGroup(false);
  }
});

let parts = [];
let record = null;
let annotator = null;
let zoom = 'fit';

init().catch((err) => {
  console.error(err);
  showEmpty(t('buildFailed', { msg: err.message }));
});

async function init() {
  const id = decodeURIComponent(location.hash.slice(1));
  els.canvas.innerHTML = `<div class="loading" aria-label="${t('loadingImage')}"></div>`;
  document.body.classList.add('page-loading');
  const rec = id ? await getCapture(id) : null;
  if (!rec) {
    showEmpty(t('notFound'), true);
    return;
  }

  els.title.removeAttribute('data-i18n');
  setupRename();
  els.libraryBtn.disabled = false;
  els.libraryBtn.addEventListener('click', () => toggleLibrary());
  setupDeleteCapture();
  // ปุ่ม Back/Forward ของ browser: สลับไปรูปตาม hash
  window.addEventListener('popstate', () => {
    const next = decodeURIComponent(location.hash.slice(1));
    if (next && next !== record?.id) switchCapture(next, { push: false });
  });

  await showRecord(rec);
  const pending = sessionStorage.getItem('ba-toast');
  if (pending) {
    sessionStorage.removeItem('ba-toast');
    toast(pending);
  }
}

/** แสดงรูปนี้ในหน้า (ใช้ทั้งตอนเปิดหน้าและตอนสลับรูปโดยไม่โหลดหน้าใหม่) */
async function showRecord(rec) {
  const nextParts = await buildImages(rec);
  // เก็บค่าเครื่องมือที่ผู้ใช้เลือกไว้ไปใช้กับรูปถัดไป
  const keep = annotator && {
    color: annotator.color,
    size: annotator.size,
    fill: annotator.fill,
    head: annotator.head,
    dash: annotator.dash,
    shape: annotator.shape,
    outline: annotator.outline,
    border: annotator.border,
    fontSize: annotator.fontSize,
  };
  annotator?.destroy();
  annotator = null;
  for (const p of parts) if (p.url) URL.revokeObjectURL(p.url);

  record = rec;
  parts = nextParts;
  showTitle();
  els.url.textContent = record.url;
  els.url.href = record.url;
  // หมายเหตุจากตอนแคป (เช่น ขยายพื้นที่เลื่อนในหน้า): แจ้งเป็น popup ครั้งเดียวตอนเปิดรูปนี้ครั้งแรก
  els.notes.hidden = true;
  if (record.notes?.length && !record.notesSeen) {
    toast(record.notes.join(' '), { ms: 5000 });
    record.notesSeen = true;
    patchCapture(record.id, { notesSeen: true }).catch(() => {});
  }

  renderParts();
  setupAnnotations(keep);
  if (!els.library.hidden) renderLibrary();
  document.body.classList.remove('page-loading');

  els.download.disabled = false;
  els.downloadMore.disabled = false;
  els.copy.disabled = parts.length !== 1;
  els.copy.title = parts.length > 1 ? t('tooLongToCopy') : '';
  renderStaticTips();
}

function renderParts() {
  els.canvas.replaceChildren();
  parts.forEach((part, i) => {
    const fig = document.createElement('figure');
    fig.className = 'part';
    const stage = document.createElement('div');
    stage.className = 'stage';
    const img = document.createElement('img');
    part.url = URL.createObjectURL(part.blob);
    img.src = part.url;
    img.alt = parts.length > 1 ? t('partAlt', { i: i + 1 }) : t('captureAlt');
    img.width = part.width;
    img.height = part.height;
    img.draggable = false;
    stage.append(img);
    fig.append(stage);
    part.stage = stage;
    if (parts.length > 1) {
      const cap = document.createElement('figcaption');
      cap.textContent = t('partOf', { i: i + 1, n: parts.length });
      fig.prepend(cap);
    }
    els.canvas.append(fig);
  });

  renderSize();
  applyZoom();
}

function renderSize() {
  if (!parts.length) return;
  const totalHeight = parts.reduce((s, p) => s + p.height, 0);
  els.size.textContent = `· ${parts[0].width} × ${totalHeight}`;
}

// เปลี่ยนภาษาโดยไม่ต้องโหลดหน้าใหม่ (ภาพใหญ่ประกอบใหม่ช้า)
document.addEventListener('langchange', () => {
  if (!record) return;
  if (!els.title.isContentEditable) showTitle();
  renderSize();
  applyZoom();
  const pressed = els.tools.querySelector('[aria-pressed="true"]')?.dataset.tool;
  const checked = annotator?.color;
  renderToolButtons();
  renderSwatches();
  renderStyleButtons();
  renderStaticTips();
  if (annotator) {
    setTool(pressed || activeTool);
    if (checked) markColor(checked);
    markStyle();
  } else if (parts.length > 1) {
    els.toolbar.title = t('tooLongToAnnotate');
  }
  if (parts.length > 1) els.copy.title = t('tooLongToCopy');
});

// ---------- ซูม ----------

function cssWidth(part) {
  // 100% = 1 pixel ของภาพต่อ 1 pixel จริงของจอ
  return part.width / (window.devicePixelRatio || 1);
}

const CANVAS_GUTTER = 20; // ระยะขอบซ้ายขวาของพื้นที่แสดงภาพ

function availableWidth() {
  return els.canvas.clientWidth - CANVAS_GUTTER * 2;
}

function fitScale() {
  return Math.min(1, availableWidth() / cssWidth(parts[0]));
}

/** ความกว้างที่ทำให้ภาพทั้งภาพอยู่ในจอทั้งกว้างและสูง (ใช้ตอนครอป) */
function containWidth(part) {
  const top = els.canvas.getBoundingClientRect().top + document.scrollingElement.scrollTop;
  const footer = els.cropBar.hidden ? 0 : els.cropBar.offsetHeight;
  const availableHeight = Math.max(120, innerHeight - top - footer - 28 - 24);
  return Math.min(cssWidth(part), availableWidth(), (availableHeight * part.width) / part.height);
}

function applyZoom() {
  if (!parts.length) return;
  const fit = zoom === 'fit' || zoom === 'contain';
  els.canvas.classList.toggle('zoomed', !fit);
  // พอดีจอ: กำหนดความกว้างเองให้ไม่เกินพื้นที่ (ไม่พึ่ง max-width ซึ่งใน grid ไม่ได้ผลเสมอ)
  const widthOf = (part) => {
    if (zoom === 'contain') return containWidth(part);
    if (fit) return Math.min(cssWidth(part), availableWidth());
    return cssWidth(part) * zoom;
  };
  const widths = parts.map(widthOf);
  parts.forEach((part, i) => {
    part.stage.style.width = `${Math.floor(widths[i])}px`;
  });
  // ภาพกว้างเกินแค่ระยะขอบ (เช่นแคปส่วนที่มองเห็นแล้วดูที่ 100%) ให้ลดขอบแทนการมีแถบเลื่อนแนวนอน
  const widest = Math.max(...widths);
  const spare = (els.canvas.clientWidth - widest) / 2;
  const gutter = widest > availableWidth() && spare >= 0 ? Math.floor(spare) : CANVAS_GUTTER;
  els.canvas.style.paddingInline = `${Math.max(0, Math.min(CANVAS_GUTTER, gutter))}px`;
  // ป้ายแสดงเปอร์เซ็นต์จริงเสมอ ส่วนโหมดดูจากปุ่มที่ถูกกดอยู่
  const current = fit ? Math.min(1, widths[0] / cssWidth(parts[0])) : zoom;
  els.zoomLabel.innerHTML = `<span>${Math.round(current * 100)}%</span><span class="dd-caret" aria-hidden="true"></span>`;
  for (const b of els.zoomMenu.querySelectorAll('[data-zoom]')) {
    b.setAttribute('aria-checked', String(b.dataset.zoom === String(zoom)));
  }
  els.zoomOut.disabled = current <= ZOOMS[0];
  els.zoomIn.disabled = current >= ZOOMS[ZOOMS.length - 1];
}

function stepZoom(dir) {
  if (cropper) return;
  const current = typeof zoom === 'number' ? zoom : Math.min(1, parts[0].stage.getBoundingClientRect().width / cssWidth(parts[0]));
  const next =
    dir > 0 ? ZOOMS.find((z) => z > current + 0.001) : [...ZOOMS].reverse().find((z) => z < current - 0.001);
  if (next) setZoom(next);
}

function setZoom(z) {
  // คงจุดกึ่งกลางจอไว้ตอนซูม
  const doc = document.scrollingElement;
  const ratioY = (doc.scrollTop + innerHeight / 2) / doc.scrollHeight;
  zoom = z;
  applyZoom();
  doc.scrollTop = ratioY * doc.scrollHeight - innerHeight / 2;
}

els.zoomIn.addEventListener('click', () => stepZoom(1));
els.zoomOut.addEventListener('click', () => stepZoom(-1));
// เมนูเลือกโหมดซูม (กดที่ตัวเลข %)
function openZoomMenu(show) {
  if (show) document.dispatchEvent(new Event('closemenus')); // เปิดอันนี้ = ปิดเมนูอื่นทั้งหมดก่อน
  els.zoomMenu.hidden = !show;
  els.zoomLabel.setAttribute('aria-expanded', String(show));
  els.zoomLabel.setAttribute('aria-pressed', String(show));
}
els.zoomLabel.addEventListener('click', (e) => {
  e.stopPropagation();
  openZoomMenu(els.zoomMenu.hidden);
});
els.zoomMenu.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-zoom]');
  if (!btn) return;
  const value = btn.dataset.zoom;
  setZoom(value === 'fit' || value === 'contain' ? value : Number(value));
  openZoomMenu(false);
});
document.addEventListener('click', (e) => {
  if (!els.zoomMenu.hidden && !e.target.closest('#zoom-dd')) openZoomMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.zoomMenu.hidden) openZoomMenu(false);
});
document.addEventListener('closemenus', () => openZoomMenu(false));

/** คีย์ 0: วน พอดีจอ → แสดงทั้งหมด → 100% */
function cycleZoom() {
  if (zoom === 'fit') setZoom('contain');
  else if (zoom === 'contain') setZoom(1);
  else setZoom('fit');
}
window.addEventListener('resize', () => {
  if (zoom === 'fit' || zoom === 'contain') applyZoom();
  alignCropFooter();
});

// ---------- โน้ต ----------

let toolbarRendered = false;

function setupAnnotations(keep = null) {
  els.toolbar.hidden = false;
  els.toolbar.removeAttribute('title');
  setTip(els.cropBtn, t('crop'), 'X');
  wireToolbarOnce();
  if (parts.length !== 1) {
    if (!toolbarRendered) {
      renderToolButtons();
      renderSwatches();
      renderStyleButtons();
      toolbarRendered = true;
    }
    // ปิดปุ่มโน้ตทั้งหมด แต่ซูมและแถบรูปอื่นยังใช้ได้
    els.toolbar.querySelectorAll('button').forEach((b) => {
      if (!b.closest('.view-tools, .lib-tools, .page-tools')) b.disabled = true;
    });
    setTip(els.cropBtn, t('cropUnavailable'));
    // ภาพแบ่งหลายไฟล์: บอกเหตุผลตอนชี้ที่แถบเครื่องมือ (ปุ่มถูกปิดไว้)
    els.toolbar.title = t('tooLongToAnnotate');
    return;
  }

  annotator = new Annotator({
    stage: parts[0].stage,
    blob: parts[0].blob,
    width: parts[0].width,
    height: parts[0].height,
    items: record.annotations || [],
    onChange: (items) => {
      record.annotations = items;
      updateHistoryButtons();
      scheduleSave();
    },
    assets: record.assets || {},
    onAssets: () => scheduleSave(),
  });
  if (keep) Object.assign(annotator, keep);
  setupStageDrop(parts[0].stage);
  parts[0].stage.addEventListener('annot-imagecrop', (e) => {
    if (e.detail.active) toast(t('imageCropHint'));
  });
  setupContextMenu(parts[0].stage);
  parts[0].stage.addEventListener('annot-select', (e) => {
    // ให้แถบเครื่องมือแสดงค่าของรูปที่เลือก (หลายชิ้นใช้ค่าของชิ้นแรกที่รองรับ)
    const { items } = e.detail;
    const first = (types) => items.find((it) => types.includes(it.type));
    const coloured = items.find((it) => it.color && !NO_COLOR_TYPES.includes(it.type));
    if (coloured) markColor(coloured.color);
    const sized = first(SIZED_TYPES);
    if (sized) annotator.size = sized.size || DEFAULT_SIZE;
    const filled = first(FILLED_TYPES);
    if (filled) annotator.fill = filled.fill || 'none';
    const headed = first(HEAD_TYPES);
    if (headed) annotator.head = headed.head || 'triangle';
    const dashed = first(DASH_TYPES);
    if (dashed) annotator.dash = dashed.dash || 'solid';
    const bordered = first(BORDER_TYPES);
    if (bordered) annotator.border = bordered.border || 'none';
    const shaped = first(SHAPE_TYPES);
    if (shaped) annotator.shape = shaped.shape || 'rect';
    const texted = first(OUTLINE_TYPES);
    if (texted) annotator.outline = texted.outline || 'auto';
    if (texted) annotator.fontSize = annotator.fontSizeOf(texted);
    markStyle();
  });

  if (!toolbarRendered) {
    renderToolButtons();
    renderSwatches();
    renderStyleButtons();
    toolbarRendered = true;
  } else {
    // สลับมาจากรูปอื่น: เปิดปุ่มกลับ (markStyle / updateHistoryButtons ปิดตัวที่ใช้ไม่ได้อีกที)
    els.toolbar.querySelectorAll('button').forEach((b) => {
      b.disabled = false;
    });
  }
  renderStaticTips();
  setTool('select');
  markColor(annotator.color);
  updateHistoryButtons();
  els.cropBtn.disabled = false;
}

let toolbarWired = false;

/** ตัวจัดการที่ผูกครั้งเดียวต่อหน้า (ใช้ annotator ปัจจุบันเสมอ) */
function wireToolbarOnce() {
  if (toolbarWired) return;
  toolbarWired = true;

  // คลิกปุ่มในแถบเครื่องมือด้วยเมาส์แล้วปล่อย focus ทันที
  // ไม่งั้นพอกดคีย์ลัดต่อ Chrome จะโชว์กรอบ focus และ tooltip ค้างบนปุ่มที่คลิกไว้ก่อนหน้า
  els.toolbar.addEventListener('click', (e) => {
    if (e.detail > 0) e.target.closest('button')?.blur();
  });

  // คลิกที่ว่างนอกภาพ (พื้นหลัง แถบหัว) = เลิกเลือก
  // ยกเว้นแถบเครื่องมือโน้ต เมนู และแผงการตั้งค่า เพราะใช้เปลี่ยนค่าของรูปที่เลือกอยู่
  document.addEventListener('pointerdown', (e) => {
    if (!annotator?.selectedIds.size) return;
    // ใช้ composedPath เพราะ SVG ถูกวาดใหม่ตอนกดรูป e.target อาจหลุดจากหน้าไปแล้ว
    const inside = e
      .composedPath()
      .some((node) => node instanceof Element && node.matches('.stage, .toolbar, .dd-menu, .settings-pop, .ctx-menu'));
    if (inside) return;
    annotator.select(null);
  });

  els.cropBtn.addEventListener('click', startCrop);
  els.cropAll.addEventListener('click', () => cropper?.selectAll());
  els.cropCancel.addEventListener('click', () => endCrop());
  els.cropApply.addEventListener('click', applyCrop);
  els.cropRestore.addEventListener('click', restoreOriginal);

  els.undo.addEventListener('click', undoStep);
  els.redo.addEventListener('click', () => annotator?.redo());
  els.clear.addEventListener('click', () => {
    if (!annotator) return;
    annotator.clear();
    toast(t('notesCleared', { mod: modKey() }));
  });

  // วางไฟล์พลาดนอกภาพ: ไม่ให้ browser เปิดไฟล์แทนหน้านี้
  document.addEventListener('dragover', (e) => {
    if ([...e.dataTransfer.types].includes('Files')) e.preventDefault();
  });
  document.addEventListener('drop', (e) => {
    if ([...e.dataTransfer.types].includes('Files')) e.preventDefault();
  });
  // ⌘V ภาพจากคลิปบอร์ด
  document.addEventListener('paste', (e) => {
    if (!annotator || cropper || annotator.isEditing()) return;
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (!item) return;
    e.preventDefault();
    pasteBlob(item.getAsFile(), null);
  });
}

// เครื่องมือที่รวมอยู่ในปุ่มเดียว (ปุ่มแสดงตัวที่ใช้ล่าสุด กดแล้วมีให้เลือก)
const TOOL_GROUPS = [['loupe', 'highlight']];

function renderToolButtons() {
  els.tools.replaceChildren(
    ...TOOLS.filter((tool) => !TOOL_GROUPS.some((g) => g.indexOf(tool.id) > 0)).map((tool) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'icon-btn tool';
      b.dataset.tool = tool.id;
      b.setAttribute('aria-label', t(tool.label));
      b.setAttribute('aria-keyshortcuts', tool.key);
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = icon(tool.icon);
      setTip(b, t(tool.label), tool.key);
      b.disabled = !annotator;
      if (tool.id === 'rect') return shapePicker(b);
      const group = TOOL_GROUPS.find((g) => g[0] === tool.id);
      if (group) return toolGroupPicker(b, group);
      b.addEventListener('click', () => setTool(tool.id));
      return b;
    }),
  );
}

/** ปุ่มเดียวรวมหลายเครื่องมือ: กดแล้วมีรายการเครื่องมือในกลุ่มให้เลือก */
function toolGroupPicker(b, group) {
  const wrap = document.createElement('span');
  wrap.className = 'dropdown shape-dd';
  b.dataset.group = group.join(' ');
  b.setAttribute('aria-haspopup', 'menu');
  b.setAttribute('aria-expanded', 'false');
  const menu = document.createElement('div');
  menu.className = 'dd-menu tool-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  const open = (show) => {
    if (show) document.dispatchEvent(new Event('closemenus')); // เปิดอันนี้ = ปิดเมนูอื่นทั้งหมดก่อน
    menu.hidden = !show;
    b.setAttribute('aria-expanded', String(show));
    if (show) {
      for (const item of menu.children) item.setAttribute('aria-selected', String(item.dataset.value === b.dataset.tool));
    }
  };
  for (const id of group) {
    const tool = TOOLS.find((x) => x.id === id);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'dd-item';
    item.dataset.value = id;
    item.setAttribute('role', 'menuitemradio');
    item.innerHTML = `${icon(tool.icon)}<span>${t(tool.label)}</span><kbd>${tool.key}</kbd>`;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      setTool(id);
      open(false);
    });
    menu.append(item);
  }
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    setTool(b.dataset.tool);
    open(menu.hidden);
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !wrap.contains(e.target)) open(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) open(false);
  });
  document.addEventListener('closemenus', () => open(false));
  wrap.append(b, menu);
  return wrap;
}

/** ให้ปุ่มกลุ่มแสดงเครื่องมือที่เลือกอยู่ */
function showGroupTool(id) {
  const b = [...els.tools.querySelectorAll('.tool[data-group]')].find((x) => x.dataset.group.split(' ').includes(id));
  if (!b || b.dataset.tool === id) return;
  const tool = TOOLS.find((x) => x.id === id);
  b.dataset.tool = id;
  b.setAttribute('aria-label', t(tool.label));
  b.setAttribute('aria-keyshortcuts', tool.key);
  b.querySelector('svg.icon')?.replaceWith(document.createRange().createContextualFragment(icon(tool.icon)));
  setTip(b, t(tool.label), tool.key);
}

/** ปุ่มเครื่องมือรูปทรง: กดแล้วมีแถวรูปทรงให้เลือกทันที (สี่เหลี่ยม วงรี กล่องคำพูด ดาว) */
function shapePicker(b) {
  const wrap = document.createElement('span');
  wrap.className = 'dropdown shape-dd';
  b.setAttribute('aria-haspopup', 'menu');
  b.setAttribute('aria-expanded', 'false');
  const menu = document.createElement('div');
  menu.className = 'dd-menu shape-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  const open = (show) => {
    if (show) document.dispatchEvent(new Event('closemenus')); // เปิดอันนี้ = ปิดเมนูอื่นทั้งหมดก่อน
    menu.hidden = !show;
    b.setAttribute('aria-expanded', String(show));
    if (show) {
      for (const item of menu.children) item.setAttribute('aria-pressed', String(item.dataset.shape === annotator.shape));
    }
  };
  for (const shape of SHAPES) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'icon-btn plain';
    item.dataset.shape = shape.id;
    item.setAttribute('role', 'menuitemradio');
    item.setAttribute('aria-label', t(shape.name));
    item.innerHTML = icon(shape.id);
    setTip(item, t(shape.name));
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      annotator.setShape(shape.id);
      setTool('rect');
      open(false);
    });
    menu.append(item);
  }
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    setTool('rect');
    open(menu.hidden);
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !wrap.contains(e.target)) open(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) open(false);
  });
  document.addEventListener('closemenus', () => open(false));
  wrap.append(b, menu);
  return wrap;
}

// ---------- สี (dropdown: สีพื้นฐาน, ใช้ล่าสุด, ดูดสี, กำหนดเอง) ----------

const RECENT_KEY = 'ba-recent-colours';
const RECENT_MAX = 8;

function readRecent() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list.filter((c) => /^#[0-9a-f]{6}$/i.test(c)) : [];
  } catch (_) {
    return [];
  }
}

function rememberColour(value) {
  const list = [value, ...readRecent().filter((c) => c.toLowerCase() !== value.toLowerCase())].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch (_) {
    /* ไม่มีที่เก็บ ก็แค่ไม่จำ */
  }
}

/** ใช้สีกับรูปที่เลือกและรูปใหม่ แล้วจำไว้ในรายการใช้ล่าสุด */
function useColour(value) {
  const colour = value.toUpperCase();
  annotator.setColor(colour);
  rememberColour(colour);
  markColor(colour);
}

// ---------- ดูดสีจากภาพ ----------

let pickCanvas = null;

async function pickSource() {
  if (pickCanvas) return pickCanvas;
  const bitmap = await createImageBitmap(parts[0].blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d', { willReadFrequently: true }).drawImage(bitmap, 0, 0);
  bitmap.close();
  pickCanvas = canvas;
  return canvas;
}

function toHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

async function startColourPick() {
  if (!annotator || document.body.classList.contains('picking')) return;
  const canvas = await pickSource();
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const stage = parts[0].stage;
  const loupe = document.createElement('div');
  loupe.className = 'pick-loupe';
  loupe.innerHTML = '<span class="pick-chip"></span><span class="pick-hex"></span>';
  loupe.hidden = true;
  document.body.append(loupe);
  document.body.classList.add('picking');
  toast(t('pickHint'), { ms: 4000 });

  const colourAt = (e) => {
    const rect = stage.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    return toHex(r, g, b);
  };
  const onMove = (e) => {
    const hex = colourAt(e);
    loupe.hidden = !hex;
    if (!hex) return;
    loupe.style.left = `${e.clientX + 16}px`;
    loupe.style.top = `${e.clientY + 16}px`;
    loupe.querySelector('.pick-chip').style.background = hex;
    loupe.querySelector('.pick-hex').textContent = hex;
  };
  const finish = () => {
    document.body.classList.remove('picking');
    loupe.remove();
    document.removeEventListener('pointermove', onMove, true);
    document.removeEventListener('pointerdown', onDown, true);
    document.removeEventListener('keydown', onKey, true);
  };
  // จับเหตุการณ์ก่อนเครื่องมือโน้ต คลิกตอนดูดสีจะไม่วาดหรือเลือกรูป
  const onDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const hex = stage.contains(e.target) ? colourAt(e) : null;
    finish();
    if (hex) useColour(hex);
  };
  const onKey = (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    finish();
  };
  document.addEventListener('pointermove', onMove, true);
  document.addEventListener('pointerdown', onDown, true);
  document.addEventListener('keydown', onKey, true);
}

function colourChip(value, nameKey) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'swatch';
  b.style.setProperty('--c', value);
  b.dataset.color = value;
  b.setAttribute('role', 'option');
  b.setAttribute('aria-label', nameKey ? t(nameKey) : value);
  b.innerHTML = '<span></span>';
  setTip(b, nameKey ? t(nameKey) : value);
  return b;
}

function renderSwatches() {
  const wrap = els.colors;
  wrap.replaceChildren();

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dd-btn colour-btn';
  btn.setAttribute('aria-label', t('colour'));
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="colour-now"></span><span class="dd-caret" aria-hidden="true"></span>';
  btn.disabled = !annotator;

  const menu = document.createElement('div');
  menu.className = 'dd-menu colour-menu';
  menu.hidden = true;

  const presets = document.createElement('div');
  presets.className = 'colour-grid';
  presets.setAttribute('role', 'listbox');
  presets.append(...COLORS.map((c) => colourChip(c.value, c.name)));

  const recentTitle = document.createElement('p');
  recentTitle.className = 'colour-title';
  recentTitle.textContent = t('recentColours');
  const recent = document.createElement('div');
  recent.className = 'colour-grid';
  recent.setAttribute('role', 'listbox');

  const tools = document.createElement('div');
  tools.className = 'colour-tools';
  const pick = document.createElement('button');
  pick.type = 'button';
  pick.className = 'colour-action';
  pick.innerHTML = `${icon('eyedropper')}<span>${t('pickColour')}</span>`;
  pick.hidden = !annotator;
  const custom = document.createElement('label');
  custom.className = 'colour-action';
  custom.innerHTML = `${icon('palette')}<span>${t('customColour')}</span>`;
  const input = document.createElement('input');
  input.type = 'color';
  input.className = 'colour-input';
  custom.append(input);
  tools.append(pick, custom);

  menu.append(presets, recentTitle, recent, tools);
  wrap.append(btn, menu);

  const renderRecent = () => {
    const list = readRecent();
    recent.replaceChildren(...list.map((c) => colourChip(c)));
    recentTitle.hidden = recent.hidden = !list.length;
  };
  const open = (show) => {
    if (show) document.dispatchEvent(new Event('closemenus')); // เปิดอันนี้ = ปิดเมนูอื่นทั้งหมดก่อน
    if (show) {
      renderRecent();
      input.value = (annotator?.color || '#E5484D').toLowerCase();
      markColor(annotator?.color);
    }
    menu.hidden = !show;
    btn.setAttribute('aria-expanded', String(show));
    btn.setAttribute('aria-pressed', String(show));
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    open(menu.hidden);
  });
  menu.addEventListener('click', (e) => {
    const chip = e.target.closest('.swatch');
    if (!chip) return;
    useColour(chip.dataset.color);
    open(false);
  });
  // ดูดสีจากภาพที่แคป (ทำเอง ไม่ใช้ EyeDropper ของ Chrome ซึ่งค้างได้บน macOS)
  pick.addEventListener('click', (e) => {
    e.stopPropagation();
    open(false);
    startColourPick();
  });
  input.addEventListener('change', () => {
    useColour(input.value);
    open(false);
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !wrap.contains(e.target)) open(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      open(false);
      btn.focus();
    }
  });
  document.addEventListener('closemenus', () => open(false));
  wrap.dropdownOpen = open;
  markColor(annotator?.color || COLORS[0].value);
}


// ---------- ครอป ----------

let cropper = null;
let zoomBeforeCrop = 'fit';

function startCrop() {
  if (!annotator || cropper || parts.length !== 1) return;
  // เลือกภาพแปะอยู่: ครอปเฉพาะภาพนั้น
  const chosen = annotator.selected();
  if (chosen?.type === 'image') {
    annotator.startImageCrop(chosen.id);
    return;
  }
  annotator.commitEditor?.();
  annotator.select(null);
  document.dispatchEvent(new Event('closemenus'));
  zoomBeforeCrop = zoom;
  document.scrollingElement.scrollTop = 0;
  els.toolbar.classList.add('cropping');
  els.cropMode.hidden = false;
  els.cropBar.hidden = false;
  document.body.classList.add('cropping');
  zoom = 'contain';
  applyZoom();
  els.cropRestore.hidden = !record.original;
  const part = parts[0];
  cropper = new Cropper({
    stage: part.stage,
    width: part.width,
    height: part.height,
    onChange: (r) => {
      els.cropSize.textContent = `${r.w.toLocaleString()} × ${r.h.toLocaleString()} px`;
    },
  });
  alignCropFooter();
}

const CROP_FOOTER_MIN = 560; // ความกว้างขั้นต่ำให้ปุ่มในแถบล่างพอดี

/**
 * แถบล่างกว้างเท่ารูปและอยู่ตรงกับรูป (รูปแคบเกินจะกว้างขั้นต่ำและอยู่กึ่งกลางรูป, รูปกว้างกว่าจอจะเต็มจอ)
 * ใช้กับแถบครอป (แถบซูมปกติอยู่กลางจอคงที่ จัดด้วย CSS)
 */
function alignFooter(footer) {
  if (!parts.length || footer.hidden) return;
  const r = parts[0].stage.getBoundingClientRect();
  const width = Math.min(Math.max(r.width, CROP_FOOTER_MIN), innerWidth);
  const left = Math.min(Math.max(r.left + r.width / 2 - width / 2, 0), innerWidth - width);
  footer.style.left = `${Math.round(left)}px`;
  footer.style.width = `${Math.round(width)}px`;
}

function alignCropFooter() {
  if (cropper) alignFooter(els.cropBar);
}

function endCrop() {
  if (!cropper) return;
  cropper.destroy();
  cropper = null;
  els.toolbar.classList.remove('cropping');
  els.cropMode.hidden = true;
  els.cropBar.hidden = true;
  document.body.classList.remove('cropping');
  zoom = zoomBeforeCrop;
  applyZoom();
}

/** บันทึกภาพใหม่ลงฐานข้อมูลแล้วโหลดหน้าใหม่ (ให้ภาพ โน้ต และขนาดทุกอย่างคำนวณใหม่จากข้อมูลล่าสุด) */
async function saveImage(segments, annotations, extra) {
  const next = { ...record, segments, crop: null, annotations, ...extra };
  try {
    Object.assign(next, await makeThumb(next));
  } catch (_) {
    /* ภาพย่อไม่สำคัญ */
  }
  await patchCapture(record.id, {
    segments: next.segments,
    crop: null,
    annotations: next.annotations,
    original: next.original,
    cropOffset: next.cropOffset,
    undoCrop: next.undoCrop,
    thumb: next.thumb,
    width: next.width,
    height: next.height,
  });
}

/** ย้อนการครอปครั้งล่าสุด (⌘Z หลังจากโน้ตที่แก้หลังครอปถูกย้อนหมดแล้ว) */
async function undoCrop() {
  const prev = record.undoCrop;
  if (!prev) return false;
  await patchCapture(record.id, { ...prev, undoCrop: undefined });
  sessionStorage.setItem('ba-toast', t('cropUndone'));
  location.reload();
  return true;
}

/** เลิกทำ: โน้ตก่อน ถ้าหมดแล้วค่อยย้อนการครอป */
function undoStep() {
  if (annotator?.canUndo()) annotator.undo();
  else if (record?.undoCrop) undoCrop();
}

async function applyCrop() {
  if (!cropper) return;
  if (cropper.isFull()) {
    endCrop();
    return;
  }
  const rect = cropper.result();
  els.cropApply.disabled = true;
  try {
    const blob = await cropBlob(parts[0].blob, rect);
    // เก็บภาพต้นฉบับไว้ครั้งแรกที่ครอป เพื่อคืนได้ภายหลัง
    const original = record.original || { segments: record.segments, crop: record.crop };
    const offset = record.cropOffset || { x: 0, y: 0 };
    // เก็บสภาพก่อนครอปไว้ ให้กด ⌘Z ย้อนได้
    const undoState = {
      segments: record.segments,
      crop: record.crop,
      annotations: annotator.items,
      original: record.original,
      cropOffset: record.cropOffset,
      thumb: record.thumb,
      width: record.width,
      height: record.height,
    };
    await saveImage([blob], shiftAnnotations(annotator.items, -rect.x, -rect.y, rect), {
      original,
      cropOffset: { x: offset.x + rect.x, y: offset.y + rect.y },
      undoCrop: undoState,
    });
    sessionStorage.setItem('ba-toast', t('cropDone', { w: rect.w.toLocaleString(), h: rect.h.toLocaleString(), mod: modKey() }));
    location.reload();
  } catch (err) {
    els.cropApply.disabled = false;
    toast(err.message, { error: true });
  }
}

async function restoreOriginal() {
  if (!record.original) return;
  const offset = record.cropOffset || { x: 0, y: 0 };
  const annotations = shiftAnnotations(annotator?.items || record.annotations || [], offset.x, offset.y);
  const next = { ...record, segments: record.original.segments, crop: record.original.crop, annotations };
  try {
    Object.assign(next, await makeThumb(next));
  } catch (_) {
    /* ภาพย่อไม่สำคัญ */
  }
  await patchCapture(record.id, {
    segments: next.segments,
    crop: next.crop,
    annotations,
    original: undefined,
    cropOffset: undefined,
    undoCrop: undefined,
    thumb: next.thumb,
    width: next.width,
    height: next.height,
  });
  sessionStorage.setItem('ba-toast', t('cropRestored'));
  location.reload();
}

// ---------- เมนูคลิกขวาบนโน้ต ----------

let contextMenu = null;

function closeContextMenu() {
  contextMenu?.remove();
  contextMenu = null;
}

function contextItem(iconName, label, onClick, className = '', { key = '', disabled = false } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `ctx-item ${className}`.trim();
  b.setAttribute('role', 'menuitem');
  b.disabled = disabled;
  b.innerHTML = `${icon(iconName)}<span>${label}</span>${key ? `<kbd>${key}</kbd>` : ''}`;
  b.addEventListener('click', () => {
    closeContextMenu();
    onClick();
  });
  return b;
}

function openContextMenu(x, y) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.setAttribute('role', 'menu');

  // สี: กดแล้วเปลี่ยนทุกรูปที่เลือก
  const colours = document.createElement('div');
  colours.className = 'ctx-colours';
  for (const c of COLORS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'ctx-chip';
    chip.style.setProperty('--c', c.value);
    chip.title = t(c.name);
    chip.setAttribute('aria-label', t(c.name));
    chip.addEventListener('click', () => {
      closeContextMenu();
      useColour(c.value);
    });
    colours.append(chip);
  }

  const sep = () => Object.assign(document.createElement('span'), { className: 'ctx-sep' });
  menu.append(
    colours,
    sep(),
    contextItem('toFront', t('bringFront'), () => annotator.arrange('front')),
    contextItem('forward', t('bringForward'), () => annotator.arrange('forward')),
    contextItem('backward', t('sendBackward'), () => annotator.arrange('backward')),
    contextItem('toBack', t('sendBack'), () => annotator.arrange('back')),
    sep(),
    ...(annotator.selected()?.type === 'image' ? [contextItem('crop', t('cropImage'), () => annotator.startImageCrop(annotator.selected().id))] : []),
    contextItem('duplicate', t('duplicate'), () => annotator.duplicateSelected()),
    contextItem('trash', t('delete'), () => annotator.deleteSelected(), 'danger'),
  );
  placeMenu(menu, x, y);
}

/** เมนูคลิกขวาบนที่ว่างของภาพ: คำสั่งทั้งภาพ */
function openCanvasMenu(x, y) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.setAttribute('role', 'menu');
  const sep = () => Object.assign(document.createElement('span'), { className: 'ctx-sep' });
  const empty = !annotator.items.length;
  menu.append(
    contextItem('paste', t('pasteImage'), pasteFromClipboard, '', { key: shortcutLabel('V') }),
    contextItem('all', t('selectAllNotes'), () => {
      setTool('select');
      annotator.selectAll();
    }, '', { key: shortcutLabel('A'), disabled: empty }),
    sep(),
    contextItem('undo', t('undo'), undoStep, '', { key: shortcutLabel('Z'), disabled: els.undo.disabled }),
    contextItem('redo', t('redo'), () => annotator.redo(), '', { key: shortcutLabel('Z', { shift: true }), disabled: !annotator.canRedo() }),
    sep(),
    contextItem('crop', t('crop'), startCrop, '', { key: 'X' }),
    contextItem('copy', t('copy'), copy, '', { key: 'C', disabled: els.copy.disabled }),
    contextItem('download', t('downloadPng'), () => download(), '', { key: 'D' }),
    sep(),
    contextItem('eraser', t('clearNotes'), () => {
      annotator.clear();
      toast(t('notesCleared', { mod: modKey() }));
    }, 'danger', { disabled: empty }),
  );
  placeMenu(menu, x, y);
}

/** อ่านภาพจากคลิปบอร์ด (browser อาจถามสิทธิ์ก่อน ถ้าไม่ได้ให้ใช้ ⌘V แทน) */
async function pasteFromClipboard() {
  try {
    for (const item of await navigator.clipboard.read()) {
      const type = item.types.find((ty) => ty.startsWith('image/'));
      if (type) {
        await pasteBlob(await item.getType(type), lastMenuPoint);
        return;
      }
    }
    toast(t('pasteNoImage', { mod: modKey() }));
  } catch (_) {
    toast(t('pasteNoImage', { mod: modKey() }));
  }
}

let lastMenuPoint = null;

function placeMenu(menu, x, y) {
  document.body.append(menu);
  // ไม่ให้ล้นขอบจอ
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(x, innerWidth - rect.width - 8))}px`;
  menu.style.top = `${Math.max(8, Math.min(y, innerHeight - rect.height - 8))}px`;
  contextMenu = menu;
}

let contextMenuWired = false;

function setupContextMenu(stage) {
  stage.addEventListener('contextmenu', (e) => {
    if (!annotator || cropper) return;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const id =
      under?.closest?.('[data-id]')?.dataset.id ||
      under?.closest?.('[data-grip]')?.dataset.grip ||
      (under?.closest?.('[data-handle]') && annotator.selected()?.id);
    const item = id && annotator.items.find((it) => it.id === id);
    e.preventDefault();
    lastMenuPoint = annotator.toImage(e); // วางภาพจากเมนูตรงจุดที่คลิกขวา
    if (!item) {
      // ที่ว่างบนภาพ: เมนูคำสั่งทั้งภาพ
      annotator.select(null);
      document.dispatchEvent(new Event('closemenus'));
      openCanvasMenu(e.clientX, e.clientY);
      return;
    }
    if (!annotator.isSelected(item)) annotator.select(item.id);
    document.dispatchEvent(new Event('closemenus'));
    openContextMenu(e.clientX, e.clientY);
  });
  if (contextMenuWired) return;
  contextMenuWired = true;
  document.addEventListener('pointerdown', (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) closeContextMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contextMenu) {
      e.stopPropagation();
      closeContextMenu();
    }
  }, true);
  window.addEventListener('scroll', closeContextMenu, true);
  window.addEventListener('resize', closeContextMenu);
  document.addEventListener('closemenus', closeContextMenu);
}

// ---------- tooltip ----------

function renderStaticTips() {
  setTip(els.undo, t('undo'), shortcutLabel('Z'));
  setTip(els.redo, t('redo'), shortcutLabel('Z', { shift: true }));
  setTip(els.clear, t('clearNotes'));
  setTip(els.cropCancel, t('cancel'), 'Esc');
  setTip(els.cropApply, t('cropApply'), '↵');
  if (!els.copy.title) setTip(els.copy, t('copy'), 'C');
  setTip(els.download, t('downloadPng'), 'D');
  setTip(els.libraryBtn, t('otherCaptures'));
  setTip(els.styleMore, t('styleOptions'));
  if (!els.deleteBtn.classList.contains('confirm')) setTip(els.deleteBtn, t('deleteThis'));
  setTip(els.zoomOut, t('zoomOut'), '−');
  setTip(els.zoomIn, t('zoomIn'), '+');
  setTip(document.getElementById('settings-btn'), t('settings'));
  setTip(document.querySelector('.bar .back'), t('allCaptures'));
}

// ---------- แปะภาพ (รูปอื่นที่แคปไว้ / ไฟล์ภาพ / คลิปบอร์ด) ----------

const CAPTURE_MIME = 'application/x-crabcap-capture';
let libraryUrls = [];

async function toggleLibrary(show = els.library.hidden) {
  els.library.hidden = !show;
  els.libraryBtn.setAttribute('aria-pressed', String(show));
  document.body.classList.toggle('library-open', show);
  applyZoom(); // พื้นที่ภาพแคบลง/กว้างขึ้น
  if (show) await renderLibrary();
}

async function renderLibrary() {
  const list = await listCaptures(60);
  libraryUrls.forEach((url) => URL.revokeObjectURL(url));
  libraryUrls = [];
  els.libraryList.replaceChildren(...list.map(libraryItem));
  els.libraryList.querySelector('.library-item.current')?.scrollIntoView({ block: 'nearest' });
}

/** favicon ของเว็บจาก cache ของ Chrome (สิทธิ์ favicon) โหลดไม่ได้ก็ซ่อนไป */
function favicon(url) {
  if (!chrome.runtime?.id || !/^https?:/.test(url || '')) return null;
  const img = document.createElement('img');
  img.className = 'library-fav';
  img.alt = '';
  img.width = 12;
  img.height = 12;
  img.src = chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(url)}&size=64`);
  img.addEventListener('error', () => img.remove());
  return img;
}

function libraryItem(rec) {
  const current = rec.id === record.id;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = current ? 'library-item current' : 'library-item';
  b.dataset.id = rec.id;
  b.draggable = !current;
  if (current) {
    b.disabled = true;
    b.setAttribute('aria-current', 'true');
  }
  const thumb = document.createElement('span');
  thumb.className = 'library-thumb';
  if (rec.thumb) {
    const img = document.createElement('img');
    const url = URL.createObjectURL(rec.thumb);
    libraryUrls.push(url);
    img.src = url;
    img.alt = '';
    img.draggable = false;
    thumb.append(img);
  }
  const title = document.createElement('span');
  title.className = 'library-title';
  title.textContent = rec.title || hostOf(rec.url) || t('untitled');
  // favicon ของเว็บอยู่หน้าชื่อ
  const name = document.createElement('span');
  name.className = 'library-name';
  const fav = favicon(rec.url);
  if (fav) name.append(fav);
  name.append(title);
  b.title = current ? title.textContent : `${title.textContent}\n${t('libraryHint')}`;
  if (current) {
    const badge = document.createElement('span');
    badge.className = 'library-badge';
    badge.textContent = t('editingNow');
    thumb.append(badge);
  }
  b.append(thumb, name);
  b.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData(CAPTURE_MIME, rec.id);
    e.dataTransfer.effectAllowed = 'copy';
    const img = thumb.querySelector('img');
    if (img) e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
  });
  b.addEventListener('click', () => switchCapture(rec.id));
  return b;
}

// ---------- ลบรูปนี้ ----------

function setupDeleteCapture() {
  const btn = els.deleteBtn;
  const CONFIRM_SECONDS = 5;
  let timer;
  const idle = () => {
    clearInterval(timer);
    btn.classList.remove('confirm');
    btn.innerHTML = icon('trash');
    setTip(btn, t('deleteThis'));
  };
  idle();
  btn.addEventListener('click', async () => {
    if (!btn.classList.contains('confirm')) {
      // กดครั้งแรก: ถามยืนยันพร้อมนับถอยหลัง (กดซ้ำก่อนหมดเวลาจึงลบจริง)
      let left = CONFIRM_SECONDS;
      btn.classList.add('confirm');
      btn.querySelector('.tip')?.remove();
      btn.classList.remove('has-tip', 'tip-on');
      const label = () => {
        btn.innerHTML = `${icon('trash')}<span>${t('deleteConfirmIn', { s: left })}</span>`;
      };
      label();
      timer = setInterval(() => {
        left -= 1;
        if (left <= 0) idle();
        else label();
      }, 1000);
      return;
    }
    idle();
    btn.disabled = true;
    try {
      await deleteCurrentCapture();
    } catch (err) {
      toast(err.message, { error: true });
    } finally {
      btn.disabled = false;
    }
  });
}

/** ลบรูปที่เปิดอยู่ แล้วไปรูปถัดไป (ใหม่สุดที่เหลือ) ถ้าไม่เหลือเลยกลับหน้าประวัติ */
async function deleteCurrentCapture() {
  const gone = record.id;
  clearTimeout(saveTimer);
  annotator?.commitEditor();
  await deleteCapture(gone);
  // ไม่ให้บันทึกโน้ตกลับไปที่รูปที่ลบแล้ว
  record = { ...record, id: null };
  const rest = (await listCaptures()).filter((rec) => rec.id !== gone);
  if (!rest.length) {
    sessionStorage.setItem('ba-toast', t('deleted'));
    location.href = 'history.html';
    return;
  }
  history.replaceState(null, '', `#${encodeURIComponent(rest[0].id)}`);
  await switchCapture(rest[0].id, { push: false });
  toast(t('deleted'));
}

let switching = false;

/**
 * สลับไปแก้รูปอื่นโดยไม่โหลดหน้าใหม่ (ไม่กระพริบ)
 * ภาพเดิมยังอยู่แบบจางจนภาพใหม่พร้อม แล้วสลับทีเดียว
 */
async function switchCapture(id, { push = true } = {}) {
  if (!id || id === record?.id || switching) return;
  switching = true;
  if (cropper) endCrop();
  document.dispatchEvent(new Event('closemenus'));
  document.body.classList.add('page-loading', 'switching');
  els.libraryList.querySelectorAll('.library-item').forEach((b) => b.classList.toggle('opening', b.dataset.id === id));
  try {
    // บันทึกโน้ตที่ค้างอยู่ให้เสร็จก่อนเปลี่ยนรูป
    clearTimeout(saveTimer);
    if (annotator && record.id) {
      annotator.commitEditor();
      await patchCapture(record.id, { annotations: annotator.items, assets: annotator.usedAssets() }).catch(() => {});
    }
    const rec = await getCapture(id);
    if (!rec) throw new Error(t('notFound'));
    if (push) history.pushState(null, '', `#${encodeURIComponent(id)}`);
    await showRecord(rec);
    document.scrollingElement.scrollTop = 0;
  } catch (err) {
    document.body.classList.remove('page-loading');
    els.libraryList.querySelectorAll('.opening').forEach((b) => b.classList.remove('opening'));
    toast(t('buildFailed', { msg: err.message }), { error: true });
  } finally {
    switching = false;
    document.body.classList.remove('switching');
  }
}

/** แปะรูปที่แคปไว้ (ใช้ภาพที่ครอปแล้วแต่ไม่รวมโน้ต; ภาพยาวมากใช้ท่อนแรก) */
async function pasteCapture(id, at) {
  try {
    const rec = await getCapture(id);
    if (!rec) throw new Error(t('notFound'));
    const [first] = await buildImages(rec);
    await pasteBlob(first.blob, at);
  } catch (err) {
    toast(t('imagePasteFailed', { msg: err.message }), { error: true });
  }
}

async function pasteBlob(blob, at) {
  if (!annotator || cropper) return;
  try {
    setTool('select');
    await annotator.addImage(blob, at || visibleCentre());
    toast(t('imagePasted'));
  } catch (err) {
    toast(t('imagePasteFailed', { msg: err.message }), { error: true });
  }
}

/** จุดกลางของส่วนภาพที่มองเห็นอยู่บนจอ (พิกัดภาพ) */
function visibleCentre() {
  const box = parts[0].stage.getBoundingClientRect();
  const top = Math.max(box.top, els.toolbar.getBoundingClientRect().bottom);
  const bottom = Math.min(box.bottom, innerHeight);
  const left = Math.max(box.left, els.library.hidden ? 0 : els.library.getBoundingClientRect().right);
  const right = Math.min(box.right, innerWidth);
  return annotator.toImage({ clientX: (left + right) / 2, clientY: (top + bottom) / 2 });
}

/** ลากรูป/ไฟล์ภาพมาวางบนภาพนี้ (ผูกใหม่ทุกครั้งที่สร้าง stage) */
function setupStageDrop(stage) {
  const accepts = (e) => [...e.dataTransfer.types].some((type) => type === CAPTURE_MIME || type === 'Files');
  stage.addEventListener('dragover', (e) => {
    if (cropper || !accepts(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    stage.classList.add('drop-target');
  });
  stage.addEventListener('dragleave', (e) => {
    if (!stage.contains(e.relatedTarget)) stage.classList.remove('drop-target');
  });
  stage.addEventListener('drop', (e) => {
    stage.classList.remove('drop-target');
    if (cropper) return;
    const id = e.dataTransfer.getData(CAPTURE_MIME);
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'));
    if (!id && !file) return;
    e.preventDefault();
    const at = annotator.toImage(e);
    if (id) pasteCapture(id, at);
    else pasteBlob(file, at);
  });
}

// ---------- ขนาดเส้น / การเติมสี ----------

const SIZE_ICON = { s: 1, m: 2.6, l: 4.6 };
const FILL_ICON = {
  none: '<rect x="5" y="5" width="14" height="14" rx="1.5" fill="none"/>',
  tint: '<rect x="5" y="5" width="14" height="14" rx="1.5" fill="currentColor" fill-opacity=".3"/>',
  solid: '<rect x="5" y="5" width="14" height="14" rx="1.5" fill="currentColor"/>',
};

function sizeLine(id, width = 24) {
  return `<svg class="icon line" viewBox="0 0 ${width} 24" aria-hidden="true"><path d="M3 12h${width - 6}" stroke-width="${SIZE_ICON[id]}"/></svg>`;
}

const FONT_SIZE_NAMES = ['fontSmall', 'fontBody', 'fontSubheading', 'fontHeading', 'fontTitle'];

/** ขนาดตัวอักษร: "Aa" ใหญ่ขึ้นตามระดับ (ปุ่มและรายการใช้แบบเดียวกัน) */
function fontSizeLabel(id, width = 24) {
  const level = Math.max(0, FONT_SIZES.indexOf(Number(id)));
  const px = [9, 11.5, 14, 16.5, 19][level];
  return `<svg class="icon line" viewBox="0 0 ${width} 24" aria-hidden="true"><text x="${width / 2}" y="17" text-anchor="middle" font-size="${px}" font-weight="700" fill="currentColor" stroke="none">Aa</text></svg>`;
}

/** ข้อความเก่าอาจได้ขนาดที่ไม่อยู่ในรายการ (เช่น 34): แสดงขนาดที่ใกล้สุด */
function nearestFontSize(v) {
  return FONT_SIZES.reduce((best, s) => (Math.abs(s - v) < Math.abs(best - v) ? s : best), FONT_SIZES[0]);
}

/** ตัวอย่างแบบเส้น (ทึบ / ประ / จุด) */
function dashLine(id, width = 24) {
  const dash = { solid: '', dash: ' stroke-dasharray="5 3.5"', dot: ' stroke-dasharray="0.01 4"' }[id];
  const cap = id === 'dot' ? 'round' : 'butt';
  return `<svg class="icon line" viewBox="0 0 ${width} 24" aria-hidden="true"><path d="M3 12h${width - 6}" stroke-width="2.4" style="stroke-linecap:${cap}"${dash}/></svg>`;
}

/** ไอคอนหัวลูกศร (กว้างตาม width) */
function headLine(id, width = 24) {
  const end = width - 3;
  const tri = (x, dir) => `<path d="M${x} 12l${-6 * dir} -4v8Z" fill="currentColor" stroke-width="1"/>`;
  const shapes = {
    triangle: `<path d="M3 12H${end - 5}"/>${tri(end, 1)}`,
    open: `<path d="M3 12H${end}M${end - 6} 8l6 4-6 4" fill="none"/>`,
    double: `<path d="M8 12H${end - 5}"/>${tri(end, 1)}${tri(3, -1)}`,
    none: `<path d="M3 12H${end}"/>`,
  };
  return `<svg class="icon line" viewBox="0 0 ${width} 24" stroke-width="1.8" aria-hidden="true">${shapes[id]}</svg>`;
}

/** ไอคอนขอบตัวอักษร: ตัว A สีตัวอักษรปัจจุบัน ขอบตามตัวเลือก (อัตโนมัติ = ขอบประ) */
function outlinePreview(id, width = 24) {
  const fill = annotator?.color || '#E5484D';
  const x = width / 2;
  if (id === 'none') {
    return `<svg class="icon line" viewBox="0 0 ${width} 24" aria-hidden="true"><text x="${x}" y="18" text-anchor="middle" font-size="17" font-weight="800" fill="${fill}" stroke="none">A</text></svg>`;
  }
  if (id.startsWith('bg-')) {
    // กล่องพื้นหลังกับตัว A (ใช้กฎสีเดียวกับตอนวาดจริง)
    const bg = annotator?.textBackground({ outline: id, color: fill }) || { fill: '#FFFFFF', ink: fill };
    return `<svg class="icon line" viewBox="0 0 ${width} 24" aria-hidden="true"><rect x="${x - 9}" y="4" width="18" height="17" fill="${bg.fill}" stroke="rgb(0 0 0 / 0.25)" stroke-width="1"/><text x="${x}" y="17.5" text-anchor="middle" font-size="14" font-weight="800" fill="${bg.ink}" stroke="none">A</text></svg>`;
  }
  const stroke = id === 'auto' ? 'currentColor' : id;
  const dash = id === 'auto' ? ' stroke-dasharray="2 1.5"' : '';
  return `<svg class="icon line" viewBox="0 0 ${width} 24" aria-hidden="true"><text x="${x}" y="18" text-anchor="middle" font-size="17" font-weight="800" fill="${fill}" stroke="${stroke}" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"${dash}>A</text></svg>`;
}

/**
 * dropdown ทั่วไป: ปุ่มแสดงค่าปัจจุบัน กดแล้วมีรายการให้เลือก
 * options: [{ id, name }], preview(id, width) คืน svg
 */
function makeDropdown(wrap, { label, options, preview, onPick, icon: buttonIcon = null, action = false }) {
  wrap.replaceChildren();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dd-btn';
  btn.setAttribute('aria-label', t(label));
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.disabled = !annotator;

  const menu = document.createElement('div');
  menu.className = 'dd-menu';
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;
  const open = (show) => {
    if (show) document.dispatchEvent(new Event('closemenus')); // เปิดอันนี้ = ปิดเมนูอื่นทั้งหมดก่อน
    menu.hidden = !show;
    btn.setAttribute('aria-expanded', String(show));
    btn.setAttribute('aria-pressed', String(show));
  };
  for (const option of options) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'dd-item';
    item.dataset.value = option.id;
    item.setAttribute('role', 'option');
    item.innerHTML = `${preview(option.id, 36)}<span>${t(option.name)}</span>`;
    item.addEventListener('click', () => {
      onPick(option.id);
      open(false);
      markStyle();
    });
    menu.append(item);
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    open(menu.hidden);
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !wrap.contains(e.target)) open(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      open(false);
      btn.focus();
    }
  });
  document.addEventListener('closemenus', () => open(false));
  wrap.append(btn, menu);
  wrap.dropdown = { btn, label, options, preview, buttonIcon, action };
}

/** อัปเดตปุ่ม dropdown ให้แสดงค่าปัจจุบัน และเปิด/ปิดตามว่าใช้ได้ไหม */
function syncDropdown(wrap, value, enabled) {
  const { btn, label, options, preview, buttonIcon, action } = wrap.dropdown;
  if (action) {
    // เมนูคำสั่ง: ไม่มีค่าที่เลือกค้าง แค่เปิด/ปิดปุ่ม
    btn.innerHTML = `${buttonIcon}<span class="dd-caret" aria-hidden="true"></span>`;
    setTip(btn, t(label));
    btn.disabled = !enabled;
    return;
  }
  const current = options.find((o) => o.id === value) || options[0];
  // ปุ่มแสดงไอคอนประจำ (ถ้ามี) ไม่งั้นแสดงตัวอย่างของค่าปัจจุบัน
  const face = buttonIcon || preview(current.id);
  btn.innerHTML = `${face}<span class="dd-caret" aria-hidden="true"></span>`;
  setTip(btn, `${t(label)}: ${t(current.name)}`);
  btn.disabled = !enabled;
  for (const item of wrap.querySelectorAll('.dd-item')) item.setAttribute('aria-selected', String(item.dataset.value === current.id));
}

function renderStyleButtons() {
  makeDropdown(els.sizes, {
    label: 'strokeSize',
    options: SIZES,
    preview: sizeLine,
    onPick: (id) => annotator.setSize(id),
    // ไอคอนความหนาเส้น: สามเส้นจากบางไปหนา
    icon: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16" stroke-width="1.1"/><path d="M4 12h16" stroke-width="2.2"/><path d="M4 18.5h16" stroke-width="3.6"/></svg>',
  });
  makeDropdown(els.fontsizes, {
    label: 'fontSize',
    options: FONT_SIZES.map((v, i) => ({ id: String(v), name: FONT_SIZE_NAMES[i] })),
    preview: fontSizeLabel,
    onPick: (id) => annotator.setFontSize(Number(id)),
  });
  makeDropdown(els.dashes, { label: 'lineStyle', options: DASHES, preview: dashLine, onPick: (id) => annotator.setDash(id) });
  makeDropdown(els.heads, { label: 'arrowHead', options: HEADS, preview: headLine, onPick: (id) => annotator.setHead(id) });
  makeDropdown(els.arrange, {
    label: 'arrange',
    options: [
      { id: 'front', name: 'bringFront' },
      { id: 'forward', name: 'bringForward' },
      { id: 'backward', name: 'sendBackward' },
      { id: 'back', name: 'sendBack' },
    ],
    preview: (id) => icon({ front: 'toFront', forward: 'forward', backward: 'backward', back: 'toBack' }[id]),
    onPick: (id) => annotator.arrange(id),
    icon: icon('layers'),
    action: true,
  });
  makeDropdown(els.outlines, {
    label: 'textOutline',
    options: OUTLINES,
    preview: outlinePreview,
    onPick: (id) => annotator.setOutline(id),
  });
  makeDropdown(els.borders, {
    label: 'imageBorder',
    options: BORDERS,
    preview: (id) =>
      `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${
        id === 'none'
          ? '<rect x="5" y="5" width="14" height="14" stroke-dasharray="2 2.5" opacity=".5"/>'
          : '<rect x="5" y="5" width="14" height="14" stroke-width="2.4"/>'
      }</svg>`,
    onPick: (id) => annotator.setBorder(id),
  });
  makeDropdown(els.fills, {
    label: 'fillStyle',
    options: FILLS,
    preview: (id) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${FILL_ICON[id]}</svg>`,
    onPick: (id) => annotator.setFill(id),
  });
  markStyle();
}

/** ไฮไลต์ตามค่าปัจจุบัน และปิดตัวเลือกที่ใช้กับเครื่องมือ/รูปที่เลือกไม่ได้ */
function markStyle() {
  if (!annotator) return;
  // ถ้ามีรูปที่เลือก ใช้ชนิดของรูปเหล่านั้น ไม่งั้นใช้เครื่องมือที่ถืออยู่
  const items = annotator.selectedItems();
  const types = items.length ? items.map((it) => it.type) : activeTool === 'select' ? [] : [activeTool];
  const any = (list) => types.some((type) => list.includes(type));
  syncDropdown(els.sizes, annotator.size, !types.length || any(SIZED_TYPES));
  syncDropdown(els.heads, annotator.head, any(HEAD_TYPES));
  syncDropdown(els.dashes, annotator.dash, any(DASH_TYPES));
  syncDropdown(els.fontsizes, String(nearestFontSize(annotator.fontSize)), any(FONT_TYPES));
  // ปุ่มเครื่องมือรูปทรงแสดงรูปทรงที่เลือกอยู่
  const shapeTool = els.tools.querySelector('[data-tool="rect"]');
  if (shapeTool && shapeTool.dataset.shape !== annotator.shape) {
    shapeTool.dataset.shape = annotator.shape;
    shapeTool.querySelector('svg.icon')?.replaceWith(document.createRange().createContextualFragment(icon(annotator.shape)));
  }
  syncDropdown(els.outlines, annotator.outline, any(OUTLINE_TYPES));
  syncDropdown(els.arrange, null, items.length > 0);
  syncDropdown(els.fills, annotator.fill, any(FILLED_TYPES));
  syncDropdown(els.borders, annotator.border, any(BORDER_TYPES));
}

function markColor(value) {
  if (!value) return;
  const now = els.colors.querySelector('.colour-now');
  if (now) now.style.background = value;
  const btn = els.colors.querySelector('.colour-btn');
  if (btn) {
    const preset = COLORS.find((c) => c.value.toLowerCase() === value.toLowerCase());
    setTip(btn, `${t('colour')}: ${preset ? t(preset.name) : value.toUpperCase()}`);
  }
  for (const b of els.colors.querySelectorAll('.swatch')) {
    b.setAttribute('aria-selected', String(b.dataset.color.toLowerCase() === value.toLowerCase()));
  }
  if (annotator) annotator.color = value;
  if (els.outlines.dropdown) markStyle();
}

let activeTool = 'select';

function setTool(id) {
  if (!annotator) return;
  annotator.setTool(id);
  showGroupTool(id);
  for (const b of els.tools.querySelectorAll('.tool')) b.setAttribute('aria-pressed', String(b.dataset.tool === id));
  activeTool = id;
  markStyle();
}

function updateHistoryButtons() {
  els.undo.disabled = !annotator.canUndo() && !record?.undoCrop;
  els.redo.disabled = !annotator.canRedo();
  els.clear.disabled = !annotator.items.length;
}

let saveTimer;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    patchCapture(record.id, { annotations: record.annotations, assets: annotator.usedAssets() }).catch((err) =>
      toast(t('saveNotesFailed', { msg: err.message }), { error: true }),
    );
  }, 400);
}
window.addEventListener('pagehide', () => {
  if (record?.id && annotator) patchCapture(record.id, { annotations: record.annotations || [], assets: annotator.usedAssets() });
});

// ---------- ส่งออก ----------

/** ภาพที่จะส่งออก: ถ้ามีโน้ตให้รวมโน้ตเข้าไปในภาพ */
async function outputBlobs() {
  if (annotator && annotator.items.length) return [await annotator.exportBlob()];
  return parts.map((p) => p.blob);
}

/** ภาพต้นฉบับตามที่แคปมา (ก่อนครอปในหน้านี้ และไม่มีโน้ต) */
async function originalBlobs() {
  if (!record.original) return parts.map((p) => p.blob);
  const original = await buildImages({ ...record, segments: record.original.segments, crop: record.original.crop });
  return original.map((p) => p.blob);
}

// ---------- เปลี่ยนชื่อรูป ----------
// record.title = ชื่อที่แสดง, record.pageTitle = ชื่อแท็บเดิมตอนแคป (เก็บไว้ตอนเปลี่ยนชื่อครั้งแรก), record.renamed = ตั้งชื่อเองแล้ว

function showTitle() {
  els.title.textContent = record.title || t('untitled');
  els.title.title = `${record.title || ''}\n${t('renameHint')}`.trim();
  document.title = `${record.title || hostOf(record.url)} · CrabCap`;
}

function setupRename() {
  els.title.tabIndex = 0;
  els.title.setAttribute('role', 'button');
  els.title.setAttribute('aria-label', t('rename'));
  els.title.classList.add('renamable');
  const start = () => {
    if (els.title.isContentEditable) return;
    els.title.textContent = record.title || '';
    els.title.contentEditable = 'plaintext-only';
    els.title.focus();
    getSelection().selectAllChildren(els.title);
  };
  const finish = async (save) => {
    if (!els.title.isContentEditable) return;
    els.title.contentEditable = 'false';
    els.title.blur(); // คลิกบนภาพไม่ย้าย focus ไปไหน ต้องปล่อยเอง ไม่งั้นกรอบ focus ค้าง
    if (save) {
      try {
        const { changed, adjusted } = await renameCapture(record, els.title.textContent);
        if (adjusted) toast(t('renameDuplicate', { name: adjusted }));
        if (changed && !els.library.hidden) renderLibrary();
      } catch (err) {
        toast(t('renameFailed', { msg: err.message }), { error: true });
      }
    }
    showTitle();
  };
  els.title.addEventListener('click', start);
  els.title.addEventListener('keydown', (e) => {
    e.stopPropagation(); // ไม่ให้ไปเรียกคีย์ลัดเครื่องมือ
    if (!els.title.isContentEditable) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        start();
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      finish(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      finish(false);
    }
  });
  els.title.addEventListener('blur', () => finish(true));
  // คลิกบนภาพ/แถบเครื่องมือ: ตัวจัดการ pointer ของส่วนนั้นกัน focus ไว้ (preventDefault) จึงไม่เกิด blur
  // ดักตั้งแต่ capture phase แล้วจบการเปลี่ยนชื่อเอง
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (els.title.isContentEditable && !els.title.contains(e.target)) finish(true);
    },
    true,
  );
}

function fileName(index, count, tag = '') {
  const suffix = count > 1 ? `_part${index + 1}` : '';
  return `${captureFileName(record, `${tag}${suffix}`)}.png`;
}

/** kind: 'edited' = รวมครอปและโน้ต (ค่าเริ่มต้น), 'original' = ภาพที่แคปมา */
async function download(kind = 'edited') {
  if (els.download.disabled) return;
  try {
    const original = kind === 'original';
    const blobs = original ? await originalBlobs() : await outputBlobs();
    blobs.forEach((b, i) => downloadBlob(b, fileName(i, blobs.length, original ? '_original' : '')));
    toast(blobs.length > 1 ? t('downloadedFiles', { n: blobs.length }) : t('downloaded'));
  } catch (err) {
    toast(t('downloadFailed', { msg: err.message }), { error: true });
  }
}

async function copy() {
  if (parts.length !== 1) return;
  try {
    // ส่ง Promise ให้ ClipboardItem เพื่อให้ยังนับเป็น user gesture ระหว่างรอสร้างภาพ
    const blob = outputBlobs().then((b) => b[0]);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast(t('copied'));
  } catch (err) {
    toast(t('copyFailed', { msg: err.message }), { error: true });
  }
}

function showEmpty(message, withLink = false) {
  document.body.classList.remove('page-loading');
  els.title.textContent = 'CrabCap';
  els.canvas.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'empty';
  p.textContent = message;
  if (withLink) {
    p.append(document.createElement('br'));
    const a = document.createElement('a');
    a.href = 'history.html';
    a.textContent = t('seeAllCaptures');
    p.append(a);
  }
  els.canvas.append(p);
}


els.download.addEventListener('click', () => download('edited'));

// เมนูเลือกแบบดาวน์โหลด (ลูกศรด้านหลังปุ่ม)
function openDownloadMenu(show) {
  if (show) document.dispatchEvent(new Event('closemenus')); // เปิดอันนี้ = ปิดเมนูอื่นทั้งหมดก่อน
  els.downloadMenu.hidden = !show;
  els.downloadMore.setAttribute('aria-expanded', String(show));
}
els.downloadMore.addEventListener('click', (e) => {
  e.stopPropagation();
  openDownloadMenu(els.downloadMenu.hidden);
});
els.downloadMenu.addEventListener('click', (e) => {
  const item = e.target.closest('[data-kind]');
  if (!item) return;
  openDownloadMenu(false);
  download(item.dataset.kind);
});
document.addEventListener('click', (e) => {
  if (!els.downloadMenu.hidden && !e.target.closest('#download-split')) openDownloadMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.downloadMenu.hidden) openDownloadMenu(false);
});
document.addEventListener('closemenus', () => openDownloadMenu(false));
els.copy.addEventListener('click', copy);

// ---------- คีย์ลัด ----------
document.addEventListener('keydown', (e) => {
  if (!parts.length) return;
  const target = e.target;
  if (target instanceof HTMLInputElement || target?.isContentEditable) return;
  const mod = e.metaKey || e.ctrlKey;
  // ใช้ตำแหน่งปุ่ม ไม่ใช่ตัวอักษร คีย์ลัดจึงใช้ได้ทุกภาษาของแป้นพิมพ์
  const key = shortcutKey(e);
  if (cropper) {
    if (key === 'enter') {
      e.preventDefault();
      applyCrop();
    } else if (key === 'escape') {
      e.preventDefault();
      endCrop();
    }
    return;
  }
  // กดคีย์ลัด (ไม่ใช่ Tab/Enter/Space ที่ใช้กับปุ่ม) ขณะปุ่มในแถบเครื่องมือยังถือ focus อยู่: ปล่อย focus ไม่ให้ tooltip ค้าง
  const navKeys = ['tab', 'enter', ' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'];
  // กดคีย์ลัดขณะ dropdown/แผงตั้งค่าเปิดอยู่: ปิดทั้งหมดก่อน แล้วค่อยทำงานของคีย์ลัด
  const modifierOnly = ['shift', 'control', 'alt', 'meta'].includes(key);
  if (!navKeys.includes(key) && !modifierOnly && key !== 'escape') document.dispatchEvent(new Event('closemenus'));
  if (!navKeys.includes(key) && document.activeElement?.closest?.('.toolbar')) document.activeElement.blur();

  if (mod && key === 'z' && annotator) {
    e.preventDefault();
    if (e.shiftKey) annotator.redo();
    else undoStep();
    return;
  }
  if (mod && key === 'y' && annotator) {
    e.preventDefault();
    annotator.redo();
    return;
  }
  if (mod && key === 'c' && annotator?.items.length && !window.getSelection()?.toString()) {
    e.preventDefault();
    copy();
    return;
  }
  if (mod && (key === '[' || key === ']') && annotator) {
    e.preventDefault();
    const forward = key === ']';
    if (e.shiftKey) annotator.arrange(forward ? 'front' : 'back');
    else annotator.arrange(forward ? 'forward' : 'backward');
    return;
  }
  if (mod && key === 'a' && annotator?.items.length) {
    e.preventDefault();
    setTool('select');
    annotator.selectAll();
    return;
  }
  if (mod && key === 's') {
    e.preventDefault();
    download();
    return;
  }
  if (mod || e.altKey) return;

  if (/^[0-9]$/.test(key) && annotator?.typeOnStep(key)) {
    e.preventDefault();
    return;
  }

  if (key === 'enter' && annotator?.cropId && !document.activeElement?.closest?.('button, input, textarea')) {
    e.preventDefault();
    annotator.endImageCrop();
  } else if (key === 'x' && annotator) startCrop();
  else if (key === 'd') download();
  else if (key === 'c') copy();
  else if (key === '=' || e.key === '+') stepZoom(1);
  else if (key === '-') stepZoom(-1);
  else if (key === '0') cycleZoom();
  else if ((key === 'delete' || key === 'backspace') && annotator?.deleteSelected()) e.preventDefault();
  else if (key === 'escape' && annotator) {
    setTool('select');
    annotator.select(null);
  }
  else if (annotator) {
    const tool = TOOLS.find((item) => item.key.toLowerCase() === key);
    if (tool) setTool(tool.id);
  }
});
