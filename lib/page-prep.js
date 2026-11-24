// ฟังก์ชันในไฟล์นี้ถูกส่งเข้าไปรันในหน้าเว็บผ่าน chrome.scripting.executeScript({ func })
// Chrome จะ serialize เฉพาะตัวฟังก์ชัน จึงห้ามอ้างตัวแปรหรือ import จากนอกฟังก์ชัน
// helper ทุกตัวต้องประกาศไว้ข้างในฟังก์ชันเอง
//
// หลักการ: ไม่ reload หน้า ไม่เปลี่ยน URL แค่ "รอให้นิ่ง" แล้ว "แช่แข็ง" สถานะปัจจุบัน
// แล้วคืนค่าทุกอย่างกลับเหมือนเดิมหลังแคปเสร็จ

/**
 * เตรียมหน้าก่อนแคปทั้งหน้า
 * 1. หา scroll container ภายใน (เว็บแอปที่ scroll ใน div ไม่ใช่ window)
 * 2. เลื่อนผ่านทั้งหน้าเพื่อกระตุ้น lazy-load และ animation ที่เล่นเมื่อเลื่อนมาถึง
 * 3. กลับขึ้นบนสุด รอรูป ฟอนต์ animation และ DOM ให้นิ่ง
 * 4. หยุด transition/animation ที่เหลือ และล็อกความสูงที่อิง 100vh
 * 5. ขยาย scroll container ให้สูงเท่าเนื้อหา
 */
export async function preparePage(opts) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  // การ์ดความคืบหน้า (content/progress-overlay.js) อยู่ใน isolated world เดียวกัน
  const progress = window.__baProgress;
  // ข้อความตามภาษาที่ผู้ใช้เลือก ส่งมาจาก background (ฟังก์ชันนี้ import อะไรไม่ได้)
  const msg = opts.msg || {};
  const say = (key, fallback, params = {}) =>
    (msg[key] || fallback).replace(/\{(\w+)\}/g, (_, name) => (name in params ? params[name] : `{${name}}`));
  const report = (text, fraction) => progress?.update(text, fraction);
  const cancelled = () => Boolean(progress?.cancelled);

  const state = {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    styles: [],
    styleEl: null,
    container: null,
    containerScrollTop: 0,
    lazyImgs: [],
  };
  window.__baCaptureState = state;

  const setStyle = (el, prop, value) => {
    state.styles.push([el, prop, el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)]);
    el.style.setProperty(prop, value, 'important');
  };

  const vh = window.innerHeight;
  const root = document.scrollingElement || document.documentElement;
  const notes = [];

  // 1. scroll container ภายใน
  let container = null;
  if (opts.expandScrollContainer && root.scrollHeight <= vh + 2) {
    container = findScrollContainer();
    if (container) {
      state.container = container;
      state.containerScrollTop = container.scrollTop;
      notes.push(say('noteScrollContainer', 'Found an inner scroll area and expanded it to show all content'));
    }
  }
  const scroller = container || root;
  const scrollTo = (top) => scroller.scrollTo({ top, left: 0, behavior: 'instant' });

  // 2. เลื่อนผ่านทั้งหน้า
  if (opts.preloadScroll) {
    for (const img of document.querySelectorAll('img[loading="lazy"]')) {
      img.loading = 'eager';
      state.lazyImgs.push(img);
    }
    const viewH = container ? container.clientHeight : vh;
    const step = Math.max(200, Math.floor(viewH * 0.8));
    const deadline = Date.now() + (opts.preloadTimeout ?? 15000);
    let pos = 0;
    scrollTo(0);
    report(say('stepScroll', 'Scrolling to load everything'), 0);
    await sleep(opts.scrollDelay ?? 150);
    while (Date.now() < deadline) {
      if (cancelled()) return { cancelled: true, notes };
      const max = scroller.scrollHeight - viewH;
      if (pos >= max) break;
      pos = Math.min(pos + step, max);
      scrollTo(pos);
      const fraction = pos / Math.max(1, max);
      report(say('stepScrollPct', 'Scrolling to load everything {pct}%', { pct: Math.round(fraction * 100) }), fraction);
      await sleep(opts.scrollDelay ?? 150);
    }
    if (Date.now() >= deadline) notes.push(say('noteScrollTimeout', 'The page is very long, so not everything loaded in time'));
    await sleep(250);
  }

  // 3. กลับบนสุดแล้วรอให้นิ่ง
  scrollTo(0);
  if (container) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

  if (cancelled()) return { cancelled: true, notes };
  report(say('stepImages', 'Waiting for images and fonts'), null);
  await waitForImages(3000);
  if (document.fonts) await Promise.race([document.fonts.ready, sleep(2000)]);
  if (cancelled()) return { cancelled: true, notes };
  if (opts.waitAnimations) {
    report(say('stepAnimations', 'Waiting for animations to finish'), null);
    await waitForAnimations(opts.animationTimeout ?? 4000);
  }
  report(say('stepSettle', 'Waiting for the page to settle'), null);
  await waitForDomQuiet(400, 3000);
  if (cancelled()) return { cancelled: true, notes };
  report(say('stepShoot', 'Taking the picture'), null);

  // 4. แช่แข็ง
  if (opts.freezeAnimations) {
    const style = document.createElement('style');
    style.setAttribute('data-ba-capture', '');
    style.textContent =
      '*,*::before,*::after{transition:none!important;animation-play-state:paused!important;' +
      'caret-color:transparent!important;scroll-behavior:auto!important}';
    (document.head || document.documentElement).appendChild(style);
    state.styleEl = style;
  }
  if (opts.freezeViewportUnits) freezeViewportHeights();

  // 5. ขยาย container (ต้องทำหลังข้อ 4 เพื่อให้ค่าที่ตั้งตรงนี้ชนะ)
  if (container) expandContainer(container);

  await frames();

  return {
    clientWidth: document.documentElement.clientWidth,
    dpr: window.devicePixelRatio,
    expanded: Boolean(container),
    notes,
  };

  // ---------- helpers ----------

  function findScrollContainer() {
    let best = null;
    let bestArea = 0;
    for (const el of document.querySelectorAll('body *')) {
      if (el.scrollHeight <= el.clientHeight + 2) continue;
      const cs = getComputedStyle(el);
      if (!/(auto|scroll|overlay)/.test(cs.overflowY)) continue;
      const r = el.getBoundingClientRect();
      const area = r.width * r.height;
      if (r.width >= window.innerWidth * 0.4 && area > bestArea) {
        best = el;
        bestArea = area;
      }
    }
    return best;
  }

  function waitForImages(timeout) {
    const pending = [...document.images].filter((img) => !img.complete);
    if (!pending.length) return Promise.resolve();
    const loaded = pending.map(
      (img) =>
        new Promise((r) => {
          img.addEventListener('load', r, { once: true });
          img.addEventListener('error', r, { once: true });
        }),
    );
    return Promise.race([Promise.all(loaded), sleep(timeout)]);
  }

  // รอ CSS animation / transition / Web Animations ที่ไม่ใช่แบบวนไม่รู้จบให้เล่นจบ
  function waitForAnimations(timeout) {
    const running = document.getAnimations().filter((a) => {
      if (a.playState !== 'running') return false;
      const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      return t && t.iterations !== Infinity && Number.isFinite(t.endTime);
    });
    if (!running.length) return Promise.resolve();
    return Promise.race([Promise.allSettled(running.map((a) => a.finished)), sleep(timeout)]);
  }

  // รอจน DOM ไม่เปลี่ยนแปลงต่อเนื่อง quiet ms (ครอบคลุม animation ที่เขียนด้วย JS บางส่วน)
  function waitForDomQuiet(quiet, max) {
    return new Promise((resolve) => {
      let timer;
      const finish = () => {
        observer.disconnect();
        clearTimeout(timer);
        clearTimeout(cap);
        resolve();
      };
      const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(finish, quiet);
      });
      observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
      timer = setTimeout(finish, quiet);
      const cap = setTimeout(finish, max);
    });
  }

  // ตอนแคปทั้งหน้า viewport จะถูกขยายเป็นความสูงของทั้งหน้า
  // element ที่สูง 100vh (เช่น hero section) จะยืดตามจนภาพเพี้ยน จึงล็อกเป็น px ไว้ก่อน
  function freezeViewportHeights() {
    const near = (v) => Math.abs(v - vh) <= 2;
    for (const el of document.querySelectorAll('html, body, body *')) {
      if (!(el instanceof HTMLElement)) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.display === 'none' || cs.display === 'inline') continue;
      const h = el.getBoundingClientRect().height;
      if (near(h)) setStyle(el, 'height', `${h}px`);
      const minH = parseFloat(cs.minHeight);
      if (near(minH)) setStyle(el, 'min-height', `${minH}px`);
      const maxH = parseFloat(cs.maxHeight);
      if (near(maxH)) setStyle(el, 'max-height', `${maxH}px`);
    }
  }

  function isColumnFlexChild(el) {
    const p = el.parentElement;
    if (!p) return false;
    const cs = getComputedStyle(p);
    return cs.display.includes('flex') && cs.flexDirection.startsWith('column');
  }

  function expandContainer(c) {
    c.scrollTop = 0;
    const fullHeight = c.scrollHeight;
    setStyle(c, 'height', `${fullHeight}px`);
    setStyle(c, 'max-height', 'none');
    setStyle(c, 'overflow', 'visible');
    if (isColumnFlexChild(c)) setStyle(c, 'flex', '0 0 auto');

    let el = c.parentElement;
    while (el) {
      const cs = getComputedStyle(el);
      setStyle(el, 'height', 'auto');
      setStyle(el, 'max-height', 'none');
      setStyle(el, 'overflow', 'visible');
      if (cs.position === 'fixed') {
        setStyle(el, 'position', 'absolute');
        setStyle(el, 'bottom', 'auto');
      }
      if (isColumnFlexChild(el)) setStyle(el, 'flex', '0 0 auto');
      el = el.parentElement;
    }
  }
}

/** เรียกหลังเปลี่ยนขนาด viewport เพื่อรอให้ layout และ JS ที่ตอบสนองต่อ resize นิ่ง */
export async function settlePage(delay) {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((resolve) => {
    let timer;
    const finish = () => {
      observer.disconnect();
      clearTimeout(timer);
      clearTimeout(cap);
      resolve();
    };
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(finish, 300);
    });
    observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
    timer = setTimeout(finish, 300);
    const cap = setTimeout(finish, 2000);
  });
  await new Promise((r) => setTimeout(r, delay || 0));
}

/** คืนค่าหน้าเว็บกลับเหมือนก่อนแคป (style, ตำแหน่ง scroll, lazy-load) */
export function restorePage() {
  const s = window.__baCaptureState;
  if (!s) return false;
  if (s.styleEl) s.styleEl.remove();
  for (let i = s.styles.length - 1; i >= 0; i -= 1) {
    const [el, prop, value, priority] = s.styles[i];
    if (value) el.style.setProperty(prop, value, priority);
    else el.style.removeProperty(prop);
  }
  for (const img of s.lazyImgs) img.loading = 'lazy';
  if (s.container) s.container.scrollTop = s.containerScrollTop;
  window.scrollTo({ top: s.scrollY, left: s.scrollX, behavior: 'instant' });
  delete window.__baCaptureState;
  return true;
}

/** ใช้ตอนเลือก element: หา element ที่ overlay ทำเครื่องหมายไว้ แล้วคืนตำแหน่งในพิกัดของทั้งเอกสาร */
export function locateMarkedElement() {
  const el = document.querySelector('[data-ba-capture-target]');
  if (!el) return null;
  el.removeAttribute('data-ba-capture-target');
  const r = el.getBoundingClientRect();
  return {
    x: r.left + window.scrollX,
    y: r.top + window.scrollY,
    width: r.width,
    height: r.height,
  };
}
