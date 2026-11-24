// เปลี่ยนชื่อรูป (ใช้ร่วมกันระหว่างหน้า result และหน้าประวัติ)
// record.title = ชื่อที่แสดง, record.pageTitle = ชื่อแท็บเดิมตอนแคป (เก็บไว้ตอนเปลี่ยนชื่อครั้งแรก),
// record.renamed = ตั้งชื่อเองแล้ว (ใช้ชื่อนี้เป็นชื่อไฟล์ตอนดาวน์โหลด)

import { listCaptures, patchCapture } from './db.js';

/** วันเวลาแบบ 20261124-221530 (ใช้ใน service worker ได้ ไม่พึ่ง DOM) */
function stamp(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** ชื่อเริ่มต้นของรูปที่แคปใหม่ เช่น CrabCap_20261124-221530 */
export function defaultTitle(ts) {
  return `CrabCap_${stamp(ts)}`;
}

export function cleanName(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

/** ชื่อซ้ำกับรูปอื่น: เติม (1), (2), … ต่อท้าย ใช้เลขแรกที่ยังว่าง (ไม่สนตัวพิมพ์เล็ก/ใหญ่) */
export async function uniqueTitle(name, selfId) {
  let taken;
  try {
    taken = new Set((await listCaptures()).filter((rec) => rec.id !== selfId).map((rec) => (rec.title || '').toLowerCase()));
  } catch (_) {
    return name;
  }
  if (!taken.has(name.toLowerCase())) return name;
  const base = name.replace(/\s*\(\d+\)$/, '');
  let n = 1;
  while (taken.has(`${base} (${n})`.toLowerCase())) n += 1;
  return `${base} (${n})`;
}

/**
 * ตั้งชื่อใหม่ให้รูปแล้วบันทึก (แก้ rec ในที่เดิมด้วย)
 * ชื่อว่าง = กลับไปใช้ชื่อแท็บเดิม
 * @returns {Promise<{changed: boolean, adjusted: string | null}>} adjusted = ชื่อที่เติมเลขให้เพราะซ้ำ
 */
export async function renameCapture(rec, typed) {
  let wanted = cleanName(typed);
  let adjusted = null;
  if (wanted && wanted !== rec.title) {
    const unique = await uniqueTitle(wanted, rec.id);
    if (unique !== wanted) adjusted = unique;
    wanted = unique;
  }
  const pageTitle = rec.pageTitle ?? rec.title ?? '';
  const next = wanted || pageTitle;
  if (next === rec.title) return { changed: false, adjusted };
  const renamed = Boolean(wanted) && wanted !== pageTitle;
  await patchCapture(rec.id, { title: next, pageTitle, renamed });
  Object.assign(rec, { title: next, pageTitle, renamed });
  return { changed: true, adjusted };
}

/**
 * ชื่อไฟล์ (ไม่รวม .png): ตั้งชื่อเองแล้วใช้ "ชื่อ_วันเวลา" ไม่งั้นใช้ "CrabCap_วันเวลา"
 * suffix เช่น _part2 หรือ _original
 */
export function fileName(rec, suffix = '') {
  const own = rec.renamed
    ? String(rec.title || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
    : '';
  return own ? `${own}_${stamp(rec.createdAt)}${suffix}` : `${defaultTitle(rec.createdAt)}${suffix}`;
}
