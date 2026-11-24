// เครื่องมือใส่โน้ตบนภาพ: กรอบ, ลูกศร, เลขลำดับ, ข้อความ, เบลอ (pixelate)
// แสดงผลด้วย SVG ที่วางทับภาพ (พิกัดเป็น pixel ของภาพจริง) และใช้ geometry ชุดเดียวกันวาดลง canvas ตอนส่งออก
// โน้ตเก็บเป็นข้อมูล ไม่แก้ภาพต้นฉบับ จึงแก้ไข/ลบได้ตลอด

import { t } from './i18n.js';

// name / label เป็น key ของ i18n
export const COLORS = [
  { value: '#E5484D', name: 'colourRed' },
  { value: '#FF7A3D', name: 'colourOrange' },
  { value: '#F2C230', name: 'colourYellow' },
  { value: '#1F9D55', name: 'colourGreen' },
  { value: '#2F80ED', name: 'colourBlue' },
  { value: '#8B5CF6', name: 'colourPurple' },
  { value: '#EC4899', name: 'colourPink' },
  { value: '#FFFFFF', name: 'colourWhite' },
  { value: '#8A96A3', name: 'colourGrey' },
  { value: '#1C2733', name: 'colourBlack' },
];

// ขนาดเส้น (คูณกับขนาดพื้นฐาน S) และแบบการเติมสีกรอบ
export const SIZES = [
  { id: 's', mult: 0.6, name: 'sizeS' },
  { id: 'm', mult: 1, name: 'sizeM' },
  { id: 'l', mult: 1.7, name: 'sizeL' },
];
export const FILLS = [
  { id: 'none', name: 'fillNone' },
  { id: 'tint', name: 'fillTint' },
  { id: 'solid', name: 'fillSolid' },
];
const SIZE_MULT = Object.fromEntries(SIZES.map((s) => [s.id, s.mult]));
/** ขนาดของรูปที่ไม่ได้กำหนดขนาดไว้ (รวมโน้ตเก่า) และของรูปใหม่ */
export const DEFAULT_SIZE = 's';
const TINT_OPACITY = 0.28;
// แบบหัวลูกศร
export const HEADS = [
  { id: 'triangle', name: 'headTriangle' },
  { id: 'open', name: 'headOpen' },
  { id: 'double', name: 'headDouble' },
  { id: 'none', name: 'headNone' },
];
export const HEAD_TYPES = ['arrow'];

// ขอบตัวอักษรของข้อความ: none = ไม่มี, auto = ขาว/เข้มให้ตัดกับสีตัวอักษร, หรือรหัสสี
export const OUTLINE_TYPES = ['text'];
// ขนาดตัวอักษร (20 = ขนาดกลางเดิม) ข้อความเก่าที่ยังไม่ได้ตั้งใช้ขนาดเส้น S/M/L แทน
export const FONT_SIZES = [12, 16, 24, 32, 48]; // เล็ก, ปกติ, หัวข้อย่อย, หัวข้อ, หัวเรื่องใหญ่
export const FONT_TYPES = ['text'];
export const DEFAULT_FONT_SIZE = 16; // ข้อความใหม่ = ปกติ
// ฐานคำนวณขนาดจริง: 20 = ขนาดกลางเดิม (คงไว้ ข้อความที่ตั้งขนาดไว้แล้วจะได้ไม่เปลี่ยนขนาด)
const FONT_BASE = 20;
// สไตล์ข้อความ (เก็บใน item.outline): ธรรมดา, ขอบตัวอักษร, หรือกล่องพื้นหลัง
// ข้อความเก่าที่ outline เป็นรหัสสียังแสดงเป็นขอบสีนั้นได้ แต่ไม่มีให้เลือกแล้ว
export const OUTLINES = [
  { id: 'none', name: 'outlineNone' },
  { id: 'auto', name: 'outlineAuto' },
  { id: 'bg-white', name: 'bgWhite' },
  { id: 'bg-dark', name: 'bgDark' },
  { id: 'bg-yellow', name: 'bgYellow' },
  { id: 'bg-solid', name: 'bgSolid' },
];
const TEXT_BG = { 'bg-white': '#FFFFFF', 'bg-dark': '#1C2733', 'bg-yellow': '#F2C230' };
const TEXT_LINE_HEIGHT = 1.3;

// รูปทรงของเครื่องมือกรอบ (item.type ยังเป็น 'rect' แต่มี item.shape บอกรูปทรง)
export const SHAPES = [
  { id: 'rect', name: 'shapeRect' },
  { id: 'ellipse', name: 'shapeEllipse' },
  { id: 'bubble', name: 'shapeBubble' },
  { id: 'star', name: 'shapeStar' },
];
export const SHAPE_TYPES = ['rect'];

const LOUPE_ZOOM = 2; // กำลังขยายของแว่นขยาย
const HIGHLIGHT_DIM = 0.55; // ความมืดของพื้นที่นอกไฮไลต์

// แบบเส้น: ทึบ / ประ / จุด
export const DASHES = [
  { id: 'solid', name: 'dashSolid' },
  { id: 'dash', name: 'dashDash' },
  { id: 'dot', name: 'dashDot' },
];
export const DASH_TYPES = ['rect', 'arrow', 'pen', 'image'];

// เส้นขอบของภาพแปะ (ใช้สี ขนาดเส้น และแบบเส้นที่เลือกอยู่)
export const BORDERS = [
  { id: 'none', name: 'borderNone' },
  { id: 'line', name: 'borderLine' },
];
export const BORDER_TYPES = ['image'];

/** เครื่องมือที่ปรับขนาดได้ / เติมสีได้ / ไม่มีสี */
export const SIZED_TYPES = ['rect', 'arrow', 'pen', 'step', 'loupe', 'image'];
export const FILLED_TYPES = ['rect'];
export const NO_COLOR_TYPES = ['blur', 'highlight'];
/** ชนิดที่วาดเป็นกล่อง (x1,y1)-(x2,y2) ปรับขนาดด้วยจุดจับสี่มุม */
const BOX_TYPES = ['rect', 'blur', 'loupe', 'highlight', 'image'];

export const TOOLS = [
  { id: 'select', key: 'V', label: 'toolSelect', icon: 'select' },
  { id: 'rect', key: 'R', label: 'toolRect', icon: 'rect' },
  { id: 'arrow', key: 'A', label: 'toolArrow', icon: 'arrow' },
  { id: 'pen', key: 'P', label: 'toolPen', icon: 'pen' },
  { id: 'step', key: 'N', label: 'toolStep', icon: 'step' },
  { id: 'text', key: 'T', label: 'toolText', icon: 'text' },
  { id: 'blur', key: 'B', label: 'toolBlur', icon: 'blur' },
  { id: 'loupe', key: 'L', label: 'toolLoupe', icon: 'loupe' },
  { id: 'highlight', key: 'H', label: 'toolHighlight', icon: 'highlight' },
];

const FONT_FAMILY = '"IBM Plex Sans Thai", "Noto Sans Thai", "Leelawadee UI", system-ui, sans-serif';
const SVG_NS = 'http://www.w3.org/2000/svg';

const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
};

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function norm(it) {
  return {
    x: Math.min(it.x1, it.x2),
    y: Math.min(it.y1, it.y2),
    w: Math.abs(it.x2 - it.x1),
    h: Math.abs(it.y2 - it.y1),
  };
}

export class Annotator {
  /**
   * @param {object} o
   * @param {HTMLElement} o.stage  กล่อง position:relative ที่มี <img> อยู่ข้างใน
   * @param {Blob} o.blob          ภาพต้นฉบับ
   * @param {number} o.width
   * @param {number} o.height
   * @param {Array} o.items        โน้ตที่บันทึกไว้
   * @param {(items: Array) => void} o.onChange
   * @param {Record<string, Blob>} o.assets  ภาพที่แปะลงมา (item.type = 'image' อ้างถึงด้วย item.asset)
   * @param {() => void} o.onAssets       เรียกเมื่อมีภาพแปะใหม่
   */
  constructor({ stage, blob, width, height, items = [], onChange = () => {}, assets = {}, onAssets = () => {} }) {
    this.stage = stage;
    this.blob = blob;
    this.W = width;
    this.H = height;
    this.items = structuredClone(items);
    this.onChange = onChange;
    this.assets = { ...assets };
    this.assetUrls = new Map();
    this.onAssets = onAssets;
    this.cropId = null; // ภาพแปะที่กำลังครอปอยู่
    this.tool = 'select';
    this.color = COLORS[0].value;
    this.size = DEFAULT_SIZE;
    this.fill = 'none';
    this.head = 'open'; // ลูกศรใหม่เป็นหัวเปิด (ลูกศรเก่าที่ไม่มีค่า head ยังเป็นหัวทึบตามเดิม)
    this.outline = 'auto';
    this.shape = 'rect';
    this.dash = 'solid';
    this.fontSize = DEFAULT_FONT_SIZE;
    this.border = 'none';
    this.imageUrl = URL.createObjectURL(blob); // ภาพต้นฉบับสำหรับแว่นขยาย
    this.maskId = `hl-${uid()}`;
    this.selectedIds = new Set();
    this.undoStack = [];
    this.redoStack = [];
    this.draft = null;
    this.drag = null;
    this.resize = null;
    this.editor = null;

    // ขนาดเส้นอิงความกว้างภาพ ภาพ 2x (จอ retina) จะได้เส้นหนาขึ้นตามสัดส่วน
    this.S = Math.max(3, Math.round(width / 280));
    // เบลอแบบ Gaussian: เบลอภาพทั้งภาพครั้งเดียวที่ขนาดย่อ (เร็วและเนียน) แล้วตัดเฉพาะส่วนที่ลากคลุมมาแสดง
    this.blurScale = BLUR_DOWNSCALE;
    this.blurRadius = Math.max(BLUR_MIN_RADIUS, Math.round(width / BLUR_RADIUS_DIVISOR)); // pixel ของภาพจริง
    this.blurUrl = null;
    this.blurCanvas = null;

    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('class', 'annotations');
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.svg.setAttribute('preserveAspectRatio', 'none');
    stage.append(this.svg);

    this.svg.addEventListener('pointerdown', (e) => this.onDown(e));
    this.svg.addEventListener('pointermove', (e) => this.onMove(e));
    this.svg.addEventListener('pointerup', (e) => this.onUp(e));
    this.svg.addEventListener('pointercancel', () => this.cancelPointer());
    this.svg.addEventListener('pointerleave', () => this.hideGhost());
    this.svg.addEventListener('dblclick', (e) => this.onDouble(e));

    if (this.items.some((i) => i.type === 'blur')) this.ensureBlur().then(() => this.render());
    this.setTool('select');
    this.render();
    // กล่องพื้นหลังข้อความวัดความกว้างจากฟอนต์ ฟอนต์โหลดเสร็จแล้ววาดใหม่ให้พอดี
    document.fonts?.ready.then(() => this.render());
    new ResizeObserver(() => {
      if (this.selectedIds.size) this.render();
    }).observe(stage);
  }

  // ---------- public API ----------

  setTool(tool) {
    this.commitEditor();
    this.endImageCrop();
    this.hideGhost();
    this.tool = tool;
    this.stage.dataset.tool = tool;
    if (tool !== 'select') this.select(null);
  }

  /** เปลี่ยนค่าให้ทุกชิ้นที่เลือกที่รองรับ (บันทึก undo ครั้งเดียว) */
  applyToSelection(accepts, needsChange, change) {
    const targets = this.selectedItems().filter((it) => accepts(it) && needsChange(it));
    if (!targets.length) return;
    this.mutate(() => targets.forEach(change));
  }

  setSize(size) {
    this.size = size;
    this.applyToSelection(
      (it) => SIZED_TYPES.includes(it.type),
      (it) => (it.size || DEFAULT_SIZE) !== size || it.r,
      (it) => {
        it.size = size;
        delete it.r; // เลือกขนาดจากเมนู แทนขนาดที่ลากไว้
      },
    );
  }

  setOutline(outline) {
    this.outline = outline;
    this.applyToSelection(
      (it) => OUTLINE_TYPES.includes(it.type),
      (it) => (it.outline || 'auto') !== outline,
      (it) => {
        it.outline = outline;
      },
    );
  }

  /** สีขอบตัวอักษรของข้อความนี้ (null = ไม่มีขอบ) */
  outlineOf(it) {
    const outline = it.outline || 'auto';
    if (outline === 'none' || outline.startsWith('bg-')) return null;
    if (outline === 'auto') return isLight(it.color) ? '#1C2733' : '#FFFFFF';
    return outline;
  }

  /** กล่องพื้นหลังของข้อความ: { fill, ink } หรือ null (ตัวอักษรเปลี่ยนเป็นดำ/ขาวเองถ้ากลืนกับพื้น) */
  textBackground(it) {
    const style = it.outline || 'auto';
    if (!style.startsWith('bg-')) return null;
    const fill = style === 'bg-solid' ? it.color : TEXT_BG[style];
    if (!fill) return null;
    const ink = style === 'bg-solid' || isLight(fill) === isLight(it.color) ? (isLight(fill) ? '#1C2733' : '#FFFFFF') : it.color;
    return { fill, ink };
  }

  /** กล่องรอบข้อความ (พิกัดภาพ) วัดความกว้างจริงด้วย canvas */
  textBox(it, size) {
    if (!this.measureCtx) this.measureCtx = document.createElement('canvas').getContext('2d');
    const ctx = this.measureCtx;
    ctx.font = `600 ${size}px ${FONT_FAMILY}`;
    const lines = String(it.text).split('\n');
    const width = Math.max(...lines.map((line) => ctx.measureText(line || ' ').width));
    const padX = size * 0.35;
    const padY = size * 0.18;
    const top = it.y1 - size * 0.65 - padY;
    const bottom = it.y1 + (lines.length - 1) * size * TEXT_LINE_HEIGHT + size * 0.65 + padY;
    return { x: it.x1 - padX, y: top, w: width + padX * 2, h: bottom - top };
  }

  setHead(head) {
    this.head = head;
    this.applyToSelection(
      (it) => HEAD_TYPES.includes(it.type),
      (it) => (it.head || 'triangle') !== head,
      (it) => {
        it.head = head;
      },
    );
  }

  setFill(fill) {
    this.fill = fill;
    this.applyToSelection(
      (it) => FILLED_TYPES.includes(it.type),
      (it) => (it.fill || 'none') !== fill,
      (it) => {
        it.fill = fill;
      },
    );
  }

  /** ขนาดตัวอักษรของข้อความนี้ (ข้อความเก่าแปลงจากขนาดเส้น) */
  fontSizeOf(it) {
    if (it.fontSize) return it.fontSize;
    return Math.round(SIZE_MULT[it.size || DEFAULT_SIZE] * FONT_BASE);
  }

  setFontSize(fontSize) {
    this.fontSize = fontSize;
    this.applyToSelection(
      (it) => FONT_TYPES.includes(it.type),
      (it) => this.fontSizeOf(it) !== fontSize || it.size,
      (it) => {
        it.fontSize = fontSize;
        delete it.size;
      },
    );
  }

  setDash(dash) {
    this.dash = dash;
    this.applyToSelection(
      (it) => DASH_TYPES.includes(it.type),
      (it) => (it.dash || 'solid') !== dash,
      (it) => {
        it.dash = dash;
      },
    );
  }

  setBorder(border) {
    this.border = border;
    this.applyToSelection(
      (it) => BORDER_TYPES.includes(it.type),
      (it) => (it.border || 'none') !== border,
      (it) => {
        it.border = border;
      },
    );
  }

  setShape(shape) {
    this.shape = shape;
    this.applyToSelection(
      (it) => SHAPE_TYPES.includes(it.type),
      (it) => (it.shape || 'rect') !== shape,
      (it) => {
        it.shape = shape;
      },
    );
  }

  setColor(color) {
    this.color = color;
    this.applyToSelection(
      (it) => !NO_COLOR_TYPES.includes(it.type),
      (it) => it.color !== color,
      (it) => {
        it.color = color;
      },
    );
  }

  /** เลิกใช้ annotator นี้ (สลับไปรูปอื่น): ปิดช่องพิมพ์ และคืนหน่วยความจำของ object URL */
  destroy() {
    this.closeEditor();
    this.cropId = null;
    URL.revokeObjectURL(this.imageUrl);
    for (const url of this.assetUrls.values()) URL.revokeObjectURL(url);
    this.assetUrls.clear();
    if (this.blurUrl) URL.revokeObjectURL(this.blurUrl);
  }

  // ---------- วงกลมเลขตามเคอร์เซอร์ ----------

  /** เลขถัดไป: นับเฉพาะเลขที่อยู่บนภาพ (เลขที่หลุดออกนอกภาพจากการครอปก่อนหน้าไม่นับ) */
  nextStepNumber() {
    const onImage = (i) => i.x1 >= 0 && i.y1 >= 0 && i.x1 <= this.W && i.y1 <= this.H;
    return this.items.filter((i) => i.type === 'step' && onImage(i)).reduce((m, i) => Math.max(m, Number(i.n) || 0), 0) + 1;
  }

  showGhost(p) {
    this.ghostPos = p;
    this.drawGhost();
  }

  hideGhost() {
    this.ghostPos = null;
    this.ghostEl?.remove();
  }

  /** วาด/อัปเดตวงกลมจาง (แยกจาก render หลัก ขยับเมาส์จึงไม่ต้องวาดใหม่ทั้งภาพ) */
  drawGhost() {
    if (!this.ghostPos || this.tool !== 'step' || this.editor) {
      this.ghostEl?.remove();
      return;
    }
    if (!this.ghostEl) {
      this.ghostEl = document.createElementNS(SVG_NS, 'g');
      this.ghostEl.setAttribute('class', 'step-ghost');
      this.ghostEl.setAttribute('pointer-events', 'none');
      this.ghostEl.setAttribute('opacity', '0.6');
    }
    const S = this.sizeOf({ type: 'step', size: this.size });
    const n = this.nextStepNumber();
    const { x, y } = this.ghostPos;
    const ink = isLight(this.color) ? '#1C2733' : '#FFFFFF';
    this.ghostEl.innerHTML = `<circle cx="${x}" cy="${y}" r="${S * 4}" fill="${this.color}" stroke="#FFFFFF" stroke-width="${S * 0.7}" />
      <text x="${x}" y="${y}" fill="${ink}" font-family='${FONT_FAMILY}' font-weight="600"
        font-size="${S * 4.2 * stepFontScale(n)}" text-anchor="middle" dominant-baseline="central">${n}</text>`;
    if (this.svg.lastChild !== this.ghostEl) this.svg.append(this.ghostEl);
  }

  // ---------- ภาพแปะ ----------

  assetUrl(asset) {
    let url = this.assetUrls.get(asset);
    if (!url && this.assets[asset]) {
      url = URL.createObjectURL(this.assets[asset]);
      this.assetUrls.set(asset, url);
    }
    return url || '';
  }

  /** แปะภาพลงบนภาพหลัก กึ่งกลางที่ at (พิกัดภาพ) ย่อให้ไม่เกินครึ่งหนึ่งของภาพหลัก */
  async addImage(blob, at = null) {
    const bm = await createImageBitmap(blob);
    const nw = bm.width;
    const nh = bm.height;
    bm.close();
    const asset = uid();
    this.assets[asset] = blob;
    const k = Math.min(1, (this.W * 0.5) / nw, (this.H * 0.5) / nh);
    const w = Math.max(1, Math.round(nw * k));
    const h = Math.max(1, Math.round(nh * k));
    const cx = at ? at.x : this.W / 2;
    const cy = at ? at.y : this.H / 2;
    const x = Math.round(Math.min(Math.max(cx - w / 2, 0), Math.max(0, this.W - w)));
    const y = Math.round(Math.min(Math.max(cy - h / 2, 0), Math.max(0, this.H - h)));
    this.add({
      type: 'image', asset, nw, nh, crop: { x: 0, y: 0, w: nw, h: nh }, x1: x, y1: y, x2: x + w, y2: y + h,
      border: this.border, color: this.color, size: this.size, dash: this.dash,
    });
    this.onAssets();
  }

  /** ภาพแปะที่ยังมีรูปใช้อยู่ (ใช้ตอนบันทึก ไม่เก็บภาพที่ลบไปแล้ว) */
  usedAssets() {
    const out = {};
    for (const it of this.items) {
      if (it.type === 'image' && this.assets[it.asset]) out[it.asset] = this.assets[it.asset];
    }
    return out;
  }

  /** เข้าโหมดครอปภาพแปะ: ลากขอบ/มุมเพื่อตัด ภาพไม่ย่อขยายตาม */
  startImageCrop(id) {
    const item = this.items.find((i) => i.id === id);
    if (!item || item.type !== 'image') return false;
    this.commitEditor();
    this.selectedIds = new Set([id]);
    this.cropId = id;
    this.notifySelection();
    this.render();
    this.stage.dispatchEvent(new CustomEvent('annot-imagecrop', { detail: { active: true } }));
    return true;
  }

  endImageCrop({ quiet = false } = {}) {
    if (!this.cropId) return false;
    this.cropId = null;
    if (!quiet) this.render();
    this.stage.dispatchEvent(new CustomEvent('annot-imagecrop', { detail: { active: false } }));
    return true;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    this.commitEditor();
    if (!this.undoStack.length) return;
    this.redoStack.push(JSON.stringify(this.items));
    this.items = JSON.parse(this.undoStack.pop());
    this.cropId = null;
    this.selectedIds = new Set();
    this.notifySelection();
    this.changed();
  }

  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(JSON.stringify(this.items));
    this.items = JSON.parse(this.redoStack.pop());
    this.cropId = null;
    this.selectedIds = new Set();
    this.notifySelection();
    this.changed();
  }

  clear() {
    if (!this.items.length) return;
    this.mutate(() => {
      this.items = [];
    });
    this.selectedIds = new Set();
    this.render();
  }

  /**
   * จัดลำดับชั้นของรูปที่เลือก (ลำดับใน items = ลำดับการวาด ตัวท้ายอยู่หน้าสุด)
   * kind: 'front' | 'forward' | 'backward' | 'back'
   */
  arrange(kind) {
    if (!this.selectedIds.size) return false;
    const chosen = (it) => this.selectedIds.has(it.id);
    const next = [...this.items];
    if (kind === 'front') {
      next.sort((a, b) => Number(chosen(a)) - Number(chosen(b)));
    } else if (kind === 'back') {
      next.sort((a, b) => Number(chosen(b)) - Number(chosen(a)));
    } else if (kind === 'forward') {
      // ไล่จากหน้าลงหลัง เลื่อนรูปที่เลือกข้ามรูปที่ไม่ได้เลือกไปหนึ่งชั้น
      for (let i = next.length - 2; i >= 0; i -= 1) {
        if (chosen(next[i]) && !chosen(next[i + 1])) [next[i], next[i + 1]] = [next[i + 1], next[i]];
      }
    } else if (kind === 'backward') {
      for (let i = 1; i < next.length; i += 1) {
        if (chosen(next[i]) && !chosen(next[i - 1])) [next[i], next[i - 1]] = [next[i - 1], next[i]];
      }
    }
    // sort ของ JS คงลำดับเดิมของรูปที่ค่าเท่ากัน รูปที่เลือกจึงเรียงกันเหมือนเดิม
    if (next.every((it, i) => it === this.items[i])) return false;
    this.mutate(() => {
      this.items = next;
    });
    return true;
  }

  /** ทำสำเนารูปที่เลือก เยื้องลงขวาเล็กน้อย แล้วเลือกตัวสำเนาแทน */
  duplicateSelected() {
    const chosen = this.selectedItems();
    if (!chosen.length) return false;
    const d = this.S * 4;
    const copies = chosen.map((it) => {
      const copy = structuredClone(it);
      copy.id = uid();
      if (copy.points) copy.points = copy.points.map(([x, y]) => [x + d, y + d]);
      if ('x1' in copy) {
        copy.x1 += d;
        copy.y1 += d;
      }
      if ('x2' in copy) {
        copy.x2 += d;
        copy.y2 += d;
      }
      return copy;
    });
    this.mutate(() => {
      this.items.push(...copies);
    });
    this.selectedIds = new Set(copies.map((c) => c.id));
    this.notifySelection();
    this.render();
    return true;
  }

  deleteSelected() {
    if (!this.selectedIds.size) return false;
    const gone = this.selectedIds;
    this.mutate(() => {
      this.items = this.items.filter((i) => !gone.has(i.id));
    });
    this.selectedIds = new Set();
    this.notifySelection();
    this.render();
    return true;
  }

  /**
   * เลือกรูป: id = null ล้างทั้งหมด, add = true สลับเพิ่ม/เอาออกจากที่เลือกอยู่ (Shift)
   * ส่ง array ของ id ได้ (เลือกหลายชิ้นพร้อมกัน)
   */
  select(id, { add = false } = {}) {
    const ids = id == null ? [] : Array.isArray(id) ? id : [id];
    // เลือกอย่างอื่น = จบการครอปภาพแปะ
    if (this.cropId && (add || ids.length !== 1 || ids[0] !== this.cropId)) this.endImageCrop({ quiet: true });
    if (!add) {
      this.selectedIds = new Set(ids);
    } else {
      for (const one of ids) {
        if (this.selectedIds.has(one)) this.selectedIds.delete(one);
        else this.selectedIds.add(one);
      }
    }
    this.notifySelection();
    this.render();
  }

  selectAll() {
    this.select(this.items.map((i) => i.id));
  }

  notifySelection() {
    this.stage.dispatchEvent(
      new CustomEvent('annot-select', { detail: { item: this.selected(), items: this.selectedItems() } }),
    );
  }

  isEditing() {
    return Boolean(this.editor);
  }

  /** วาดภาพรวมโน้ตเป็น PNG (คืน null ถ้าไม่มีโน้ต) */
  async exportBlob() {
    this.commitEditor();
    if (!this.items.length) return null;
    const bitmap = await createImageBitmap(this.blob);
    const canvas = document.createElement('canvas');
    canvas.width = this.W;
    canvas.height = this.H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    this.exportBitmap = bitmap; // แว่นขยายใช้ภาพต้นฉบับ

    if (this.items.some((i) => i.type === 'text' || i.type === 'step')) {
      const S = this.S;
      await Promise.all([
        document.fonts.load(`600 ${Math.round(S * 5.5)}px ${FONT_FAMILY}`),
        document.fonts.load(`600 ${Math.round(S * 4.2)}px ${FONT_FAMILY}`),
      ]).catch(() => {});
    }
    if (this.items.some((i) => i.type === 'blur')) await this.ensureBlur();

    this.exportImages = new Map();
    for (const it of this.items) {
      if (it.type !== 'image' || this.exportImages.has(it.asset) || !this.assets[it.asset]) continue;
      this.exportImages.set(it.asset, await createImageBitmap(this.assets[it.asset]));
    }

    this.drawHighlightDim(ctx, this.items);
    for (const it of this.items) this.drawToCanvas(ctx, it);
    this.exportBitmap = null;
    for (const bm of this.exportImages.values()) bm.close();
    this.exportImages = null;
    bitmap.close();
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(t('exportFailed')))), 'image/png'),
    );
  }

  // ---------- pointer ----------

  toImage(e) {
    const pt = this.svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(this.svg.getScreenCTM().inverse());
    return { x: Math.round(Math.min(Math.max(p.x, 0), this.W)), y: Math.round(Math.min(Math.max(p.y, 0), this.H)) };
  }

  /** พิกัดบนภาพแบบทศนิยม 1 ตำแหน่ง (เส้นอิสระต้องละเอียดกว่าการปัดเป็นจำนวนเต็ม) */
  toImageExact(e) {
    const pt = this.svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(this.svg.getScreenCTM().inverse());
    const clamp = (v, max) => Math.round(Math.min(Math.max(v, 0), max) * 10) / 10;
    return { x: clamp(p.x, this.W), y: clamp(p.y, this.H) };
  }

  onDown(e) {
    if (e.button !== 0) return;
    if (this.editor) {
      this.commitEditor();
      return;
    }
    const p = this.toImage(e);
    const handle = e.target.closest?.('[data-handle]');
    if (handle) {
      this.startResize(handle.dataset.handle, p);
      this.svg.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
    // กดที่เส้นประรอบรูปที่เลือก: ลากย้ายทั้งกลุ่มได้ไม่ว่าจะใช้เครื่องมือไหนอยู่
    if (e.target.closest?.('[data-grip]') && this.selectedIds.size) {
      this.startMove(p);
      this.svg.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
    // กดที่รูปที่มีอยู่: เลือกแล้วลากย้ายได้ทันที ไม่ว่าจะใช้เครื่องมือไหน
    // Shift = เพิ่ม/เอาออกจากที่เลือก, กดรูปในกลุ่มที่เลือกอยู่ = ลากทั้งกลุ่ม
    const hit = e.target.closest?.('[data-id]');
    const hitItem = hit && this.items.find((i) => i.id === hit.dataset.id);
    if (hitItem) {
      e.preventDefault();
      if (e.shiftKey) {
        this.select(hitItem.id, { add: true });
        return;
      }
      if (!this.isSelected(hitItem)) this.select(hitItem.id);
      this.startMove(p);
      this.svg.setPointerCapture(e.pointerId);
      return;
    }
    if (this.tool === 'select') {
      // ลากคลุมเพื่อเลือกหลายชิ้น
      e.preventDefault();
      this.marquee = { start: p, end: p, add: e.shiftKey, base: new Set(this.selectedIds) };
      if (!e.shiftKey) this.select(null);
      this.svg.setPointerCapture(e.pointerId);
      return;
    }

    e.preventDefault();
    // เริ่มวาดรูปใหม่บนที่ว่าง: เลิกเลือกรูปเดิมก่อน (รูปใหม่จะถูกเลือกแทนเมื่อวาดเสร็จ)
    if (this.selectedIds.size) this.select(null);
    if (this.tool === 'step') {
      const n = this.nextStepNumber();
      this.add({ type: 'step', x1: p.x, y1: p.y, n, color: this.color, size: this.size });
      return;
    }
    if (this.tool === 'text') {
      this.openEditor({ x: p.x, y: p.y });
      return;
    }
    if (this.tool === 'pen') {
      this.draft = { id: uid(), type: 'pen', points: [[p.x, p.y]], color: this.color, size: this.size, dash: this.dash };
      this.svg.setPointerCapture(e.pointerId);
      this.render();
      return;
    }
    // กรอบ ลูกศร เบลอ: ลากเพื่อวาด
    this.draft = { id: uid(), type: this.tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color: this.color, size: this.size };
    if (DASH_TYPES.includes(this.tool)) this.draft.dash = this.dash;
    if (this.tool === 'rect') {
      this.draft.fill = this.fill;
      this.draft.shape = this.shape;
    }
    if (this.tool === 'arrow') this.draft.head = this.head;
    if (this.tool === 'blur') this.ensureBlur().then(() => this.render());
    this.svg.setPointerCapture(e.pointerId);
  }

  onMove(e) {
    // เครื่องมือเลขลำดับ: วงกลมเลขถัดไปแบบจางตามเคอร์เซอร์ (ซ่อนเมื่อชี้รูปที่มีอยู่ ซึ่งลากย้ายได้)
    if (this.tool === 'step' && !this.drag && !this.resize && !this.marquee) {
      if (e.target.closest?.('[data-id], [data-handle], [data-grip]')) this.hideGhost();
      else this.showGhost(this.toImageExact(e));
    }
    if (this.resize) {
      this.moveResize(this.toImage(e), e.shiftKey || this.resize.item.type === 'loupe');
      return;
    }
    if (this.marquee) {
      this.marquee.end = this.toImage(e);
      this.updateMarquee();
      return;
    }
    if (this.drag) {
      const p = this.toImage(e);
      const dx = p.x - this.drag.start.x;
      const dy = p.y - this.drag.start.y;
      if (!this.drag.moved && Math.hypot(dx, dy) < 2) return;
      if (!this.drag.moved) {
        this.pushUndo();
        this.drag.moved = true;
      }
      for (const [item, orig] of this.drag.origs) {
        if (orig.points) {
          item.points = orig.points.map(([x, y]) => [x + dx, y + dy]);
          continue;
        }
        item.x1 = orig.x1 + dx;
        item.y1 = orig.y1 + dy;
        if ('x2' in orig) {
          item.x2 = orig.x2 + dx;
          item.y2 = orig.y2 + dy;
        }
      }
      this.render();
      return;
    }
    if (!this.draft) return;
    if (this.draft.type === 'pen') {
      // ใช้ทุกจุดที่ browser รวมไว้ (coalesced) เส้นจะเนียนแม้ลากเร็ว
      const events = e.getCoalescedEvents?.() || [e];
      const pts = this.draft.points;
      for (const ev of events.length ? events : [e]) {
        const q = this.toImageExact(ev);
        const [lx, ly] = pts[pts.length - 1];
        if (Math.hypot(q.x - lx, q.y - ly) >= PEN_MIN_STEP) pts.push([q.x, q.y]);
      }
      this.render();
      return;
    }
    const p = this.toImage(e);
    if (e.shiftKey && this.draft.type === 'arrow') {
      // ล็อกมุมทีละ 45°
      const dx = p.x - this.draft.x1;
      const dy = p.y - this.draft.y1;
      const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
      const len = Math.hypot(dx, dy);
      this.draft.x2 = Math.round(this.draft.x1 + Math.cos(angle) * len);
      this.draft.y2 = Math.round(this.draft.y1 + Math.sin(angle) * len);
    } else if (e.shiftKey || this.draft.type === 'loupe') {
      // แว่นขยายเป็นวงกลมเสมอ, Shift = จัตุรัส/วงกลม
      const size = Math.max(Math.abs(p.x - this.draft.x1), Math.abs(p.y - this.draft.y1));
      this.draft.x2 = this.draft.x1 + Math.sign(p.x - this.draft.x1 || 1) * size;
      this.draft.y2 = this.draft.y1 + Math.sign(p.y - this.draft.y1 || 1) * size;
    } else {
      this.draft.x2 = p.x;
      this.draft.y2 = p.y;
    }
    this.render();
  }

  onUp() {
    if (this.marquee) {
      this.marquee = null;
      this.render();
      return;
    }
    if (this.resize) {
      const moved = this.resize.moved;
      this.resize = null;
      if (moved) this.changed();
      return;
    }
    if (this.drag) {
      const moved = this.drag.moved;
      this.drag = null;
      if (moved) this.changed();
      return;
    }
    if (!this.draft) return;
    const d = this.draft;
    this.draft = null;
    if (d.type === 'pen') {
      if (d.points.length === 1) d.points.push([...d.points[0]]); // คลิกเดียว = จุด
      this.add(d);
      return;
    }
    const tooSmall =
      d.type === 'arrow' ? Math.hypot(d.x2 - d.x1, d.y2 - d.y1) < this.S * 3 : Math.min(norm(d).w, norm(d).h) < this.S * 2;
    if (tooSmall) {
      this.render();
      return;
    }
    this.add(d);
  }

  cancelPointer() {
    this.marquee = null;
    this.draft = null;
    this.drag = null;
    this.resize = null;
    this.render();
  }

  startMove(p) {
    const origs = new Map(this.selectedItems().map((it) => [it, { ...it }]));
    this.drag = { start: p, origs, moved: false };
  }

  /** เลือกทุกชิ้นที่กรอบลากคลุมแตะถึง */
  updateMarquee() {
    const { start, end, add, base } = this.marquee;
    const box = {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      w: Math.abs(end.x - start.x),
      h: Math.abs(end.y - start.y),
    };
    const hits = [];
    for (const it of this.items) {
      const node = this.svg.querySelector(`[data-id="${CSS.escape(it.id)}"]`);
      if (!node) continue;
      const bb = boundsOf(it, node);
      const touches =
        bb.x <= box.x + box.w && bb.x + bb.width >= box.x && bb.y <= box.y + box.h && bb.y + bb.height >= box.y;
      if (touches) hits.push(it.id);
    }
    this.selectedIds = new Set(add ? [...base, ...hits] : hits);
    this.notifySelection();
    this.render();
  }

  // ---------- ย่อ/ขยายด้วยจุดจับ (แบบ Photoshop) ----------

  startResize(handle, p) {
    const item = this.selected();
    if (!item) return;
    if (item.type === 'arrow' || item.type === 'step') {
      this.resize = { item, handle, moved: false };
      return;
    }
    if (item.type === 'image' && item.id === this.cropId) {
      this.resize = { item, handle, moved: false, cropping: true, box0: norm(item), c0: { ...item.crop } };
      return;
    }
    // กรอบ/เบลอ: ให้มุมตรงข้ามเป็นจุดยึด (x1,y1) และมุมที่ลากเป็น (x2,y2)
    const r = norm(item);
    const left = handle.includes('w');
    const top = handle.startsWith('n');
    this.resize = {
      item,
      handle,
      moved: false,
      anchor: { x: left ? r.x + r.w : r.x, y: top ? r.y + r.h : r.y },
    };
  }

  moveResize(p, keepSquare) {
    const { item, handle, anchor } = this.resize;
    if (!this.resize.moved) {
      this.pushUndo();
      this.resize.moved = true;
    }
    if (item.type === 'arrow') {
      if (handle === 'start') Object.assign(item, { x1: p.x, y1: p.y });
      else Object.assign(item, { x2: p.x, y2: p.y });
      this.render();
      return;
    }
    if (item.type === 'step') {
      // รัศมีตามระยะจากจุดกลางถึงมุมที่ลาก (อย่างน้อยเท่าเลขขนาดเล็กสุด)
      const r = Math.max(Math.abs(p.x - item.x1), Math.abs(p.y - item.y1));
      item.r = Math.max(this.S * SIZE_MULT.s * 4 * 0.6, Math.round(r));
      this.render();
      return;
    }
    if (this.resize.cropping) {
      this.moveImageCrop(p);
      return;
    }
    let { x, y } = p;
    if (item.type === 'image' && !keepSquare) {
      // ภาพแปะย่อ/ขยายตามสัดส่วนเดิม (Shift = ยืดอิสระ)
      const a = item.crop.w / item.crop.h;
      const size = Math.max(Math.abs(x - anchor.x), Math.abs(y - anchor.y) * a);
      x = anchor.x + Math.sign(x - anchor.x || 1) * size;
      y = anchor.y + Math.sign(y - anchor.y || 1) * (size / a);
    } else if (keepSquare && item.type !== 'image') {
      const size = Math.max(Math.abs(x - anchor.x), Math.abs(y - anchor.y));
      x = anchor.x + Math.sign(x - anchor.x || 1) * size;
      y = anchor.y + Math.sign(y - anchor.y || 1) * size;
    }
    Object.assign(item, { x1: anchor.x, y1: anchor.y, x2: x, y2: y });
    this.render();
  }

  /** ครอปภาพแปะ: ขอบที่ลากขยับได้ไม่เกินขอบภาพเต็ม ภาพข้างในอยู่ที่เดิม */
  moveImageCrop(p) {
    const { item, handle, box0: b, c0 } = this.resize;
    const kx = b.w / c0.w;
    const ky = b.h / c0.h;
    const fx = b.x - c0.x * kx; // มุมซ้ายบนของภาพเต็ม
    const fy = b.y - c0.y * ky;
    const px = Math.min(Math.max(p.x, fx), fx + item.nw * kx);
    const py = Math.min(Math.max(p.y, fy), fy + item.nh * ky);
    const min = this.S * 4;
    let left = b.x;
    let top = b.y;
    let right = b.x + b.w;
    let bottom = b.y + b.h;
    if (handle.includes('w')) left = Math.min(px, right - min);
    if (handle.includes('e')) right = Math.max(px, left + min);
    if (handle.startsWith('n')) top = Math.min(py, bottom - min);
    if (handle.startsWith('s')) bottom = Math.max(py, top + min);
    Object.assign(item, { x1: left, y1: top, x2: right, y2: bottom });
    item.crop = { x: (left - fx) / kx, y: (top - fy) / ky, w: (right - left) / kx, h: (bottom - top) / ky };
    this.render();
  }

  /** ขนาดจุดจับคงที่บนจอ ไม่ว่าจะซูมเท่าไร */
  handleSize() {
    const shown = this.stage.clientWidth || this.W;
    return (10 * this.W) / shown;
  }

  drawHandles(item) {
    let points = [];
    if (BOX_TYPES.includes(item.type)) {
      const r = norm(item);
      points = [
        ['nw', r.x, r.y],
        ['ne', r.x + r.w, r.y],
        ['sw', r.x, r.y + r.h],
        ['se', r.x + r.w, r.y + r.h],
      ];
      if (item.id === this.cropId) {
        points.push(
          ['n', r.x + r.w / 2, r.y],
          ['s', r.x + r.w / 2, r.y + r.h],
          ['w', r.x, r.y + r.h / 2],
          ['e', r.x + r.w, r.y + r.h / 2],
        );
      }
    } else if (item.type === 'arrow') {
      points = [
        ['start', item.x1, item.y1],
        ['end', item.x2, item.y2],
      ];
    } else if (item.type === 'step') {
      const r = this.sizeOf(item) * 4;
      points = [
        ['nw', item.x1 - r, item.y1 - r],
        ['ne', item.x1 + r, item.y1 - r],
        ['sw', item.x1 - r, item.y1 + r],
        ['se', item.x1 + r, item.y1 + r],
      ];
    }
    const size = this.handleSize();
    for (const [name, x, y] of points) {
      const h = document.createElementNS(SVG_NS, 'rect');
      h.setAttribute('class', `handle handle-${name}`);
      h.dataset.handle = name;
      h.setAttribute('x', x - size / 2);
      h.setAttribute('y', y - size / 2);
      h.setAttribute('width', size);
      h.setAttribute('height', size);
      this.svg.append(h);
    }
  }

  onDouble(e) {
    // SVG ถูกวาดใหม่ตอนคลิกแรก e.target อาจหลุดไปแล้ว จึงหาใหม่จากตำแหน่งเมาส์
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const hit = under?.closest?.('[data-id]') || e.target.closest?.('[data-id]');
    if (!hit) return;
    const item = this.items.find((i) => i.id === hit.dataset.id);
    if (item?.type === 'text') this.openEditor({ x: item.x1, y: item.y1 }, item);
    if (item?.type === 'step') this.openStepEditor(item);
    if (item?.type === 'image') this.startImageCrop(item.id);
  }

  /** ช่องแก้เลขในวงกลม (ตัวเลขหรือตัวอักษรสั้นๆ ไม่เกิน 3 ตัว) */
  openStepEditor(item) {
    this.commitEditor();
    const scale = this.stage.clientWidth / this.W;
    const r = this.sizeOf(item) * 4 * scale;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'annot-input step-input';
    input.value = String(item.n);
    input.maxLength = STEP_MAX_CHARS;
    input.style.left = `${item.x1 * scale - Math.max(r, 22)}px`;
    input.style.top = `${item.y1 * scale - Math.max(r, 14)}px`;
    input.style.width = `${Math.max(r * 2, 44)}px`;
    input.style.height = `${Math.max(r * 2, 28)}px`;
    input.style.fontSize = `${Math.max(12, r * 1.05)}px`;
    this.stage.append(input);
    this.editor = { input, item, kind: 'step' };
    input.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter') this.commitEditor();
      if (ev.key === 'Escape') this.closeEditor();
    });
    input.addEventListener('blur', () => this.commitEditor());
    input.focus();
    input.select();
  }

  /** พิมพ์ตัวเลขตอนเลือกวงกลมเลขอยู่: แทนเลขเดิม พิมพ์ต่อกันเร็วๆ ได้หลายหลัก */
  typeOnStep(char) {
    const item = this.selected();
    if (!item || item.type !== 'step') return false;
    const now = Date.now();
    const keepTyping = this.stepTyping && this.stepTyping.id === item.id && now - this.stepTyping.at < STEP_TYPING_MS;
    const next = keepTyping ? `${item.n}${char}`.slice(-STEP_MAX_CHARS) : char;
    if (keepTyping) {
      item.n = next; // ต่อจากหลักก่อนหน้า รวมเป็น undo ครั้งเดียว
      this.changed();
    } else {
      this.mutate(() => {
        item.n = next;
      });
    }
    this.stepTyping = { id: item.id, at: now };
    return true;
  }

  // ---------- text editor ----------

  openEditor(pos, item = null) {
    this.commitEditor();
    const scale = this.stage.clientWidth / this.W;
    // หลายบรรทัด: Enter ขึ้นบรรทัดใหม่, ⌘/Ctrl+Enter หรือคลิกที่อื่น = เสร็จ, Esc = ยกเลิก
    const input = document.createElement('textarea');
    input.className = 'annot-input annot-textarea';
    input.rows = 1;
    input.value = item?.text || '';
    input.placeholder = t('typeHere');
    const fontPx = this.sizeOf(item || { type: 'text', fontSize: this.fontSize }) * 5.5 * scale;
    input.style.left = `${pos.x * scale}px`;
    input.style.top = `${pos.y * scale - fontPx * 0.85}px`;
    input.style.fontSize = `${Math.max(12, fontPx)}px`;
    input.style.color = item?.color || this.color;
    this.stage.append(input);
    this.editor = { input, pos, item };
    if (item) {
      this.hiddenId = item.id;
      this.render();
    }
    const autosize = () => {
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
      input.style.width = 'auto';
      input.style.width = `${Math.max(180, input.scrollWidth + 8)}px`;
    };
    input.addEventListener('input', autosize);
    input.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) {
        ev.preventDefault();
        this.commitEditor();
      }
      if (ev.key === 'Escape') this.closeEditor();
    });
    input.addEventListener('blur', () => this.commitEditor());
    input.focus(); // focus ทันที เผื่อผู้ใช้พิมพ์เร็วก่อนเฟรมถัดไป
    autosize();
  }

  commitEditor() {
    if (!this.editor) return;
    const { input, pos, item, kind } = this.editor;
    // ตัดช่องว่างท้ายแต่ละบรรทัด และบรรทัดว่างหัว/ท้าย แต่เก็บบรรทัดว่างตรงกลางไว้
    const text = input.value.replace(/[ \t]+$/gm, '').replace(/^\n+|\n+$/g, '');
    this.closeEditor();
    if (kind === 'step') {
      if (text && text !== String(item.n)) {
        this.mutate(() => {
          item.n = /^\d+$/.test(text) ? Number(text) : text;
        });
      }
      this.render();
      return;
    }
    if (item) {
      if (!text) {
        this.mutate(() => {
          this.items = this.items.filter((i) => i !== item);
        });
      } else if (text !== item.text) {
        this.mutate(() => {
          item.text = text;
        });
      }
      this.render();
    } else if (text) {
      this.add({ type: 'text', x1: pos.x, y1: pos.y, text, color: this.color, fontSize: this.fontSize, outline: this.outline });
    }
  }

  closeEditor() {
    if (!this.editor) return;
    const { input } = this.editor;
    this.editor = null;
    this.hiddenId = null;
    input.remove();
    this.render();
  }

  // ---------- state ----------

  /** รูปที่เลือกอยู่ ถ้าเลือกไว้ชิ้นเดียว (หลายชิ้นคืน null) */
  selected() {
    if (this.selectedIds.size !== 1) return null;
    const [id] = this.selectedIds;
    return this.items.find((i) => i.id === id) || null;
  }

  /** รูปที่เลือกทั้งหมด เรียงตามลำดับที่วาด */
  selectedItems() {
    return this.items.filter((i) => this.selectedIds.has(i.id));
  }

  isSelected(item) {
    return this.selectedIds.has(item.id);
  }

  add(item) {
    const it = { id: uid(), ...item };
    this.mutate(() => {
      this.items.push(it);
    });
    this.selectedIds = new Set([it.id]);
    this.render();
  }

  pushUndo() {
    this.undoStack.push(JSON.stringify(this.items));
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }

  mutate(fn) {
    this.pushUndo();
    fn();
    this.changed();
  }

  changed() {
    this.render();
    this.onChange(structuredClone(this.items));
  }

  // ---------- pixelate ----------

  async ensureBlur() {
    if (this.blurCanvas) return;
    if (!this.blurPromise) {
      this.blurPromise = (async () => {
        const bm = await createImageBitmap(this.blob);
        const w = Math.ceil(this.W / this.blurScale);
        const h = Math.ceil(this.H / this.blurScale);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        // วาดภาพปกติรองไว้ก่อน ขอบภาพจะไม่จางเป็นสีโปร่งจากการเบลอ
        ctx.drawImage(bm, 0, 0, w, h);
        ctx.filter = `blur(${this.blurRadius / this.blurScale}px)`;
        ctx.drawImage(bm, 0, 0, w, h);
        ctx.filter = 'none';
        bm.close();
        this.blurCanvas = c;
        this.blurUrl = await new Promise((r) => c.toBlob((blob) => r(URL.createObjectURL(blob)), 'image/png'));
      })();
    }
    await this.blurPromise;
  }


  // ---------- render (SVG) ----------

  render() {
    const list = this.draft ? [...this.items, this.draft] : this.items;
    const shown = list.filter((it) => it.id !== this.hiddenId);
    this.svg.innerHTML = this.highlightDimSvg(shown) + shown.map((it) => this.svgFor(it)).join('');
    if (!this.draft) {
      const chosen = this.selectedItems().filter((it) => it.id !== this.hiddenId);
      for (const it of chosen) if (it.id !== this.cropId) this.drawSelectionOutline(it);
      // จุดจับย่อ/ขยายเฉพาะตอนเลือกชิ้นเดียว
      if (chosen.length === 1) this.drawHandles(chosen[0]);
    }
    this.drawGhost(); // render ล้าง SVG ทั้งหมด ใส่วงกลมจางกลับ (เลขอัปเดตหลังวางเลขใหม่)
    if (this.marquee) {
      const { start, end } = this.marquee;
      const m = document.createElementNS(SVG_NS, 'rect');
      m.setAttribute('class', 'marquee');
      m.setAttribute('x', Math.min(start.x, end.x));
      m.setAttribute('y', Math.min(start.y, end.y));
      m.setAttribute('width', Math.abs(end.x - start.x));
      m.setAttribute('height', Math.abs(end.y - start.y));
      this.svg.append(m);
    }
  }

  drawSelectionOutline(it) {
    const node = this.svg.querySelector(`[data-id="${CSS.escape(it.id)}"]`);
    if (!node) return;
    const bb = boundsOf(it, node);
    const pad = this.S * 1.5;
    const outline = document.createElementNS(SVG_NS, 'rect');
    outline.setAttribute('class', 'sel');
    outline.setAttribute('x', bb.x - pad);
    outline.setAttribute('y', bb.y - pad);
    outline.setAttribute('width', bb.width + pad * 2);
    outline.setAttribute('height', bb.height + pad * 2);
    outline.setAttribute('rx', this.S);
    outline.setAttribute('stroke-width', Math.max(1.5, this.S * 0.5));
    outline.setAttribute('stroke-dasharray', `${this.S * 2} ${this.S * 1.5}`);
    // เส้นโปร่งใสหนาๆ ทับเส้นประ ให้กดจับลากง่าย
    const grip = outline.cloneNode();
    grip.setAttribute('class', 'sel-grip');
    grip.dataset.grip = it.id;
    grip.removeAttribute('stroke-dasharray');
    grip.setAttribute('stroke-width', this.handleSize());
    this.svg.append(outline, grip);
  }

  /** ขอบพื้นที่เบลอแสดงตอนกำลังวาด/ปรับขนาด/เลือกอยู่ (เบลอไม่มีขอบในตัว จึงมองไม่เห็นว่าครอบถึงไหน) */
  /** พื้นมืดทั้งภาพ เจาะช่องตามพื้นที่ไฮไลต์ทุกชิ้น (อยู่ใต้โน้ตอื่นทั้งหมด) */
  highlightDimSvg(list) {
    const holes = list.filter((it) => it.type === 'highlight');
    if (!holes.length) return '';
    const cut = holes
      .map((it) => {
        const r = norm(it);
        return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${this.S * 0.8}" fill="#000" />`;
      })
      .join('');
    return `<mask id="${this.maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${this.W}" height="${this.H}">
        <rect width="${this.W}" height="${this.H}" fill="#fff" />${cut}
      </mask>
      <rect class="hl-dim" width="${this.W}" height="${this.H}" fill="#000" fill-opacity="${HIGHLIGHT_DIM}"
        mask="url(#${this.maskId})" pointer-events="none" />`;
  }

  drawHighlightDim(ctx, list) {
    const holes = list.filter((it) => it.type === 'highlight');
    if (!holes.length) return;
    const layer = document.createElement('canvas');
    layer.width = this.W;
    layer.height = this.H;
    const lc = layer.getContext('2d');
    lc.fillStyle = `rgba(0, 0, 0, ${HIGHLIGHT_DIM})`;
    lc.fillRect(0, 0, this.W, this.H);
    lc.globalCompositeOperation = 'destination-out';
    lc.fillStyle = '#000';
    for (const it of holes) {
      const r = norm(it);
      lc.beginPath();
      lc.roundRect(r.x, r.y, r.w, r.h, this.S * 0.8);
      lc.fill();
    }
    ctx.drawImage(layer, 0, 0);
  }

  showBlurEdge(it) {
    return it === this.draft || this.selectedIds.has(it.id) || this.resize?.item === it;
  }

  /** ขนาดพื้นฐานของชิ้นนี้ (คูณตามขนาดเส้นที่เลือก) */
  sizeOf(it) {
    // เลขลำดับที่ลากย่อ/ขยายแล้ว ใช้รัศมีที่ลากไว้ (r = S * 4)
    if (it.type === 'step' && it.r) return it.r / 4;
    // ข้อความที่ตั้งขนาดตัวอักษรแล้ว: ตัวอักษร = S * 5.5 และขอบตัวอักษรขยายตาม
    if (it.type === 'text' && it.fontSize) return this.S * (it.fontSize / FONT_BASE);
    return this.S * SIZE_MULT[it.size || DEFAULT_SIZE];
  }

  svgFor(it) {
    const S = this.sizeOf(it);
    const id = esc(it.id);
    switch (it.type) {
      case 'rect': {
        const r = norm(it);
        const fill = it.fill === 'solid' ? 1 : it.fill === 'tint' ? TINT_OPACITY : 0;
        const d = shapePath(it, r, S);
        const dash = dashAttr(it, S);
        if (d) {
          return `<g data-id="${id}" stroke-linejoin="round">
            <path d="${d}" fill="${it.color}" fill-opacity="${fill}" stroke="${it.color}" stroke-width="${S}"${dash}
              pointer-events="${fill ? 'all' : 'visibleStroke'}" />
            <path d="${d}" fill="none" stroke="transparent" stroke-width="${Math.max(S * 3, this.handleSize())}" pointer-events="stroke" />
            ${fill ? '' : `<path class="interior" d="${d}" fill="transparent" pointer-events="all" />`}
          </g>`;
        }
        const box = `x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${S * 0.8}"`;
        // กรอบโปร่ง: จับได้ที่เส้น (มีแนวจับกว้างกว่าเส้นจริง) ข้างในยังวาดกรอบใหม่ซ้อนได้
        // ส่วน .interior ให้จับได้ทั้งกล่องเฉพาะตอนใช้เครื่องมือเลือก (คุมด้วย CSS)
        return `<g data-id="${id}">
          <rect ${box} fill="${it.color}" fill-opacity="${fill}" stroke="${it.color}" stroke-width="${S}"${dash}
            pointer-events="${fill ? 'all' : 'visibleStroke'}" />
          <rect ${box} fill="none" stroke="transparent" stroke-width="${Math.max(S * 3, this.handleSize())}" pointer-events="stroke" />
          ${fill ? '' : `<rect class="interior" ${box} fill="transparent" pointer-events="all" />`}
        </g>`;
      }
      case 'arrow': {
        const g = arrowParts(it, S);
        if (!g) return '';
        // แบบเส้นใช้กับก้านลูกศร (เส้นแรก) เท่านั้น หัวลูกศรเป็นเส้นทึบเสมอ
        const lines = g.lines
          .map(([x1, y1, x2, y2], i) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${S}" stroke-linecap="round"${i ? '' : dashAttr(it, S, true)} />`)
          .join('');
        const polys = g.polys
          .map((pts) => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" stroke-width="${S * 0.4}" stroke-linejoin="round" />`)
          .join('');
        return `<g data-id="${id}" fill="${it.color}" stroke="${it.color}">
          ${lines}${polys}
          <line x1="${it.x1}" y1="${it.y1}" x2="${it.x2}" y2="${it.y2}" stroke="transparent" stroke-width="${Math.max(S * 5, this.handleSize())}" />
        </g>`;
      }
      case 'pen': {
        const d = penPath(it.points);
        return `<g data-id="${id}" fill="none" stroke="${it.color}" stroke-linecap="round" stroke-linejoin="round">
          <path d="${d}" stroke-width="${S}"${dashAttr(it, S, true)} />
          <path d="${d}" stroke="transparent" stroke-width="${Math.max(S * 4, this.handleSize())}" pointer-events="stroke" />
        </g>`;
      }
      case 'step': {
        const r = S * 4;
        const ink = isLight(it.color) ? '#1C2733' : '#FFFFFF';
        return `<g data-id="${id}">
          <circle cx="${it.x1}" cy="${it.y1}" r="${r}" fill="${it.color}" stroke="#FFFFFF" stroke-width="${S * 0.7}" />
          <text x="${it.x1}" y="${it.y1}" fill="${ink}" font-family='${FONT_FAMILY}' font-weight="600"
            font-size="${S * 4.2 * stepFontScale(it.n)}" text-anchor="middle" dominant-baseline="central">${esc(String(it.n))}</text>
        </g>`;
      }
      case 'text': {
        const outline = this.outlineOf(it);
        const size = S * 5.5;
        const lines = String(it.text).split('\n');
        const spans = lines
          .map((line, i) => `<tspan x="${it.x1}" dy="${i ? size * TEXT_LINE_HEIGHT : 0}">${esc(line) || '\u00a0'}</tspan>`)
          .join('');
        const bg = this.textBackground(it);
        if (bg) {
          const b = this.textBox(it, size);
          return `<g data-id="${id}">
            <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${bg.fill}" />
            <text x="${it.x1}" y="${it.y1}" fill="${bg.ink}" font-family='${FONT_FAMILY}' font-weight="600"
              font-size="${size}" dominant-baseline="central">${spans}</text>
          </g>`;
        }
        return `<text data-id="${id}" x="${it.x1}" y="${it.y1}" fill="${it.color}"
          stroke="${outline || 'none'}" stroke-width="${outline ? S * 1.2 : 0}" stroke-linejoin="round" paint-order="stroke"
          font-family='${FONT_FAMILY}' font-weight="600" font-size="${size}" dominant-baseline="central">${spans}</text>`;
      }
      case 'loupe': {
        const { cx, cy, rad } = loupeGeom(it);
        if (rad < 1) return '';
        const m = LOUPE_ZOOM;
        const clip = `lp-${id}`;
        return `<g data-id="${id}">
          <clipPath id="${clip}"><circle cx="${cx}" cy="${cy}" r="${rad}" /></clipPath>
          <circle cx="${cx}" cy="${cy}" r="${rad}" fill="#fff" />
          <image href="${this.imageUrl}" x="${cx - cx * m}" y="${cy - cy * m}" width="${this.W * m}" height="${this.H * m}"
            preserveAspectRatio="none" clip-path="url(#${clip})" />
          <circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="${S * 2.2}" />
          <circle cx="${cx}" cy="${cy}" r="${rad}" fill="transparent" stroke="${it.color}" stroke-width="${S}" pointer-events="all" />
        </g>`;
      }
      case 'image': {
        const r = norm(it);
        const c = it.crop;
        const url = this.assetUrl(it.asset);
        if (!url || r.w < 1 || r.h < 1) return '';
        const box = `x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"`;
        const cropping = this.cropId === it.id;
        // ตอนครอป: แสดงภาพเต็มจางๆ รอบกรอบ ให้เห็นว่าขยายออกได้ถึงไหน
        const kx = r.w / c.w;
        const ky = r.h / c.h;
        const ghost = cropping
          ? `<image href="${url}" x="${r.x - c.x * kx}" y="${r.y - c.y * ky}" width="${it.nw * kx}" height="${it.nh * ky}"
              preserveAspectRatio="none" opacity="0.3" pointer-events="none" />`
          : '';
        return `<g data-id="${id}">${ghost}
          <svg ${box} viewBox="${c.x} ${c.y} ${c.w} ${c.h}" preserveAspectRatio="none" overflow="hidden">
            <image href="${url}" width="${it.nw}" height="${it.nh}" preserveAspectRatio="none" />
          </svg>
          <rect ${box} fill="transparent" pointer-events="all" />
          ${it.border === 'line' ? `<rect ${box} fill="none" stroke="${it.color || COLORS[0].value}" stroke-width="${S}" stroke-linejoin="round"${dashAttr(it, S)} pointer-events="none" />` : ''}
        </g>`;
      }
      case 'highlight': {
        const r = norm(it);
        const box = `x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"`;
        return `<g data-id="${id}">
          <rect ${box} fill="none" stroke="transparent" stroke-width="${Math.max(this.S * 3, this.handleSize())}" pointer-events="stroke" />
          <rect class="interior" ${box} fill="transparent" pointer-events="all" />
          ${this.showBlurEdge(it) ? `<rect class="blur-edge" ${box} />` : ''}
        </g>`;
      }
      case 'blur': {
        const r = norm(it);
        if (!this.blurUrl) {
          return `<rect data-id="${id}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#8A96A3" fill-opacity="0.6" />`;
        }
        const bw = this.blurCanvas.width * this.blurScale;
        const bh = this.blurCanvas.height * this.blurScale;
        return `<svg data-id="${id}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"
            viewBox="${r.x} ${r.y} ${r.w} ${r.h}" preserveAspectRatio="none" overflow="hidden">
          <image href="${this.blurUrl}" width="${bw}" height="${bh}" preserveAspectRatio="none" />
          <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="transparent" />
          ${this.showBlurEdge(it) ? `<rect class="blur-edge" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" />` : ''}
        </svg>`;
      }
      default:
        return '';
    }
  }

  // ---------- render (canvas export) ----------

  drawToCanvas(ctx, it) {
    const S = this.sizeOf(it);
    ctx.save();
    switch (it.type) {
      case 'rect': {
        const r = norm(it);
        ctx.strokeStyle = it.color;
        ctx.fillStyle = it.color;
        ctx.lineWidth = S;
        ctx.lineJoin = 'round';
        const d = shapePath(it, r, S);
        const path = d ? new Path2D(d) : null;
        ctx.beginPath();
        if (!path) ctx.roundRect(r.x, r.y, r.w, r.h, S * 0.8);
        if (it.fill === 'solid' || it.fill === 'tint') {
          ctx.globalAlpha = it.fill === 'solid' ? 1 : TINT_OPACITY;
          if (path) ctx.fill(path);
          else ctx.fill();
          ctx.globalAlpha = 1;
        }
        setCanvasDash(ctx, it, S);
        if (path) ctx.stroke(path);
        else ctx.stroke();
        break;
      }
      case 'image': {
        const bm = this.exportImages?.get(it.asset);
        if (!bm) break;
        const r = norm(it);
        const c = it.crop;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bm, c.x, c.y, c.w, c.h, r.x, r.y, r.w, r.h);
        if (it.border === 'line') {
          ctx.strokeStyle = it.color || COLORS[0].value;
          ctx.lineWidth = S;
          ctx.lineJoin = 'round';
          setCanvasDash(ctx, it, S);
          ctx.strokeRect(r.x, r.y, r.w, r.h);
        }
        break;
      }
      case 'loupe': {
        const { cx, cy, rad } = loupeGeom(it);
        const bm = this.exportBitmap;
        if (rad < 1 || !bm) break;
        const m = LOUPE_ZOOM;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.lineWidth = S * 2.2;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.stroke();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bm, cx - cx * m, cy - cy * m, this.W * m, this.H * m);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.lineWidth = S;
        ctx.strokeStyle = it.color;
        ctx.stroke();
        break;
      }
      case 'arrow': {
        const g = arrowParts(it, S);
        if (!g) break;
        ctx.strokeStyle = it.color;
        ctx.fillStyle = it.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = S;
        g.lines.forEach(([x1, y1, x2, y2], i) => {
          if (i === 0) setCanvasDash(ctx, it, S, true);
          else ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.lineCap = 'round';
        ctx.lineWidth = S * 0.4;
        for (const pts of g.polys) {
          ctx.beginPath();
          ctx.moveTo(...pts[0]);
          for (const p of pts.slice(1)) ctx.lineTo(...p);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        break;
      }
      case 'pen': {
        ctx.strokeStyle = it.color;
        ctx.lineWidth = S;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setCanvasDash(ctx, it, S, true);
        ctx.stroke(new Path2D(penPath(it.points)));
        break;
      }
      case 'step': {
        const r = S * 4;
        ctx.beginPath();
        ctx.arc(it.x1, it.y1, r, 0, Math.PI * 2);
        ctx.fillStyle = it.color;
        ctx.fill();
        ctx.lineWidth = S * 0.7;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
        ctx.fillStyle = isLight(it.color) ? '#1C2733' : '#FFFFFF';
        ctx.font = `600 ${S * 4.2 * stepFontScale(it.n)}px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(it.n), it.x1, it.y1);
        break;
      }
      case 'text': {
        const size = S * 5.5;
        const outline = this.outlineOf(it);
        const bg = this.textBackground(it);
        if (bg) {
          const b = this.textBox(it, size);
          ctx.fillStyle = bg.fill;
          ctx.fillRect(b.x, b.y, b.w, b.h);
        }
        ctx.font = `600 ${size}px ${FONT_FAMILY}`;
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = S * 1.2;
        ctx.fillStyle = bg ? bg.ink : it.color;
        String(it.text)
          .split('\n')
          .forEach((line, i) => {
            const y = it.y1 + i * size * TEXT_LINE_HEIGHT;
            if (outline) {
              ctx.strokeStyle = outline;
              ctx.strokeText(line, it.x1, y);
            }
            ctx.fillText(line, it.x1, y);
          });
        break;
      }
      case 'blur': {
        const r = norm(it);
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const c = this.blurCanvas;
        ctx.drawImage(c, 0, 0, c.width, c.height, 0, 0, c.width * this.blurScale, c.height * this.blurScale);
        break;
      }
      default:
        break;
    }
    ctx.restore();
  }
}

/**
 * ชิ้นส่วนของลูกศรตามแบบหัว ใช้ร่วมกันทั้ง SVG (แสดงผล) และ canvas (ส่งออก)
 * @returns {{lines: number[][], polys: number[][][]} | null}
 */
function arrowParts(it, S) {
  const dx = it.x2 - it.x1;
  const dy = it.y2 - it.y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const ux = dx / len;
  const uy = dy / len;
  const head = it.head || 'triangle';
  const L = Math.min(head === 'double' ? len / 2.2 : len, S * 4.2);
  const halfW = S * 2.6;

  // หัวสามเหลี่ยมที่ปลาย (x, y) ชี้ไปทาง (vx, vy) และจุดที่เส้นควรจบ (ใต้หัวเล็กน้อย ไม่ให้ปลายเส้นโผล่)
  const triangle = (x, y, vx, vy) => {
    const bx = x - vx * L;
    const by = y - vy * L;
    return {
      pts: [
        [x, y],
        [bx - vy * halfW, by + vx * halfW],
        [bx + vy * halfW, by - vx * halfW],
      ],
      base: [bx + vx * S * 0.5, by + vy * S * 0.5],
    };
  };

  switch (head) {
    case 'none':
      return { lines: [[it.x1, it.y1, it.x2, it.y2]], polys: [] };
    case 'open': {
      const bx = it.x2 - ux * L;
      const by = it.y2 - uy * L;
      return {
        lines: [
          [it.x1, it.y1, it.x2, it.y2],
          [it.x2, it.y2, bx - uy * halfW, by + ux * halfW],
          [it.x2, it.y2, bx + uy * halfW, by - ux * halfW],
        ],
        polys: [],
      };
    }
    case 'double': {
      const end = triangle(it.x2, it.y2, ux, uy);
      const start = triangle(it.x1, it.y1, -ux, -uy);
      return { lines: [[...start.base, ...end.base]], polys: [end.pts, start.pts] };
    }
    default: {
      const end = triangle(it.x2, it.y2, ux, uy);
      return { lines: [[it.x1, it.y1, ...end.base]], polys: [end.pts] };
    }
  }
}

// เบลอแบบ Gaussian
const BLUR_DOWNSCALE = 4; // เบลอที่ขนาด 1/4 แล้วขยายกลับ (ภาพเนียนเหมือนเบลอเต็มขนาด แต่เร็วกว่ามาก)
const BLUR_MIN_RADIUS = 14;
const BLUR_RADIUS_DIVISOR = 70; // รัศมีเบลอ = ความกว้างภาพ / 70 (แรงพอให้อ่านตัวหนังสือไม่ออก)

const PEN_MIN_STEP = 1.5; // ระยะขั้นต่ำระหว่างจุด (pixel ของภาพ) กันจุดถี่เกินไป

/** เส้นโค้งเนียนผ่านจุดกึ่งกลางระหว่างจุดที่ลาก (quadratic) */
function penPath(points) {
  if (!points.length) return '';
  const [first] = points;
  if (points.length < 3) return `M${first[0]} ${first[1]}${points.slice(1).map(([x, y]) => `L${x} ${y}`).join('')}`;
  let d = `M${first[0]} ${first[1]}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += `Q${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
  }
  const [lx, ly] = points[points.length - 1];
  return `${d}L${lx} ${ly}`;
}

/**
 * ระยะเส้นประ/จุด (null = เส้นทึบ)
 * roundCap: เส้นที่ปลายมน ปลายยื่นออกไปครึ่งความหนาทั้งสองข้าง จึงต้องเว้นช่องให้กว้างขึ้น
 */
function dashArray(it, S, roundCap = false) {
  if (it.dash === 'dash') return roundCap ? [S * 2, S * 3] : [S * 3, S * 2];
  if (it.dash === 'dot') return [0.01, S * 2]; // ขีดยาวเกือบศูนย์ + ปลายมน = จุดกลม
  return null;
}

function dashAttr(it, S, roundCap = false) {
  const a = dashArray(it, S, roundCap);
  if (!a) return '';
  return ` stroke-dasharray="${a.join(' ')}"${it.dash === 'dot' ? ' stroke-linecap="round"' : ''}`;
}

function setCanvasDash(ctx, it, S, roundCap = false) {
  const a = dashArray(it, S, roundCap);
  ctx.setLineDash(a || []);
  if (it.dash === 'dot') ctx.lineCap = 'round';
}

/** กรอบของรูปบนภาพ: ภาพแปะใช้กล่องที่ครอปแล้ว (getBBox ไม่สนการตัดขอบ จะได้ขนาดภาพเต็ม) */
function boundsOf(it, node) {
  if (it.type === 'image') {
    const r = norm(it);
    return { x: r.x, y: r.y, width: r.w, height: r.h };
  }
  return node.getBBox();
}

/** วงกลมของแว่นขยาย: พอดีกล่องด้านสั้น อยู่กลางกล่อง */
function loupeGeom(it) {
  const r = norm(it);
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2, rad: Math.min(r.w, r.h) / 2 };
}

/** path ของรูปทรงที่ไม่ใช่สี่เหลี่ยม (สี่เหลี่ยมคืน null ใช้ roundRect ตามเดิม) */
function shapePath(it, r, S) {
  const { x, y, w, h } = r;
  const f = (n) => Math.round(n * 10) / 10;
  switch (it.shape) {
    case 'ellipse': {
      const rx = w / 2;
      const ry = h / 2;
      return `M${f(x)} ${f(y + ry)}A${f(rx)} ${f(ry)} 0 1 0 ${f(x + w)} ${f(y + ry)}A${f(rx)} ${f(ry)} 0 1 0 ${f(x)} ${f(y + ry)}Z`;
    }
    case 'bubble': {
      // ตัวกล่อง 78% บน หางชี้ลงซ้ายล่าง
      const bh = h * 0.78;
      const rr = Math.min(S * 3, w / 4, bh / 4);
      const b = y + bh;
      return [
        `M${f(x + rr)} ${f(y)}H${f(x + w - rr)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + rr)}`,
        `V${f(b - rr)}Q${f(x + w)} ${f(b)} ${f(x + w - rr)} ${f(b)}`,
        `H${f(x + w * 0.38)}L${f(x + w * 0.14)} ${f(y + h)}L${f(x + w * 0.22)} ${f(b)}`,
        `H${f(x + rr)}Q${f(x)} ${f(b)} ${f(x)} ${f(b - rr)}V${f(y + rr)}Q${f(x)} ${f(y)} ${f(x + rr)} ${f(y)}Z`,
      ].join('');
    }
    case 'star': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const pts = [];
      for (let i = 0; i < 10; i += 1) {
        const k = i % 2 ? 0.42 : 1;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(`${f(cx + Math.cos(a) * (w / 2) * k)} ${f(cy + Math.sin(a) * (h / 2) * k)}`);
      }
      return `M${pts.join('L')}Z`;
    }
    default:
      return null;
  }
}

const STEP_MAX_CHARS = 3;
const STEP_TYPING_MS = 900;

/** ย่อตัวอักษรในวงกลมเลขเมื่อมีหลายตัว ให้พอดีวง */
function stepFontScale(n) {
  const length = String(n).length;
  if (length >= 3) return 0.62;
  if (length === 2) return 0.8;
  return 1;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
