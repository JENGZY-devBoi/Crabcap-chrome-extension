// เก็บภาพที่แคปใน IndexedDB ของ extension
// ใช้ร่วมกันได้ทั้ง service worker และหน้า result เพราะอยู่ origin เดียวกัน
// (ส่ง Blob ใหญ่ผ่าน runtime message ไม่เสถียร และ service worker อาจถูกปิดกลางทาง)

const DB_NAME = 'ba-capture';
const STORE = 'captures';
let dbPromise;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function saveCapture(record) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(record);
  await done(tx);
}

export async function getCapture(id) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const req = tx.objectStore(STORE).get(id);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// เก็บไว้เฉพาะ N ภาพล่าสุด
export async function pruneCaptures(keep = 30) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const cursorReq = tx.objectStore(STORE).index('createdAt').openCursor(null, 'prev');
  let seen = 0;
  cursorReq.onsuccess = () => {
    const cursor = cursorReq.result;
    if (!cursor) return;
    seen += 1;
    if (seen > keep) cursor.delete();
    cursor.continue();
  };
  await done(tx);
}

/** รายการภาพทั้งหมด ใหม่สุดก่อน (รวม Blob ไว้ด้วย แต่ Blob ใน IndexedDB ไม่ถูกโหลดเข้าหน่วยความจำจนกว่าจะอ่าน) */
export async function listCaptures(limit = Infinity) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const req = tx.objectStore(STORE).index('createdAt').openCursor(null, 'prev');
  const out = [];
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || out.length >= limit) {
        resolve(out);
        return;
      }
      out.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCapture(id) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  await done(tx);
}

/** แก้บางฟิลด์ของภาพ (เช่น annotations) โดยไม่ต้องส่ง record ทั้งก้อน */
export async function patchCapture(id, patch) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const req = store.get(id);
  req.onsuccess = () => {
    if (req.result) store.put({ ...req.result, ...patch });
  };
  await done(tx);
}
