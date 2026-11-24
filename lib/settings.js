export const DEFAULT_SETTINGS = {
  preloadScroll: true, // เลื่อนผ่านทั้งหน้าเพื่อโหลด lazy content
  waitAnimations: true, // รอ animation ที่เล่นอยู่ให้จบ
  freezeAnimations: true, // หยุด transition/animation ระหว่างแคป
  freezeViewportUnits: true, // ล็อกความสูง 100vh ไม่ให้ยืด
  expandScrollContainer: true, // ขยายพื้นที่เลื่อนภายใน (เว็บแอป)
  extraDelay: 300, // หน่วงเพิ่มก่อนแคป (ms)
};

export async function getSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
}
