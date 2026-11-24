import { saveCapture, listCaptures, deleteCapture } from '../lib/db.js';
import { makeThumb } from '../lib/thumb.js';

const log = document.getElementById('log');
document.getElementById('ext-warn').hidden = !chrome.runtime?.id;

// ---------- ภาพจำลอง ----------

const PALETTES = [
  { bg: '#f6f7f9', brand: '#2f6fed', card: '#ffffff', ink: '#1c2733' },
  { bg: '#fffaf0', brand: '#e5484d', card: '#ffffff', ink: '#2a1f1a' },
  { bg: '#0f1720', brand: '#1f9d55', card: '#18222d', ink: '#e8edf2' },
];

/** วาดหน้าเว็บปลอม: แถบเมนู, hero, การ์ด, ตาราง ให้พอทดสอบเครื่องมือโน้ตได้ */
async function fakePage(width, height, p, label) {
  const c = new OffscreenCanvas(width, height);
  const x = c.getContext('2d');
  const s = width / 1440;
  x.fillStyle = p.bg;
  x.fillRect(0, 0, width, height);

  x.fillStyle = p.card;
  x.fillRect(0, 0, width, 72 * s);
  x.fillStyle = p.brand;
  x.fillRect(40 * s, 22 * s, 120 * s, 28 * s);
  x.fillStyle = p.ink;
  x.globalAlpha = 0.5;
  for (let i = 0; i < 5; i += 1) x.fillRect(width - (560 - i * 100) * s, 32 * s, 70 * s, 10 * s);
  x.globalAlpha = 1;

  x.font = `600 ${44 * s}px "IBM Plex Sans Thai", sans-serif`;
  x.fillText(label, 80 * s, 180 * s);
  x.font = `${20 * s}px "IBM Plex Sans Thai", sans-serif`;
  x.globalAlpha = 0.7;
  x.fillText('ข้อความตัวอย่างสำหรับทดสอบการแคปหน้าจอ ชื่อ: สมชาย ใจดี โทร 081-234-5678', 80 * s, 226 * s);
  x.globalAlpha = 1;
  x.fillStyle = p.brand;
  x.fillRect(80 * s, 260 * s, 180 * s, 48 * s);

  let y = 360 * s;
  let row = 0;
  while (y < height - 40 * s) {
    for (let col = 0; col < 3; col += 1) {
      const cx = (80 + col * 440) * s;
      x.fillStyle = p.card;
      x.fillRect(cx, y, 400 * s, 260 * s);
      x.fillStyle = p.brand;
      x.globalAlpha = 0.15 + ((row + col) % 3) * 0.1;
      x.fillRect(cx, y, 400 * s, 140 * s);
      x.globalAlpha = 1;
      x.fillStyle = p.ink;
      x.font = `600 ${18 * s}px "IBM Plex Sans Thai", sans-serif`;
      x.fillText(`การ์ด ${row * 3 + col + 1}`, cx + 20 * s, y + 180 * s);
      x.globalAlpha = 0.45;
      x.fillRect(cx + 20 * s, y + 200 * s, 300 * s, 8 * s);
      x.fillRect(cx + 20 * s, y + 220 * s, 220 * s, 8 * s);
      x.globalAlpha = 1;
    }
    y += 300 * s;
    row += 1;
  }
  return c.convertToBlob({ type: 'image/png' });
}

async function splitSegments(width, height, p, label, segment = 8192) {
  const full = await createImageBitmap(await fakePage(width, height, p, label));
  const out = [];
  for (let y = 0; y < height; y += segment) {
    const h = Math.min(segment, height - y);
    const c = new OffscreenCanvas(width, h);
    c.getContext('2d').drawImage(full, 0, y, width, h, 0, 0, width, h);
    out.push(await c.convertToBlob({ type: 'image/png' }));
  }
  return out;
}

async function save(rec) {
  const record = { id: crypto.randomUUID(), crop: null, notes: [], ...rec };
  Object.assign(record, await makeThumb(record));
  await saveCapture(record);
  return record;
}

async function seed() {
  await document.fonts.ready;
  const now = Date.now();
  log.textContent = 'กำลังสร้าง…';
  await save({
    mode: 'element',
    createdAt: now - 86400e3 * 3,
    url: 'https://shop.example.com/cart',
    title: 'ตะกร้าสินค้า – Example Shop',
    segments: [await fakePage(1200, 800, PALETTES[1], 'ตะกร้าสินค้า')],
  });
  await save({
    mode: 'region',
    createdAt: now - 3600e3 * 5,
    url: 'https://admin.example.com/dashboard',
    title: 'Dashboard · Admin',
    segments: [await fakePage(2880, 1800, PALETTES[2], 'Dashboard')],
    crop: { x: 100, y: 120, width: 900, height: 520, viewportWidth: 1440 },
  });
  await save({
    mode: 'visible',
    createdAt: now - 60e3 * 12,
    url: 'https://www.example.com/pricing',
    title: 'แพ็กเกจและราคา',
    segments: [await fakePage(2880, 1800, PALETTES[0], 'แพ็กเกจและราคา')],
  });
  const full = await save({
    mode: 'full',
    createdAt: now - 20e3,
    url: 'https://www.example.com/',
    title: 'Example — หน้าแรก',
    segments: await splitSegments(1440, 5200, PALETTES[0], 'หน้าแรกแบบยาว'),
    notes: ['พบพื้นที่เลื่อนภายในหน้า จึงขยายให้แสดงเนื้อหาทั้งหมด'],
  });
  log.textContent = 'สร้างภาพตัวอย่าง 4 ภาพแล้ว';
  return full;
}

async function seedLong() {
  log.textContent = 'กำลังสร้างภาพยาว 40,000 px…';
  await save({
    mode: 'full',
    createdAt: Date.now(),
    url: 'https://docs.example.com/very-long',
    title: 'เอกสารยาวมาก',
    segments: await splitSegments(1440, 40000, PALETTES[1], 'เอกสารยาวมาก'),
  });
  log.textContent = 'สร้างแล้ว หน้า result จะแบ่งเป็น 2 ไฟล์ และปิดเครื่องมือโน้ต';
}

async function updateLatest() {
  const [latest] = await listCaptures(1);
  document.getElementById('open-latest').href = latest ? `../result.html#${latest.id}` : '../result.html';
}

document.getElementById('seed').addEventListener('click', async () => {
  await seed();
  updateLatest();
});
document.getElementById('seed-long').addEventListener('click', async () => {
  await seedLong();
  updateLatest();
});
document.getElementById('wipe').addEventListener('click', async () => {
  for (const r of await listCaptures()) await deleteCapture(r.id);
  log.textContent = 'ลบแล้ว';
  updateLatest();
});
updateLatest();

// ---------- overlay ในหน้าเว็บ ----------

function loadScript(src) {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = `${src}?t=${Date.now()}`;
    s.onload = resolve;
    document.head.append(s);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

document.getElementById('demo-progress').addEventListener('click', async () => {
  await loadScript('../content/progress-overlay.js');
  const p = window.__baProgress;
  p.reset();
  p.update('เชื่อมต่อกับแท็บ', null);
  await sleep(700);
  for (let i = 0; i <= 10; i += 1) {
    if (p.cancelled) break;
    p.update(`เลื่อนโหลดเนื้อหาให้ครบ ${i * 10}%`, i / 10);
    await sleep(250);
  }
  for (const step of ['รอรูปภาพและฟอนต์โหลดเสร็จ', 'รอ animation เล่นจบ', 'รอให้หน้าเว็บนิ่ง', 'กำลังถ่ายภาพ']) {
    if (p.cancelled) break;
    p.update(step, null);
    await sleep(900);
  }
  await p.remove();
  log.textContent = p.cancelled ? 'ผู้ใช้กดยกเลิก' : 'จบการจำลอง (ของจริงจะเปิดแท็บผลลัพธ์ตรงนี้)';
});

document.getElementById('demo-error').addEventListener('click', async () => {
  await loadScript('../content/progress-overlay.js');
  window.__baProgress.error('เชื่อมต่อแท็บไม่ได้: Another debugger is already attached to the tab');
});

document.getElementById('demo-select').addEventListener('click', async () => {
  // overlay จริงส่งข้อความหา background เมื่อเลือกเสร็จ ใน dev จะแค่ log
  window.chrome.runtime.sendMessage = async (m) => {
    log.textContent = `overlay ส่ง: ${JSON.stringify(m)}`;
  };
  window.__baSelectActive = false;
  await loadScript('../content/select-overlay.js');
});
