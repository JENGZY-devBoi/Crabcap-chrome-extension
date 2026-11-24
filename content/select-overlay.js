// Overlay สำหรับเลือกพื้นที่: ลากเพื่อเลือกพื้นที่, คลิกเพื่อเลือก element, Esc เพื่อยกเลิก
// ใช้ Shadow DOM เพื่อไม่ให้ CSS ของหน้าเว็บกระทบ overlay และกลับกัน
(() => {
  if (window.__baSelectActive) return;
  window.__baSelectActive = true;

  const DRAG_THRESHOLD = 5;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;cursor:crosshair;';
  const shadow = host.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .frame {
        position: fixed; pointer-events: none; display: none;
        border: 2px solid #FF7A3D; border-radius: 2px;
        box-shadow: 0 0 0 100vmax rgba(16, 24, 33, 0.38);
      }
      .frame.element { border-style: dashed; }
      .size {
        position: absolute; right: -2px; bottom: calc(100% + 6px);
        background: #1C2733; color: #fff; font: 500 12px/1 system-ui, sans-serif;
        padding: 5px 7px; border-radius: 4px; white-space: nowrap;
      }
      .hint {
        position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
        background: #1C2733; color: #F4F6F8; pointer-events: none;
        font: 14px/1.4 "IBM Plex Sans Thai", "Noto Sans Thai", "Leelawadee UI", system-ui, sans-serif;
        padding: 9px 14px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.25);
      }
      .hint kbd {
        font: inherit; font-size: 12px; padding: 1px 6px; margin: 0 2px;
        border: 1px solid #5B6877; border-radius: 4px;
      }
    </style>
    <div class="frame"><span class="size"></span></div>
    <div class="hint"></div>
  `;
  const frame = shadow.querySelector('.frame');
  const sizeLabel = shadow.querySelector('.size');
  const hint = shadow.querySelector('.hint');
  // ข้อความตามภาษาที่เลือก background ตั้งไว้ใน window.__baSelectHint ก่อนฉีดไฟล์นี้
  hint.innerHTML =
    window.__baSelectHint || 'Drag to select an area, or click to pick an element <kbd>Esc</kbd> cancel';

  let start = null;
  let dragging = false;
  let hovered = null;
  let lastPoint = { x: 0, y: 0 };

  function elementAt(x, y) {
    host.style.pointerEvents = 'none';
    const el = document.elementFromPoint(x, y);
    host.style.pointerEvents = '';
    return el && el !== document.documentElement && el !== document.body ? el : null;
  }

  function showFrame(rect, isElement) {
    frame.style.display = 'block';
    frame.classList.toggle('element', isElement);
    frame.style.left = `${rect.x}px`;
    frame.style.top = `${rect.y}px`;
    frame.style.width = `${rect.width}px`;
    frame.style.height = `${rect.height}px`;
    sizeLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    sizeLabel.style.bottom = rect.y < 30 ? 'auto' : '';
    sizeLabel.style.top = rect.y < 30 ? 'calc(100% + 6px)' : '';
  }

  function dragRect(a, b) {
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      width: Math.abs(a.x - b.x),
      height: Math.abs(a.y - b.y),
    };
  }

  function updateHover(x, y) {
    hovered = elementAt(x, y);
    if (hovered) showFrame(hovered.getBoundingClientRect(), true);
    else frame.style.display = 'none';
  }

  function onMove(e) {
    lastPoint = { x: e.clientX, y: e.clientY };
    if (start) {
      const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (dist > DRAG_THRESHOLD) dragging = true;
      if (dragging) {
        hint.style.display = 'none';
        showFrame(dragRect(start, lastPoint), false);
        return;
      }
    }
    updateHover(e.clientX, e.clientY);
  }

  function onDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    start = { x: e.clientX, y: e.clientY };
    dragging = false;
  }

  async function onUp(e) {
    if (e.button !== 0 || !start) return;
    e.preventDefault();
    if (dragging) {
      const rect = dragRect(start, { x: e.clientX, y: e.clientY });
      start = null;
      if (rect.width < 4 || rect.height < 4) return;
      await cleanup();
      chrome.runtime.sendMessage({ type: 'selection', kind: 'region', rect, innerWidth: window.innerWidth });
    } else if (hovered) {
      start = null;
      hovered.setAttribute('data-ba-capture-target', '');
      await cleanup();
      chrome.runtime.sendMessage({ type: 'selection', kind: 'element' });
    } else {
      start = null;
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
    }
  }

  // เลื่อนหน้าได้ระหว่างเลือก และกรอบต้องตามตำแหน่ง element ใหม่
  function onScroll() {
    if (!dragging) updateHover(lastPoint.x, lastPoint.y);
  }

  async function cleanup() {
    host.removeEventListener('mousemove', onMove, true);
    host.removeEventListener('mousedown', onDown, true);
    host.removeEventListener('mouseup', onUp, true);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('scroll', onScroll, true);
    host.remove();
    window.__baSelectActive = false;
    // รอให้ overlay หายไปจากจอจริงก่อนแคป ไม่อย่างนั้นกรอบจะติดไปในภาพ
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  host.addEventListener('mousemove', onMove, true);
  host.addEventListener('mousedown', onDown, true);
  host.addEventListener('mouseup', onUp, true);
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('scroll', onScroll, true);
  document.documentElement.appendChild(host);
})();
