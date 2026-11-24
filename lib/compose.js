// ประกอบภาพจากที่เก็บไว้: ต่อท่อนภาพ, ครอป, และวาดโน้ตลงไป
// ใช้ร่วมกันระหว่างหน้า result (แสดง/แก้) และหน้าประวัติ (ดาวน์โหลดหลายรูป)

import { Annotator } from './annotate.js';

// เพดานขนาด canvas ของ Chrome: ด้านละไม่เกิน 32,767 px และพื้นที่รวมราว 268 ล้าน px
const MAX_CANVAS_SIDE = 32000;
const MAX_CANVAS_AREA = 250_000_000;

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

/** ประกอบท่อนภาพเป็นภาพเดียว หรือแบ่งเป็นหลายภาพถ้ายาวเกินเพดาน canvas */
export async function buildImages(rec) {
  const bitmaps = await Promise.all(rec.segments.map((b) => createImageBitmap(b)));

  if (rec.crop) {
    const bm = bitmaps[0];
    const scale = bm.width / rec.crop.viewportWidth;
    const sx = clamp(Math.round(rec.crop.x * scale), 0, bm.width - 1);
    const sy = clamp(Math.round(rec.crop.y * scale), 0, bm.height - 1);
    const sw = clamp(Math.round(rec.crop.width * scale), 1, bm.width - sx);
    const sh = clamp(Math.round(rec.crop.height * scale), 1, bm.height - sy);
    const canvas = new OffscreenCanvas(sw, sh);
    canvas.getContext('2d').drawImage(bm, sx, sy, sw, sh, 0, 0, sw, sh);
    return [{ blob: await canvas.convertToBlob({ type: 'image/png' }), width: sw, height: sh }];
  }

  if (bitmaps.length === 1) {
    return [{ blob: rec.segments[0], width: bitmaps[0].width, height: bitmaps[0].height }];
  }

  const width = Math.max(...bitmaps.map((b) => b.width));
  const total = bitmaps.reduce((sum, b) => sum + b.height, 0);
  const maxPartHeight = Math.min(MAX_CANVAS_SIDE, Math.floor(MAX_CANVAS_AREA / width));
  const result = [];

  for (let start = 0; start < total; start += maxPartHeight) {
    const height = Math.min(maxPartHeight, total - start);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    let top = 0;
    for (const bm of bitmaps) {
      const bottom = top + bm.height;
      if (bottom > start && top < start + height) {
        const sy = Math.max(0, start - top);
        const sh = Math.min(bm.height - sy, start + height - (top + sy));
        ctx.drawImage(bm, 0, sy, bm.width, sh, 0, top + sy - start, bm.width, sh);
      }
      top = bottom;
    }
    result.push({ blob: await canvas.convertToBlob({ type: 'image/png' }), width, height });
  }
  return result;
}


/** ภาพสุดท้ายของรูปนี้ (ครอปแล้ว + วาดโน้ตแล้ว) ภาพยาวเกินเพดานได้หลายไฟล์ (ไม่มีโน้ต เหมือนหน้าแก้ไข) */
export async function renderCapture(rec) {
  const parts = await buildImages(rec);
  if (parts.length !== 1 || !rec.annotations?.length) return parts.map((p) => p.blob);
  // วาดโน้ตด้วย Annotator ตัวเดียวกับหน้าแก้ไข บน stage ที่ไม่ได้ใส่ในหน้า (ใช้แค่ส่วนวาดลง canvas)
  const stage = document.createElement('div');
  const annotator = new Annotator({
    stage,
    blob: parts[0].blob,
    width: parts[0].width,
    height: parts[0].height,
    items: rec.annotations,
    assets: rec.assets || {},
  });
  try {
    return [await annotator.exportBlob()];
  } finally {
    annotator.destroy();
  }
}
