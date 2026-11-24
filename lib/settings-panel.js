// แผงการตั้งค่าที่ใช้ร่วมกันทุกหน้า: ใน popup อยู่ใน <details>, ในหน้าภาพทั้งหมด/ผลลัพธ์เปิดจากปุ่มเฟือง
import { getSettings, saveSettings } from './settings.js';
import { currentTheme, applyTheme, icon } from './ui.js';
import { applyI18n, getLang, setLang } from './i18n.js';

const TOGGLES = [
  ['preloadScroll', 'setPreload', 'setPreloadDesc'],
  ['waitAnimations', 'setWaitAnim', 'setWaitAnimDesc'],
  ['freezeAnimations', 'setFreeze', 'setFreezeDesc'],
  ['freezeViewportUnits', 'setFreezeVh', 'setFreezeVhDesc'],
  ['expandScrollContainer', 'setExpand', 'setExpandDesc'],
];

const MARKUP = `
  <div class="pref">
    <span data-i18n="language"></span>
    <div class="seg" data-seg="lang" role="group" data-i18n-aria="language">
      <button type="button" data-value="en">${icon('langEn')}<span>English</span></button>
      <button type="button" data-value="th">${icon('langTh')}<span>ไทย</span></button>
    </div>
  </div>
  <div class="pref">
    <span data-i18n="theme"></span>
    <div class="seg" data-seg="theme" role="group" data-i18n-aria="theme">
      <button type="button" data-value="dark">${icon('crabDark')}<span data-i18n="themeDarkShort"></span></button>
      <button type="button" data-value="light">${icon('crabLight')}<span data-i18n="themeLightShort"></span></button>
    </div>
  </div>
  <h3 class="sub" data-i18n="settingsTitle"></h3>
  ${TOGGLES.map(
    ([name, title, desc]) => `
  <label class="toggle">
    <input type="checkbox" name="${name}">
    <span><strong data-i18n="${title}"></strong><small data-i18n="${desc}"></small></span>
  </label>`,
  ).join('')}
  <label class="number">
    <span data-i18n="setDelay"></span>
    <input type="number" name="extraDelay" min="0" max="10000" step="100"> <span>ms</span>
  </label>
  <button class="link" data-action="shortcuts" type="button" data-i18n="changeShortcuts">${icon('crabLight')}</button>
`;

function markPressed(seg, value) {
  for (const btn of seg.querySelectorAll('button')) btn.setAttribute('aria-pressed', String(btn.dataset.value === value));
}

/** สร้างแผงการตั้งค่าลงใน container แล้วผูก event ทั้งหมด */
export async function renderSettings(container) {
  container.classList.add('settings-body');
  container.innerHTML = MARKUP;
  applyI18n(container);

  const langSeg = container.querySelector('[data-seg="lang"]');
  const themeSeg = container.querySelector('[data-seg="theme"]');
  langSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value]');
    if (btn) setLang(btn.dataset.value);
  });
  themeSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value]');
    if (btn) applyTheme(btn.dataset.value);
  });
  const sync = () => {
    markPressed(langSeg, getLang());
    markPressed(themeSeg, currentTheme());
  };
  document.addEventListener('langchange', sync);
  document.addEventListener('themechange', sync);
  // แท็บอื่นเปลี่ยนธีม/ภาษา
  window.addEventListener('storage', (e) => {
    if (e.key === 'ba-theme' && (e.newValue === 'dark' || e.newValue === 'light')) applyTheme(e.newValue);
    if (e.key === 'ba-lang' && e.newValue && e.newValue !== getLang()) setLang(e.newValue);
  });
  sync();

  container.querySelector('[data-action="shortcuts"]').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  const settings = await getSettings();
  for (const input of container.querySelectorAll('input')) {
    const key = input.name;
    if (input.type === 'checkbox') input.checked = Boolean(settings[key]);
    else input.value = settings[key];
    input.addEventListener('change', async () => {
      settings[key] = input.type === 'checkbox' ? input.checked : Math.max(0, Number(input.value) || 0);
      await saveSettings(settings);
    });
  }
}

/**
 * ปุ่มเฟืองที่เปิดแผงการตั้งค่าแบบลอย (หน้าภาพทั้งหมด / ผลลัพธ์)
 * ปิดเมื่อคลิกข้างนอกหรือกด Esc
 */
export async function setupSettingsPopover(button) {
  if (!button) return;
  button.innerHTML = icon('gear');
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-expanded', 'false');

  const pop = document.createElement('div');
  pop.className = 'settings-pop';
  pop.setAttribute('role', 'dialog');
  pop.hidden = true;
  const body = document.createElement('div');
  pop.append(body);
  button.after(pop);
  button.parentElement.classList.add('settings-anchor');
  await renderSettings(body);

  const open = (show) => {
    if (show) document.dispatchEvent(new Event('closemenus')); // เปิดอันนี้ = ปิดเมนูอื่นทั้งหมดก่อน
    pop.hidden = !show;
    button.setAttribute('aria-expanded', String(show));
    button.setAttribute('aria-pressed', String(show));
  };
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    open(pop.hidden);
  });
  document.addEventListener('click', (e) => {
    if (!pop.hidden && !pop.contains(e.target)) open(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !pop.hidden) {
      open(false);
      button.focus();
    }
  });
  // หน้าผลลัพธ์ส่งสัญญาณนี้ตอนกดคีย์ลัด
  document.addEventListener('closemenus', () => open(false));
}
