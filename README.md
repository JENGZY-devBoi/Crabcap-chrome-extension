# CrabCap (Chrome / Edge extension)

แคปหน้าเว็บทั้งหน้าโดย **ไม่ reload** รอให้เนื้อหาและ animation นิ่งก่อนแคป แล้วคืนหน้าเว็บกลับสภาพเดิม

## ติดตั้งเพื่อทดลอง

1. แตกไฟล์ zip
2. เปิด `chrome://extensions` (หรือ `edge://extensions`) แล้วเปิด **Developer mode**
3. กด **Load unpacked** แล้วเลือกโฟลเดอร์ `ba-capture`
4. ปักหมุดไอคอนปูถือกล้องไว้ที่แถบเครื่องมือ

ปุ่มลัดเริ่มต้น: `Alt+Shift+F` ทั้งหน้า, `Alt+Shift+V` ส่วนที่มองเห็น, `Alt+Shift+S` เลือกพื้นที่/element
(เปลี่ยนได้ที่ `chrome://extensions/shortcuts`)

## ลองและ debug ระหว่างพัฒนา

### แบบที่ 1: dev preview ในแท็บธรรมดา (เร็วที่สุดสำหรับงาน UI)

```bash
python3 -m http.server 5178      # รันที่โฟลเดอร์ ba-capture
```

เปิด <http://localhost:5178/dev/> แล้วกด **สร้างภาพตัวอย่าง** จากนั้นเปิด Popup / ภาพทั้งหมด / หน้า result ได้จากหน้านั้น
แก้ไฟล์แล้วกด refresh ได้เลย ไม่ต้อง reload extension

- `lib/boot.js` จำลอง `chrome.*` ขั้นต่ำเมื่อเปิดนอก extension (storage ใช้ localStorage, `tabs.create` เปิดแท็บใหม่)
- ภาพตัวอย่างเก็บใน IndexedDB ของ `localhost` แยกจาก extension จริง
- ทดลองการ์ดความคืบหน้า ข้อผิดพลาด และ overlay เลือกพื้นที่ได้จากหน้า dev
- การแคปจริง (debugger, captureVisibleTab) ทดสอบได้เฉพาะแบบที่ 2

### แบบที่ 2: โหลดเป็น extension จริง

1. `chrome://extensions` → เปิด Developer mode → **Load unpacked** → เลือกโฟลเดอร์นี้
2. แก้โค้ดแล้วกดปุ่ม ↻ บนการ์ด extension (popup / result / history แค่เปิดใหม่ก็พอ แต่ `background.js` และ `manifest.json` ต้อง reload)
3. ดู log:
   - **Popup**: คลิกขวาที่ไอคอน → Inspect popup
   - **Service worker** (`background.js`): ลิงก์ "service worker" บนการ์ด extension
   - **result / history**: เป็นแท็บปกติ กด F12
   - **การ์ดความคืบหน้า / overlay** ในหน้าเว็บ: F12 ของหน้านั้น เลือก context "CrabCap" ใน dropdown ของ Console

ก่อนส่งขึ้น store ให้ลบโฟลเดอร์ `dev/` ออกจากไฟล์ zip

## หน้าจอ

| หน้า | สิ่งที่ทำได้ |
|---|---|
| Popup | เลือกโหมดแคป, ภาพล่าสุด 3 ภาพ, ตั้งค่าการรอ, สลับธีม |
| ระหว่างแคปทั้งหน้า | การ์ดความคืบหน้ามุมขวาบน (ยกเลิกด้วย Esc) และตัวนับท่อนบน badge การ์ดจะถูกเอาออกก่อนถ่ายภาพจริง |
| ผลลัพธ์ | ซูม (`+` `-` `0`), ใส่โน้ต, คัดลอก (`C`), ดาวน์โหลด (`D`) |
| ภาพทั้งหมด | ค้นหา (`/`), กรองตามโหมด, ดาวน์โหลด, ลบ |

### เครื่องมือโน้ต (หน้าผลลัพธ์)

`V` เลือก/ย้าย · `R` กรอบ · `A` ลูกศร (Shift ล็อกมุม) · `N` เลขลำดับ · `T` ข้อความ · `B` เบลอข้อมูลส่วนตัว
`⌘Z` / `⇧⌘Z` (Mac) หรือ `Ctrl+Z` / `Ctrl+Shift+Z` (Windows, Ubuntu) เลิกทำ/ทำซ้ำ · `Delete` ลบที่เลือก · ดับเบิลคลิกข้อความเพื่อแก้

โน้ตเก็บเป็นข้อมูลแยกจากภาพ (บันทึกอัตโนมัติ) และถูกรวมเข้าไปในภาพตอนคัดลอก/ดาวน์โหลด
ภาพที่ยาวจนต้องแบ่งเป็นหลายไฟล์ยังใส่โน้ตไม่ได้

## โหมดการแคป

| โหมด | วิธีทำงาน | หมายเหตุ |
|---|---|---|
| ส่วนที่มองเห็น | `chrome.tabs.captureVisibleTab` | เร็ว ไม่แตะต้องหน้าเว็บเลย |
| เลือกพื้นที่ | overlay ให้ลากกรอบ แล้วครอปจากภาพส่วนที่มองเห็น | |
| เลือก element | คลิก element แล้วแคปด้วย CDP แบบ clip | element สูงเกินจอก็แคปได้ครบ |
| ทั้งหน้า | เตรียมหน้า → ขยาย viewport ครั้งเดียว → แคปทีละท่อน → ต่อภาพ | ดูหัวข้อถัดไป |

## ขั้นตอนแคปทั้งหน้า (ทำไมไม่มีปัญหาแบบ extension ทั่วไป)

1. **ไม่ reload และไม่เปลี่ยน URL** state ของหน้า (form ที่กรอกไว้, tab ที่เปิดอยู่, popup) จึงยังอยู่ครบ
2. **attach debugger ก่อนเตรียมหน้า** เพราะแถบเตือนของ Chrome ทำให้ viewport เปลี่ยนขนาด ถ้าเตรียมหน้าก่อน layout จะขยับทีหลัง
3. **เลื่อนผ่านทั้งหน้า** เพื่อกระตุ้น lazy-load และ animation ที่เล่นเมื่อเลื่อนมาถึง (fade-in, AOS)
4. **รอให้นิ่ง** รูปโหลดครบ, ฟอนต์พร้อม, `document.getAnimations()` ที่ไม่ใช่แบบวนเล่นจบ, DOM ไม่เปลี่ยนต่อเนื่อง 400 ms
5. **แช่แข็ง** หยุด transition/animation ที่เหลือ และล็อก element ที่สูง 100vh เป็น px
6. **ขยาย scroll container ภายใน** สำหรับเว็บแอปที่เลื่อนใน `div` (ระบบหลังบ้านส่วนใหญ่เป็นแบบนี้)
7. **ขยาย viewport ครั้งเดียว** ด้วย `Emulation.setDeviceMetricsOverride` แล้วแคปทีละ 4096 px ด้วย `clip`
   (ไม่ใช้ `captureBeyondViewport` ทุกท่อน เพราะจะ resize หน้าซ้ำทุกครั้ง)
8. **คืนสภาพ** ลบ style ที่ใส่, คืนตำแหน่ง scroll, ปลด debugger

## ข้อจำกัดที่รู้อยู่

- ระหว่างแคปทั้งหน้าและแคป element Chrome จะแสดงแถบ "CrabCap เริ่มแก้ไขข้อบกพร่องเบราว์เซอร์นี้" ชั่วครู่ เป็นข้อบังคับของ `chrome.debugger` ปิดไม่ได้
- animation ที่ขับด้วย JavaScript ล้วน (canvas, GSAP) ไม่อยู่ใน `getAnimations()` ระบบจะรอจาก DOM ที่นิ่งแทน ถ้ายังไม่พอให้เพิ่ม "หน่วงเพิ่มก่อนแคป"
- หน้ายาวเกิน 50,000 px จะแคปเฉพาะส่วนบน ภาพที่ยาวเกินเพดาน canvas จะแบ่งเป็นหลายไฟล์
- ยังไม่รองรับ Firefox (ไม่มี `chrome.debugger`) และ Safari
- การขยาย scroll container เป็น heuristic เว็บแอปบางแบบอาจได้ layout ไม่สวย ปิดได้ในการตั้งค่า

## โครงสร้างไฟล์

```
manifest.json
background.js             service worker: ควบคุมการแคปทุกโหมด
lib/page-prep.js          ฟังก์ชันที่ฉีดเข้าหน้าเว็บ: เตรียมหน้า / รอ / คืนสภาพ
lib/db.js                 เก็บภาพใน IndexedDB (เก็บล่าสุด 30 ภาพ)
lib/thumb.js              สร้างภาพย่อ (ใช้ได้ทั้ง service worker และหน้าเว็บ)
lib/annotate.js           เครื่องมือโน้ต: วาดด้วย SVG และส่งออกด้วย canvas
lib/ui.js                 ไอคอน ธีม toast และ helper ที่ใช้ร่วมกัน
lib/boot.js               ใส่ธีมก่อนแสดงผล + จำลอง chrome.* สำหรับ dev preview
lib/settings.js           ค่าตั้งต้นและการบันทึกการตั้งค่า
content/select-overlay.js overlay เลือกพื้นที่/element
content/progress-overlay.js การ์ดความคืบหน้า/ข้อผิดพลาดในหน้าเว็บ
popup.*                   หน้าต่างเลือกโหมด
result.*                  หน้าแสดงผล ซูม ใส่โน้ต ดาวน์โหลด คัดลอก
history.*                 ภาพทั้งหมด ค้นหา กรอง ลบ
dev/                      หน้า dev preview และสคริปต์สร้างไอคอน/มาสคอต (make-icon.py)
```

## ขั้นต่อไปที่แนะนำ

- ย้ายเข้า **WXT + TypeScript** เมื่อโค้ดเริ่มโต (โครงสร้างไฟล์นี้แมปกับ `entrypoints/` ของ WXT ได้ตรงๆ)
- ใส่โน้ตบนภาพที่ยาวจนต้องแบ่งหลายไฟล์
- เชื่อมกับ desktop app (Tauri) ผ่าน Native Messaging
