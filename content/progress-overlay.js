// การ์ดแสดงความคืบหน้าระหว่างแคปทั้งหน้า และแสดงข้อผิดพลาด
// background ฉีดไฟล์นี้แล้วสั่งผ่าน window.__baProgress (isolated world เดียวกับ page-prep)
// ต้องเอาออกจากหน้าก่อนเริ่มถ่ายภาพจริงทุกครั้ง ไม่อย่างนั้นจะติดไปในภาพ
(() => {
  if (window.__baProgress) return;

  let host = null;
  let parts = null;
  let hideTimer = null;
  // background ส่งข้อความตามภาษาที่เลือกมาให้ผ่าน setLabels()
  let labels = {
    progressTitle: 'The crab is capturing the page…',
    errorTitle: 'Oops, the capture failed',
    cancelling: 'Cancelling and restoring the page…',
    cancel: 'Cancel',
    close: 'Close',
  };

  const api = {
    cancelled: false,

    setLabels(next) {
      labels = { ...labels, ...next };
      if (parts) {
        parts.cancelText.textContent = labels.cancel;
        parts.close.setAttribute('aria-label', labels.close);
      }
    },

    /** แสดงหรืออัปเดตข้อความ fraction = 0..1 หรือ null ถ้าไม่รู้ความคืบหน้า */
    update(text, fraction = null, { cancellable = true } = {}) {
      mount();
      clearTimeout(hideTimer);
      host.dataset.state = 'busy';
      parts.title.textContent = labels.progressTitle;
      parts.text.textContent = text;
      parts.bar.classList.toggle('indeterminate', fraction == null);
      const pct = fraction == null ? '' : `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;
      parts.fill.style.width = pct;
      parts.runner.style.left = pct;
      parts.cancel.hidden = !cancellable;
      parts.close.hidden = true;
    },

    error(message) {
      mount();
      clearTimeout(hideTimer);
      host.dataset.state = 'error';
      parts.title.textContent = labels.errorTitle;
      parts.text.textContent = message;
      parts.cancel.hidden = true;
      parts.close.hidden = false;
      hideTimer = setTimeout(api.remove, 8000);
    },

    /** เอาออกจากหน้า แล้วรอ 2 เฟรมให้หายจากจอจริง */
    async remove() {
      clearTimeout(hideTimer);
      if (host) {
        host.remove();
        host = null;
        parts = null;
      }
      window.removeEventListener('keydown', onKey, true);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    },

    reset() {
      api.cancelled = false;
    },
  };

  function onKey(e) {
    if (e.key === 'Escape' && host?.dataset.state === 'busy' && !parts.cancel.hidden) {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    } else if (e.key === 'Escape' && host?.dataset.state === 'error') {
      api.remove();
    }
  }

  function cancel() {
    api.cancelled = true;
    parts.text.textContent = labels.cancelling;
    parts.cancel.disabled = true;
  }

  function mount() {
    if (host) return;
    host = document.createElement('div');
    host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;';
    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .card {
          width: 300px; box-sizing: border-box;
          background: #202126; color: #ECECF1;
          border: 1px solid rgba(255,255,255,.09); border-bottom: 2px solid #FF7A3D;
          padding: 12px 14px 14px;
          box-shadow: 0 8px 30px rgba(0,0,0,.35);
          font: 13px/1.45 "IBM Plex Sans Thai", -apple-system, "Noto Sans Thai", "Leelawadee UI", system-ui, sans-serif;
          animation: pop .2s ease-out;
        }
        @keyframes pop { from { opacity: 0; transform: translateY(-6px); } }
        :host([data-state="error"]) .card { border-bottom-color: #F87171; }
        .head { display: flex; align-items: center; gap: 8px; }
        .head .mascot { width: 39px; height: 30px; flex: none; }
        :host([data-state="error"]) .head .mascot { animation: shake .35s ease-in-out 2; }
        @keyframes shake { 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
        .title { font-weight: 650; flex: 1; }
        .text { margin: 6px 0 12px; color: #98A0AE; }
        .bar {
          position: relative; height: 10px;
          background: repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 8px, transparent 8px 10px);
        }
        :host([data-state="error"]) .bar { display: none; }
        :host([data-state="error"]) .text { margin-bottom: 0; }
        .fill {
          height: 100%; width: 0; transition: width .25s;
          background: repeating-linear-gradient(90deg, #FF7A3D 0 8px, transparent 8px 10px);
        }
        .runner { position: absolute; top: 50%; width: 26px; height: 20px; margin: -14px 0 0 -10px; left: 0; transition: left .25s; }
        .runner svg { width: 100%; height: 100%; display: block; }
        .indeterminate .fill { width: 30% !important; animation: slide 1.3s ease-in-out infinite alternate; }
        .indeterminate .runner { animation: run 1.3s ease-in-out infinite alternate; }
        @keyframes slide { from { margin-left: 0; } to { margin-left: 70%; } }
        @keyframes run { from { left: 30%; } to { left: 100%; } }
        button {
          all: unset; cursor: pointer; font-size: 12px; color: #98A0AE;
          padding: 2px 8px; border: 1px solid rgba(255,255,255,.09); background: rgba(255,255,255,.04);
        }
        button:hover { background: rgba(255,122,61,.14); border-color: rgba(255,122,61,.5); color: #FF7A3D; }
        button:focus-visible { outline: 2px solid #FF7A3D; }
        button:disabled { opacity: .5; cursor: default; }
        kbd { font: inherit; font-size: 10px; border: 1px solid rgba(255,255,255,.18); padding: 0 4px; margin-left: 6px; }
        [hidden] { display: none !important; }
        @media (prefers-reduced-motion: reduce) { .card, .fill, .runner, .mascot, .indeterminate .fill, .indeterminate .runner { animation: none !important; transition: none !important; } }
      </style>
      <div class="card" role="status" aria-live="polite">
        <div class="head">
          <svg class="mascot" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 20" shape-rendering="crispEdges"><rect x="8" y="0" width="3" height="1" fill="#4a1208"/><rect x="15" y="0" width="3" height="1" fill="#4a1208"/><rect x="7" y="1" width="1" height="1" fill="#4a1208"/><rect x="8" y="1" width="3" height="1" fill="#ffffff"/><rect x="11" y="1" width="1" height="1" fill="#4a1208"/><rect x="14" y="1" width="1" height="1" fill="#4a1208"/><rect x="15" y="1" width="3" height="1" fill="#ffffff"/><rect x="18" y="1" width="1" height="1" fill="#4a1208"/><rect x="7" y="2" width="1" height="1" fill="#4a1208"/><rect x="8" y="2" width="1" height="1" fill="#ffffff"/><rect x="9" y="2" width="1" height="1" fill="#14151a"/><rect x="10" y="2" width="1" height="1" fill="#ffffff"/><rect x="11" y="2" width="1" height="1" fill="#4a1208"/><rect x="14" y="2" width="1" height="1" fill="#4a1208"/><rect x="15" y="2" width="1" height="1" fill="#ffffff"/><rect x="16" y="2" width="1" height="1" fill="#14151a"/><rect x="17" y="2" width="1" height="1" fill="#ffffff"/><rect x="18" y="2" width="1" height="1" fill="#4a1208"/><rect x="7" y="3" width="1" height="1" fill="#4a1208"/><rect x="8" y="3" width="1" height="1" fill="#ffffff"/><rect x="9" y="3" width="1" height="1" fill="#14151a"/><rect x="10" y="3" width="1" height="1" fill="#ffffff"/><rect x="11" y="3" width="1" height="1" fill="#4a1208"/><rect x="14" y="3" width="1" height="1" fill="#4a1208"/><rect x="15" y="3" width="1" height="1" fill="#ffffff"/><rect x="16" y="3" width="1" height="1" fill="#14151a"/><rect x="17" y="3" width="1" height="1" fill="#ffffff"/><rect x="18" y="3" width="1" height="1" fill="#4a1208"/><rect x="8" y="4" width="1" height="1" fill="#4a1208"/><rect x="9" y="4" width="1" height="1" fill="#ff5a36"/><rect x="10" y="4" width="1" height="1" fill="#4a1208"/><rect x="15" y="4" width="1" height="1" fill="#4a1208"/><rect x="16" y="4" width="1" height="1" fill="#ff5a36"/><rect x="17" y="4" width="1" height="1" fill="#4a1208"/><rect x="8" y="5" width="1" height="1" fill="#4a1208"/><rect x="9" y="5" width="1" height="1" fill="#ff5a36"/><rect x="10" y="5" width="1" height="1" fill="#4a1208"/><rect x="15" y="5" width="1" height="1" fill="#4a1208"/><rect x="16" y="5" width="1" height="1" fill="#ff5a36"/><rect x="17" y="5" width="1" height="1" fill="#4a1208"/><rect x="8" y="6" width="1" height="1" fill="#4a1208"/><rect x="9" y="6" width="1" height="1" fill="#ff5a36"/><rect x="10" y="6" width="6" height="1" fill="#4a1208"/><rect x="16" y="6" width="1" height="1" fill="#ff5a36"/><rect x="17" y="6" width="1" height="1" fill="#4a1208"/><rect x="2" y="7" width="3" height="1" fill="#4a1208"/><rect x="6" y="7" width="2" height="1" fill="#4a1208"/><rect x="8" y="7" width="1" height="1" fill="#ff8f66"/><rect x="9" y="7" width="1" height="1" fill="#4a1208"/><rect x="10" y="7" width="2" height="1" fill="#ff8f66"/><rect x="12" y="7" width="2" height="1" fill="#ffb08f"/><rect x="14" y="7" width="2" height="1" fill="#ff8f66"/><rect x="16" y="7" width="1" height="1" fill="#4a1208"/><rect x="17" y="7" width="1" height="1" fill="#ff8f66"/><rect x="18" y="7" width="2" height="1" fill="#4a1208"/><rect x="21" y="7" width="3" height="1" fill="#4a1208"/><rect x="1" y="8" width="1" height="1" fill="#4a1208"/><rect x="2" y="8" width="3" height="1" fill="#ff8f66"/><rect x="5" y="8" width="1" height="1" fill="#4a1208"/><rect x="6" y="8" width="2" height="1" fill="#ff8f66"/><rect x="8" y="8" width="1" height="1" fill="#ffb08f"/><rect x="9" y="8" width="3" height="1" fill="#4a1208"/><rect x="12" y="8" width="5" height="1" fill="#ff5a36"/><rect x="17" y="8" width="1" height="1" fill="#ffb08f"/><rect x="18" y="8" width="2" height="1" fill="#ff8f66"/><rect x="20" y="8" width="1" height="1" fill="#4a1208"/><rect x="21" y="8" width="3" height="1" fill="#ff8f66"/><rect x="24" y="8" width="1" height="1" fill="#4a1208"/><rect x="0" y="9" width="1" height="1" fill="#4a1208"/><rect x="1" y="9" width="1" height="1" fill="#ff8f66"/><rect x="2" y="9" width="3" height="1" fill="#ff5a36"/><rect x="5" y="9" width="1" height="1" fill="#ff8f66"/><rect x="6" y="9" width="3" height="1" fill="#4a1208"/><rect x="9" y="9" width="3" height="1" fill="#565b68"/><rect x="12" y="9" width="4" height="1" fill="#4a1208"/><rect x="16" y="9" width="2" height="1" fill="#ffd23f"/><rect x="18" y="9" width="2" height="1" fill="#4a1208"/><rect x="20" y="9" width="1" height="1" fill="#ff8f66"/><rect x="21" y="9" width="3" height="1" fill="#ff5a36"/><rect x="24" y="9" width="1" height="1" fill="#ff8f66"/><rect x="25" y="9" width="1" height="1" fill="#4a1208"/><rect x="0" y="10" width="1" height="1" fill="#4a1208"/><rect x="1" y="10" width="3" height="1" fill="#ff5a36"/><rect x="4" y="10" width="2" height="1" fill="#d63a1f"/><rect x="6" y="10" width="1" height="1" fill="#ff8f66"/><rect x="7" y="10" width="1" height="1" fill="#4a1208"/><rect x="8" y="10" width="10" height="1" fill="#565b68"/><rect x="18" y="10" width="1" height="1" fill="#4a1208"/><rect x="19" y="10" width="1" height="1" fill="#ff8f66"/><rect x="20" y="10" width="2" height="1" fill="#d63a1f"/><rect x="22" y="10" width="3" height="1" fill="#ff5a36"/><rect x="25" y="10" width="1" height="1" fill="#4a1208"/><rect x="0" y="11" width="1" height="1" fill="#4a1208"/><rect x="1" y="11" width="3" height="1" fill="#ff5a36"/><rect x="4" y="11" width="3" height="1" fill="#4a1208"/><rect x="7" y="11" width="5" height="1" fill="#3b3f4a"/><rect x="12" y="11" width="2" height="1" fill="#16171c"/><rect x="14" y="11" width="2" height="1" fill="#3b3f4a"/><rect x="16" y="11" width="2" height="1" fill="#fff3b0"/><rect x="18" y="11" width="1" height="1" fill="#3b3f4a"/><rect x="19" y="11" width="3" height="1" fill="#4a1208"/><rect x="22" y="11" width="3" height="1" fill="#ff5a36"/><rect x="25" y="11" width="1" height="1" fill="#4a1208"/><rect x="0" y="12" width="1" height="1" fill="#4a1208"/><rect x="1" y="12" width="1" height="1" fill="#d63a1f"/><rect x="2" y="12" width="2" height="1" fill="#ff5a36"/><rect x="4" y="12" width="3" height="1" fill="#ff8f66"/><rect x="7" y="12" width="1" height="1" fill="#4a1208"/><rect x="8" y="12" width="3" height="1" fill="#3b3f4a"/><rect x="11" y="12" width="1" height="1" fill="#16171c"/><rect x="12" y="12" width="1" height="1" fill="#ffffff"/><rect x="13" y="12" width="1" height="1" fill="#3d8bff"/><rect x="14" y="12" width="1" height="1" fill="#16171c"/><rect x="15" y="12" width="3" height="1" fill="#3b3f4a"/><rect x="18" y="12" width="1" height="1" fill="#4a1208"/><rect x="19" y="12" width="3" height="1" fill="#ff8f66"/><rect x="22" y="12" width="2" height="1" fill="#ff5a36"/><rect x="24" y="12" width="1" height="1" fill="#d63a1f"/><rect x="25" y="12" width="1" height="1" fill="#4a1208"/><rect x="1" y="13" width="1" height="1" fill="#4a1208"/><rect x="2" y="13" width="4" height="1" fill="#d63a1f"/><rect x="6" y="13" width="1" height="1" fill="#4a1208"/><rect x="7" y="13" width="4" height="1" fill="#3b3f4a"/><rect x="11" y="13" width="1" height="1" fill="#16171c"/><rect x="12" y="13" width="2" height="1" fill="#3d8bff"/><rect x="14" y="13" width="1" height="1" fill="#16171c"/><rect x="15" y="13" width="4" height="1" fill="#3b3f4a"/><rect x="19" y="13" width="1" height="1" fill="#4a1208"/><rect x="20" y="13" width="4" height="1" fill="#d63a1f"/><rect x="24" y="13" width="1" height="1" fill="#4a1208"/><rect x="2" y="14" width="5" height="1" fill="#4a1208"/><rect x="7" y="14" width="5" height="1" fill="#3b3f4a"/><rect x="12" y="14" width="2" height="1" fill="#16171c"/><rect x="14" y="14" width="5" height="1" fill="#3b3f4a"/><rect x="19" y="14" width="5" height="1" fill="#4a1208"/><rect x="4" y="15" width="1" height="1" fill="#4a1208"/><rect x="5" y="15" width="1" height="1" fill="#ff5a36"/><rect x="6" y="15" width="1" height="1" fill="#4a1208"/><rect x="7" y="15" width="12" height="1" fill="#3b3f4a"/><rect x="19" y="15" width="1" height="1" fill="#4a1208"/><rect x="20" y="15" width="1" height="1" fill="#ff5a36"/><rect x="21" y="15" width="1" height="1" fill="#4a1208"/><rect x="4" y="16" width="1" height="1" fill="#4a1208"/><rect x="5" y="16" width="1" height="1" fill="#ff5a36"/><rect x="6" y="16" width="14" height="1" fill="#4a1208"/><rect x="20" y="16" width="1" height="1" fill="#ff5a36"/><rect x="21" y="16" width="1" height="1" fill="#4a1208"/><rect x="4" y="17" width="1" height="1" fill="#4a1208"/><rect x="5" y="17" width="1" height="1" fill="#d63a1f"/><rect x="6" y="17" width="1" height="1" fill="#4a1208"/><rect x="7" y="17" width="1" height="1" fill="#d63a1f"/><rect x="8" y="17" width="1" height="1" fill="#4a1208"/><rect x="17" y="17" width="1" height="1" fill="#4a1208"/><rect x="18" y="17" width="1" height="1" fill="#d63a1f"/><rect x="19" y="17" width="1" height="1" fill="#4a1208"/><rect x="20" y="17" width="1" height="1" fill="#d63a1f"/><rect x="21" y="17" width="1" height="1" fill="#4a1208"/><rect x="5" y="18" width="1" height="1" fill="#4a1208"/><rect x="7" y="18" width="1" height="1" fill="#4a1208"/><rect x="18" y="18" width="1" height="1" fill="#4a1208"/><rect x="20" y="18" width="1" height="1" fill="#4a1208"/></svg>
          <span class="title"></span>
          <button class="cancel" type="button"><span class="cancel-text"></span></button>
          <button class="close" type="button" hidden>✕</button>
        </div>
        <p class="text"></p>
        <div class="bar"><div class="fill"></div><span class="runner"><svg class="mini" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 20" shape-rendering="crispEdges"><rect x="8" y="0" width="3" height="1" fill="#4a1208"/><rect x="15" y="0" width="3" height="1" fill="#4a1208"/><rect x="7" y="1" width="1" height="1" fill="#4a1208"/><rect x="8" y="1" width="3" height="1" fill="#ffffff"/><rect x="11" y="1" width="1" height="1" fill="#4a1208"/><rect x="14" y="1" width="1" height="1" fill="#4a1208"/><rect x="15" y="1" width="3" height="1" fill="#ffffff"/><rect x="18" y="1" width="1" height="1" fill="#4a1208"/><rect x="7" y="2" width="1" height="1" fill="#4a1208"/><rect x="8" y="2" width="1" height="1" fill="#ffffff"/><rect x="9" y="2" width="1" height="1" fill="#14151a"/><rect x="10" y="2" width="1" height="1" fill="#ffffff"/><rect x="11" y="2" width="1" height="1" fill="#4a1208"/><rect x="14" y="2" width="1" height="1" fill="#4a1208"/><rect x="15" y="2" width="1" height="1" fill="#ffffff"/><rect x="16" y="2" width="1" height="1" fill="#14151a"/><rect x="17" y="2" width="1" height="1" fill="#ffffff"/><rect x="18" y="2" width="1" height="1" fill="#4a1208"/><rect x="7" y="3" width="1" height="1" fill="#4a1208"/><rect x="8" y="3" width="1" height="1" fill="#ffffff"/><rect x="9" y="3" width="1" height="1" fill="#14151a"/><rect x="10" y="3" width="1" height="1" fill="#ffffff"/><rect x="11" y="3" width="1" height="1" fill="#4a1208"/><rect x="14" y="3" width="1" height="1" fill="#4a1208"/><rect x="15" y="3" width="1" height="1" fill="#ffffff"/><rect x="16" y="3" width="1" height="1" fill="#14151a"/><rect x="17" y="3" width="1" height="1" fill="#ffffff"/><rect x="18" y="3" width="1" height="1" fill="#4a1208"/><rect x="8" y="4" width="1" height="1" fill="#4a1208"/><rect x="9" y="4" width="1" height="1" fill="#ff5a36"/><rect x="10" y="4" width="1" height="1" fill="#4a1208"/><rect x="15" y="4" width="1" height="1" fill="#4a1208"/><rect x="16" y="4" width="1" height="1" fill="#ff5a36"/><rect x="17" y="4" width="1" height="1" fill="#4a1208"/><rect x="8" y="5" width="1" height="1" fill="#4a1208"/><rect x="9" y="5" width="1" height="1" fill="#ff5a36"/><rect x="10" y="5" width="1" height="1" fill="#4a1208"/><rect x="15" y="5" width="1" height="1" fill="#4a1208"/><rect x="16" y="5" width="1" height="1" fill="#ff5a36"/><rect x="17" y="5" width="1" height="1" fill="#4a1208"/><rect x="8" y="6" width="1" height="1" fill="#4a1208"/><rect x="9" y="6" width="1" height="1" fill="#ff5a36"/><rect x="10" y="6" width="6" height="1" fill="#4a1208"/><rect x="16" y="6" width="1" height="1" fill="#ff5a36"/><rect x="17" y="6" width="1" height="1" fill="#4a1208"/><rect x="2" y="7" width="3" height="1" fill="#4a1208"/><rect x="6" y="7" width="2" height="1" fill="#4a1208"/><rect x="8" y="7" width="1" height="1" fill="#ff8f66"/><rect x="9" y="7" width="1" height="1" fill="#4a1208"/><rect x="10" y="7" width="2" height="1" fill="#ff8f66"/><rect x="12" y="7" width="2" height="1" fill="#ffb08f"/><rect x="14" y="7" width="2" height="1" fill="#ff8f66"/><rect x="16" y="7" width="1" height="1" fill="#4a1208"/><rect x="17" y="7" width="1" height="1" fill="#ff8f66"/><rect x="18" y="7" width="2" height="1" fill="#4a1208"/><rect x="21" y="7" width="3" height="1" fill="#4a1208"/><rect x="1" y="8" width="1" height="1" fill="#4a1208"/><rect x="2" y="8" width="3" height="1" fill="#ff8f66"/><rect x="5" y="8" width="1" height="1" fill="#4a1208"/><rect x="6" y="8" width="2" height="1" fill="#ff8f66"/><rect x="8" y="8" width="1" height="1" fill="#ffb08f"/><rect x="9" y="8" width="3" height="1" fill="#4a1208"/><rect x="12" y="8" width="5" height="1" fill="#ff5a36"/><rect x="17" y="8" width="1" height="1" fill="#ffb08f"/><rect x="18" y="8" width="2" height="1" fill="#ff8f66"/><rect x="20" y="8" width="1" height="1" fill="#4a1208"/><rect x="21" y="8" width="3" height="1" fill="#ff8f66"/><rect x="24" y="8" width="1" height="1" fill="#4a1208"/><rect x="0" y="9" width="1" height="1" fill="#4a1208"/><rect x="1" y="9" width="1" height="1" fill="#ff8f66"/><rect x="2" y="9" width="3" height="1" fill="#ff5a36"/><rect x="5" y="9" width="1" height="1" fill="#ff8f66"/><rect x="6" y="9" width="3" height="1" fill="#4a1208"/><rect x="9" y="9" width="3" height="1" fill="#565b68"/><rect x="12" y="9" width="4" height="1" fill="#4a1208"/><rect x="16" y="9" width="2" height="1" fill="#ffd23f"/><rect x="18" y="9" width="2" height="1" fill="#4a1208"/><rect x="20" y="9" width="1" height="1" fill="#ff8f66"/><rect x="21" y="9" width="3" height="1" fill="#ff5a36"/><rect x="24" y="9" width="1" height="1" fill="#ff8f66"/><rect x="25" y="9" width="1" height="1" fill="#4a1208"/><rect x="0" y="10" width="1" height="1" fill="#4a1208"/><rect x="1" y="10" width="3" height="1" fill="#ff5a36"/><rect x="4" y="10" width="2" height="1" fill="#d63a1f"/><rect x="6" y="10" width="1" height="1" fill="#ff8f66"/><rect x="7" y="10" width="1" height="1" fill="#4a1208"/><rect x="8" y="10" width="10" height="1" fill="#565b68"/><rect x="18" y="10" width="1" height="1" fill="#4a1208"/><rect x="19" y="10" width="1" height="1" fill="#ff8f66"/><rect x="20" y="10" width="2" height="1" fill="#d63a1f"/><rect x="22" y="10" width="3" height="1" fill="#ff5a36"/><rect x="25" y="10" width="1" height="1" fill="#4a1208"/><rect x="0" y="11" width="1" height="1" fill="#4a1208"/><rect x="1" y="11" width="3" height="1" fill="#ff5a36"/><rect x="4" y="11" width="3" height="1" fill="#4a1208"/><rect x="7" y="11" width="5" height="1" fill="#3b3f4a"/><rect x="12" y="11" width="2" height="1" fill="#16171c"/><rect x="14" y="11" width="2" height="1" fill="#3b3f4a"/><rect x="16" y="11" width="2" height="1" fill="#fff3b0"/><rect x="18" y="11" width="1" height="1" fill="#3b3f4a"/><rect x="19" y="11" width="3" height="1" fill="#4a1208"/><rect x="22" y="11" width="3" height="1" fill="#ff5a36"/><rect x="25" y="11" width="1" height="1" fill="#4a1208"/><rect x="0" y="12" width="1" height="1" fill="#4a1208"/><rect x="1" y="12" width="1" height="1" fill="#d63a1f"/><rect x="2" y="12" width="2" height="1" fill="#ff5a36"/><rect x="4" y="12" width="3" height="1" fill="#ff8f66"/><rect x="7" y="12" width="1" height="1" fill="#4a1208"/><rect x="8" y="12" width="3" height="1" fill="#3b3f4a"/><rect x="11" y="12" width="1" height="1" fill="#16171c"/><rect x="12" y="12" width="1" height="1" fill="#ffffff"/><rect x="13" y="12" width="1" height="1" fill="#3d8bff"/><rect x="14" y="12" width="1" height="1" fill="#16171c"/><rect x="15" y="12" width="3" height="1" fill="#3b3f4a"/><rect x="18" y="12" width="1" height="1" fill="#4a1208"/><rect x="19" y="12" width="3" height="1" fill="#ff8f66"/><rect x="22" y="12" width="2" height="1" fill="#ff5a36"/><rect x="24" y="12" width="1" height="1" fill="#d63a1f"/><rect x="25" y="12" width="1" height="1" fill="#4a1208"/><rect x="1" y="13" width="1" height="1" fill="#4a1208"/><rect x="2" y="13" width="4" height="1" fill="#d63a1f"/><rect x="6" y="13" width="1" height="1" fill="#4a1208"/><rect x="7" y="13" width="4" height="1" fill="#3b3f4a"/><rect x="11" y="13" width="1" height="1" fill="#16171c"/><rect x="12" y="13" width="2" height="1" fill="#3d8bff"/><rect x="14" y="13" width="1" height="1" fill="#16171c"/><rect x="15" y="13" width="4" height="1" fill="#3b3f4a"/><rect x="19" y="13" width="1" height="1" fill="#4a1208"/><rect x="20" y="13" width="4" height="1" fill="#d63a1f"/><rect x="24" y="13" width="1" height="1" fill="#4a1208"/><rect x="2" y="14" width="5" height="1" fill="#4a1208"/><rect x="7" y="14" width="5" height="1" fill="#3b3f4a"/><rect x="12" y="14" width="2" height="1" fill="#16171c"/><rect x="14" y="14" width="5" height="1" fill="#3b3f4a"/><rect x="19" y="14" width="5" height="1" fill="#4a1208"/><rect x="4" y="15" width="1" height="1" fill="#4a1208"/><rect x="5" y="15" width="1" height="1" fill="#ff5a36"/><rect x="6" y="15" width="1" height="1" fill="#4a1208"/><rect x="7" y="15" width="12" height="1" fill="#3b3f4a"/><rect x="19" y="15" width="1" height="1" fill="#4a1208"/><rect x="20" y="15" width="1" height="1" fill="#ff5a36"/><rect x="21" y="15" width="1" height="1" fill="#4a1208"/><rect x="4" y="16" width="1" height="1" fill="#4a1208"/><rect x="5" y="16" width="1" height="1" fill="#ff5a36"/><rect x="6" y="16" width="14" height="1" fill="#4a1208"/><rect x="20" y="16" width="1" height="1" fill="#ff5a36"/><rect x="21" y="16" width="1" height="1" fill="#4a1208"/><rect x="4" y="17" width="1" height="1" fill="#4a1208"/><rect x="5" y="17" width="1" height="1" fill="#d63a1f"/><rect x="6" y="17" width="1" height="1" fill="#4a1208"/><rect x="7" y="17" width="1" height="1" fill="#d63a1f"/><rect x="8" y="17" width="1" height="1" fill="#4a1208"/><rect x="17" y="17" width="1" height="1" fill="#4a1208"/><rect x="18" y="17" width="1" height="1" fill="#d63a1f"/><rect x="19" y="17" width="1" height="1" fill="#4a1208"/><rect x="20" y="17" width="1" height="1" fill="#d63a1f"/><rect x="21" y="17" width="1" height="1" fill="#4a1208"/><rect x="5" y="18" width="1" height="1" fill="#4a1208"/><rect x="7" y="18" width="1" height="1" fill="#4a1208"/><rect x="18" y="18" width="1" height="1" fill="#4a1208"/><rect x="20" y="18" width="1" height="1" fill="#4a1208"/></svg></span></div>
      </div>
    `;
    parts = {
      title: shadow.querySelector('.title'),
      text: shadow.querySelector('.text'),
      bar: shadow.querySelector('.bar'),
      fill: shadow.querySelector('.fill'),
      runner: shadow.querySelector('.runner'),
      cancel: shadow.querySelector('.cancel'),
      close: shadow.querySelector('.close'),
      cancelText: shadow.querySelector('.cancel-text'),
    };
    parts.cancelText.textContent = labels.cancel;
    parts.close.setAttribute('aria-label', labels.close);
    parts.cancel.addEventListener('click', cancel);
    parts.close.addEventListener('click', () => api.remove());
    window.addEventListener('keydown', onKey, true);
    document.documentElement.appendChild(host);
  }

  window.__baProgress = api;
})();
