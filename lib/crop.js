// กรอบครอปบนภาพ: เริ่มคลุมทั้งภาพ ลากมุม/ขอบเพื่อย่อขยาย ลากข้างในเพื่อย้าย ลากข้างนอกเพื่อวาดกรอบใหม่
// เก็บตำแหน่งเป็น pixel ของภาพจริง แสดงผลเป็น % จึงไม่ขึ้นกับระดับซูม

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const MIN_SIZE = 8; // pixel ของภาพ
// แว่นขยายตอนลากขอบ/มุม: ขยายเทียบกับที่เห็นบนจอ ให้เล็งขอบได้แม่นโดยไม่ต้องซูมทั้งภาพ
const LOUPE_SIZE = 140; // px บนจอ
const LOUPE_ZOOM = 4;
const LOUPE_GAP = 24; // ระยะจากเคอร์เซอร์

export class Cropper {
  /**
   * @param {HTMLElement} stage กล่อง position:relative ที่มีภาพอยู่
   * @param {number} width ความกว้างภาพจริง
   * @param {number} height ความสูงภาพจริง
   * @param {(rect) => void} onChange เรียกทุกครั้งที่กรอบเปลี่ยน
   */
  constructor({ stage, width, height, onChange = () => {} }) {
    this.stage = stage;
    this.W = width;
    this.H = height;
    this.onChange = onChange;
    this.rect = { x: 0, y: 0, w: width, h: height };
    this.drag = null;

    // สองชั้น: ชั้นพื้นที่มืดถูกตัดอยู่ในขอบภาพ ส่วนกรอบกับจุดจับไม่ถูกตัด จึงยื่นออกนอกขอบภาพได้เต็มดวง
    this.layer = document.createElement('div');
    this.layer.className = 'crop-layer';
    const dim = document.createElement('div');
    dim.className = 'crop-dim';
    this.shade = document.createElement('div');
    this.shade.className = 'crop-shade';
    dim.append(this.shade);
    this.box = document.createElement('div');
    this.box.className = 'crop-box';
    this.box.innerHTML =
      '<span class="crop-grid"></span>' + HANDLES.map((h) => `<span class="crop-handle ch-${h}" data-handle="${h}"></span>`).join('');
    this.layer.append(dim, this.box);
    stage.append(this.layer);
    stage.classList.add('is-cropping');

    this.img = stage.querySelector('img');
    this.loupe = document.createElement('div');
    this.loupe.className = 'crop-loupe';
    this.loupe.hidden = true;
    this.loupeCanvas = document.createElement('canvas');
    this.loupePos = document.createElement('span');
    this.loupePos.className = 'crop-loupe-pos';
    this.loupe.append(this.loupeCanvas, this.loupePos);
    document.body.append(this.loupe);

    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    this.layer.addEventListener('pointerdown', this.onDown);
    this.layer.addEventListener('pointermove', this.onMove);
    this.layer.addEventListener('pointerup', this.onUp);
    this.layer.addEventListener('pointercancel', this.onUp);
    this.render();
  }

  destroy() {
    this.layer.remove();
    this.loupe.remove();
    this.stage.classList.remove('is-cropping');
  }

  selectAll() {
    this.rect = { x: 0, y: 0, w: this.W, h: this.H };
    this.render();
  }

  /** กรอบปัดเป็นจำนวนเต็ม พร้อมใช้ครอปจริง */
  result() {
    const x = Math.round(this.rect.x);
    const y = Math.round(this.rect.y);
    return {
      x,
      y,
      w: Math.max(1, Math.min(this.W - x, Math.round(this.rect.w))),
      h: Math.max(1, Math.min(this.H - y, Math.round(this.rect.h))),
    };
  }

  isFull() {
    const r = this.result();
    return r.x === 0 && r.y === 0 && r.w === this.W && r.h === this.H;
  }

  toImage(e) {
    const b = this.stage.getBoundingClientRect();
    return {
      x: Math.min(Math.max(((e.clientX - b.left) / b.width) * this.W, 0), this.W),
      y: Math.min(Math.max(((e.clientY - b.top) / b.height) * this.H, 0), this.H),
    };
  }

  onDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const p = this.toImage(e);
    const handle = e.target.closest('[data-handle]')?.dataset.handle;
    if (handle) {
      this.drag = { mode: 'resize', handle, start: p, orig: { ...this.rect } };
    } else if (e.target.closest('.crop-box')) {
      this.drag = { mode: 'move', start: p, orig: { ...this.rect } };
    } else {
      // ลากนอกกรอบ = วาดกรอบใหม่
      this.drag = { mode: 'draw', start: p };
      this.rect = { x: p.x, y: p.y, w: 0, h: 0 };
    }
    this.layer.setPointerCapture(e.pointerId);
    this.layer.dataset.dragging = this.drag.mode;
    this.updateLoupe(e, p);
  }

  onMove(e) {
    if (!this.drag) return;
    const p = this.toImage(e);
    const { mode, start, orig } = this.drag;
    if (mode === 'move') {
      const x = Math.min(Math.max(orig.x + p.x - start.x, 0), this.W - orig.w);
      const y = Math.min(Math.max(orig.y + p.y - start.y, 0), this.H - orig.h);
      this.rect = { ...orig, x, y };
    } else if (mode === 'draw') {
      this.rect = {
        x: Math.min(start.x, p.x),
        y: Math.min(start.y, p.y),
        w: Math.abs(p.x - start.x),
        h: Math.abs(p.y - start.y),
      };
    } else {
      this.rect = this.resized(orig, this.drag.handle, p);
    }
    this.render();
    this.updateLoupe(e, p);
  }

  /** จุดที่กำลังเล็ง: มุม/ขอบที่ลากอยู่ (ไม่ใช่ตำแหน่งเมาส์ตรงๆ เพราะขอบหยุดที่ขนาดขั้นต่ำ) */
  focusPoint(p) {
    const { mode, handle } = this.drag;
    if (mode !== 'resize') return p;
    const { x, y, w, h } = this.rect;
    return {
      x: handle.includes('w') ? x : handle.includes('e') ? x + w : p.x,
      y: handle.includes('n') ? y : handle.includes('s') ? y + h : p.y,
    };
  }

  updateLoupe(e, p) {
    if (!this.drag || this.drag.mode === 'move' || !this.img?.complete) {
      this.loupe.hidden = true;
      return;
    }
    const focus = this.focusPoint(p);
    const dpr = window.devicePixelRatio || 1;
    const px = Math.round(LOUPE_SIZE * dpr);
    const c = this.loupeCanvas;
    if (c.width !== px) {
      c.width = px;
      c.height = px;
    }
    const ctx = c.getContext('2d');
    // pixel ของภาพ -> pixel ของ canvas
    const k = (this.stage.getBoundingClientRect().width / this.W) * LOUPE_ZOOM * dpr;
    const sx = focus.x - px / 2 / k;
    const sy = focus.y - px / 2 / k;
    const toC = (v, s) => (v - s) * k;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, px, px);
    ctx.imageSmoothingEnabled = false; // เห็นเป็นช่อง pixel ชัดๆ เล็งได้แม่น
    ctx.drawImage(this.img, 0, 0, this.W, this.H, toC(0, sx), toC(0, sy), this.W * k, this.H * k);

    // นอกกรอบครอปมืดลง + เส้นกรอบสีส้ม
    const { x, y, w, h } = this.rect;
    const rx = toC(x, sx);
    const ry = toC(y, sy);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.rect(0, 0, px, px);
    ctx.rect(rx, ry, w * k, h * k);
    ctx.fill('evenodd');
    ctx.strokeStyle = '#FF7A3D';
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(rx, ry, w * k, h * k);

    // เป้าเล็งกลางแว่น
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(px / 2, px / 2 - 10 * dpr);
    ctx.lineTo(px / 2, px / 2 + 10 * dpr);
    ctx.moveTo(px / 2 - 10 * dpr, px / 2);
    ctx.lineTo(px / 2 + 10 * dpr, px / 2);
    ctx.stroke();

    this.loupePos.textContent = `${Math.round(focus.x)}, ${Math.round(focus.y)}`;

    // วางขวาล่างของเคอร์เซอร์ ล้นจอเมื่อไหร่ย้ายไปอีกฝั่ง
    this.loupe.hidden = false;
    const boxH = this.loupe.offsetHeight;
    let left = e.clientX + LOUPE_GAP;
    let top = e.clientY + LOUPE_GAP;
    if (left + LOUPE_SIZE > innerWidth - 8) left = e.clientX - LOUPE_GAP - LOUPE_SIZE;
    if (top + boxH > innerHeight - 8) top = e.clientY - LOUPE_GAP - boxH;
    this.loupe.style.left = `${Math.max(8, left)}px`;
    this.loupe.style.top = `${Math.max(8, top)}px`;
  }

  /** ย่อ/ขยายตามขอบที่ลาก ขอบตรงข้ามอยู่ที่เดิม และไม่ให้เล็กเกิน MIN_SIZE */
  resized(orig, handle, p) {
    let left = orig.x;
    let top = orig.y;
    let right = orig.x + orig.w;
    let bottom = orig.y + orig.h;
    if (handle.includes('w')) left = Math.min(p.x, right - MIN_SIZE);
    if (handle.includes('e')) right = Math.max(p.x, left + MIN_SIZE);
    if (handle.includes('n')) top = Math.min(p.y, bottom - MIN_SIZE);
    if (handle.includes('s')) bottom = Math.max(p.y, top + MIN_SIZE);
    return { x: left, y: top, w: right - left, h: bottom - top };
  }

  onUp() {
    if (!this.drag) return;
    // วาดกรอบเล็กเกินไป (เช่นแค่คลิก) กลับไปคลุมทั้งภาพ
    if (this.drag.mode === 'draw' && (this.rect.w < MIN_SIZE || this.rect.h < MIN_SIZE)) this.selectAll();
    this.drag = null;
    this.loupe.hidden = true;
    delete this.layer.dataset.dragging;
    this.render();
  }

  render() {
    const { x, y, w, h } = this.rect;
    const position = {
      left: `${(x / this.W) * 100}%`,
      top: `${(y / this.H) * 100}%`,
      width: `${(w / this.W) * 100}%`,
      height: `${(h / this.H) * 100}%`,
    };
    Object.assign(this.box.style, position);
    Object.assign(this.shade.style, position);
    this.onChange(this.result());
  }
}

/** ครอปภาพเป็น PNG ใหม่ */
export async function cropBlob(blob, rect) {
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(rect.w, rect.h);
  canvas.getContext('2d').drawImage(bitmap, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
  bitmap.close();
  return canvas.convertToBlob({ type: 'image/png' });
}

/** เลื่อนโน้ตทุกชิ้นตามมุมบนซ้ายของภาพที่ครอป */
export function shiftAnnotations(items, dx, dy, keepWithin = null) {
  const shifted = items.map((it) => {
    const moved = { ...it };
    if (it.points) moved.points = it.points.map(([x, y]) => [x + dx, y + dy]);
    if ('x1' in it) {
      moved.x1 = it.x1 + dx;
      moved.y1 = it.y1 + dy;
    }
    if ('x2' in it) {
      moved.x2 = it.x2 + dx;
      moved.y2 = it.y2 + dy;
    }
    return moved;
  });
  // ครอป: ทิ้งรูปที่หลุดออกนอกภาพใหม่ทั้งชิ้น (ไม่งั้นมองไม่เห็นแต่ยังอยู่ เช่นเลขลำดับที่ถูกตัดออกยังถูกนับต่อ)
  if (!keepWithin) return shifted;
  return shifted.filter((it) => {
    const b = itemBounds(it);
    return !b || (b.x2 >= 0 && b.y2 >= 0 && b.x1 <= keepWithin.w && b.y1 <= keepWithin.h);
  });
}

/** กรอบคร่าวๆ ของรูป (พิกัดภาพ) ใช้ตัดสินว่ายังอยู่บนภาพไหม */
export function itemBounds(it) {
  if (it.points?.length) {
    const xs = it.points.map((p) => p[0]);
    const ys = it.points.map((p) => p[1]);
    return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
  }
  if (!('x1' in it)) return null;
  if ('x2' in it) {
    return { x1: Math.min(it.x1, it.x2), y1: Math.min(it.y1, it.y2), x2: Math.max(it.x1, it.x2), y2: Math.max(it.y1, it.y2) };
  }
  return { x1: it.x1, y1: it.y1, x2: it.x1, y2: it.y1 }; // เลขลำดับ/ข้อความ: จุดยึด
}
