// สร้างภาพย่อสำหรับหน้าประวัติและ popup ใช้ได้ทั้งใน service worker และหน้าเว็บ (OffscreenCanvas)

const THUMB_WIDTH = 480;
const THUMB_MAX_HEIGHT = 360; // ภาพยาวจะเก็บเฉพาะส่วนบน

/**
 * @returns {Promise<{thumb: Blob, width: number, height: number}>} width/height คือขนาดภาพเต็ม
 */
export async function makeThumb(record) {
  const first = await createImageBitmap(record.segments[0]);
  let sx = 0;
  let sy = 0;
  let sw = first.width;
  let sh = first.height;
  let fullHeight = 0;

  if (record.crop) {
    const scale = first.width / record.crop.viewportWidth;
    sx = Math.max(0, Math.round(record.crop.x * scale));
    sy = Math.max(0, Math.round(record.crop.y * scale));
    sw = Math.max(1, Math.min(first.width - sx, Math.round(record.crop.width * scale)));
    sh = Math.max(1, Math.min(first.height - sy, Math.round(record.crop.height * scale)));
    fullHeight = sh;
  } else {
    fullHeight = first.height;
    for (let i = 1; i < record.segments.length; i += 1) {
      const bm = await createImageBitmap(record.segments[i]);
      fullHeight += bm.height;
      bm.close();
    }
  }

  const scale = Math.min(1, THUMB_WIDTH / sw);
  const tw = Math.max(1, Math.round(sw * scale));
  const th = Math.max(1, Math.min(Math.round(sh * scale), THUMB_MAX_HEIGHT));
  const canvas = new OffscreenCanvas(tw, th);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(first, sx, sy, sw, th / scale, 0, 0, tw, th);
  first.close();

  const thumb = await canvas.convertToBlob({ type: 'image/webp', quality: 0.82 });
  return { thumb, width: sw, height: fullHeight };
}
