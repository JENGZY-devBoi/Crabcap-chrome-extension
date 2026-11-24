// ข้อความทุกภาษาของ CrabCap ใช้ได้ทั้งในหน้า extension และ service worker
// ค่าเริ่มต้นเป็นภาษาอังกฤษ ภาษาที่เลือกเก็บใน chrome.storage.local (ให้ background อ่านได้)
// และใน localStorage (ให้หน้าเว็บอ่านได้ทันทีก่อนแสดงผล ไม่กระพริบ)

export const LANGS = ['en', 'th'];
export const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'ba-lang';

const MESSAGES = {
  en: {
    // ทั่วไป
    appName: 'CrabCap',
    untitled: 'Untitled page',
    allCaptures: 'All captures',
    themeLight: 'Theme: light',
    themeDark: 'Theme: dark',
    langButton: 'Language: English (switch to Thai)',
    justNow: 'just now',

    // โหมด
    modeFull: 'Full page',
    imageSize: 'Size',
    modeVisible: 'Visible area',
    modeRegion: 'Selected area',
    modeElement: 'Element',

    // popup
    greeting: 'Crab is ready to snap!',
    captureThisPage: 'Capture this page',
    captureFullTitle: 'Capture full page',
    captureVisibleTitle: 'Capture visible area',
    captureSelectTitle: 'Capture area or element',
    fullDesc: 'Everything, top to bottom',
    visibleTitle: 'Visible area',
    visibleDesc: 'Fastest, leaves the page untouched',
    selectTitle: 'Area or element',
    selectDesc: 'Drag a box or click an element',
    blocked: "This is a browser or store page, so the crab can't capture it. Try another website.",
    recent: 'Recent',
    seeAll: 'See all',
    settingsTitle: 'Waiting before a full-page capture',
    setPreload: 'Scroll to load everything first',
    setPreloadDesc: 'For images and sections that load as you scroll',
    setWaitAnim: 'Wait for animations to finish',
    setWaitAnimDesc: 'No half-finished frames',
    setFreeze: 'Pause motion while capturing',
    setFreezeDesc: 'Spinners, carousels and the like',
    setFreezeVh: 'Lock full-screen heights',
    setFreezeVhDesc: 'Stops 100vh sections from stretching',
    setExpand: 'Expand inner scroll areas',
    setExpandDesc: 'For web apps that scroll inside a panel, not the page',
    setDelay: 'Extra delay before capture',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    themeLightShort: 'Light',
    themeDarkShort: 'Dark',
    changeShortcuts: 'Change shortcuts',
    shortcutTip: 'Shortcut: {key}',

    // history
    historyTitle: 'All captures',
    searchPlaceholder: 'Search page title or URL',
    filterByMode: 'Filter by mode',
    filterAll: 'All',
    keepHint: 'The 30 most recent captures are kept on this device',
    count: '{n} captures',
    countOne: '1 capture',
    emptyTitle: "The crab hasn't snapped anything yet",
    emptyBody: 'Click the CrabCap icon in the toolbar, or press <kbd>Alt+Shift+F</kbd> to capture a full page',
    noMatchTitle: 'Nothing found',
    noMatchBody: 'Try another word, or choose "All"',
    open: 'Open {title}',
    download: 'Download',
    downloadNamed: 'Download {title}',
    delete: 'Delete',
    deleteNamed: 'Delete {title}',
    deleteConfirm: 'Confirm delete?',
    deleteConfirmIn: 'Confirm delete? ({s}s)',
    deleteThis: 'Delete this capture',
    styleOptions: 'Style',
    fontSize: 'Font size',
    fontSmall: 'Small',
    fontBody: 'Normal',
    fontSubheading: 'Subheading',
    fontHeading: 'Heading',
    fontTitle: 'Title',
    clearSite: 'Clear',
    clearSiteNamed: 'Delete the captures shown from {host}',
    clearSiteConfirm: 'Delete {n}?',
    siteCleared: 'Deleted {n} captures from {host}',
    siteClearedOne: 'Deleted 1 capture from {host}',
    deleted: 'Capture deleted',
    downloaded: 'Downloaded',
    notesCount: '{n} notes',

    // result
    preparing: 'Preparing image',
    zoom: 'Zoom',
    zoomOut: 'Zoom out (-)',
    zoomIn: 'Zoom in (+)',
    zoomToggle: 'Switch between fit and 100% (0)',
    fit: 'Fit width',
    showAll: 'Show all',
    copy: 'Copy',
    downloadPng: 'Download PNG',
    downloadOptions: 'Download options',
    downloadEdited: 'Edited',
    downloadEditedDesc: 'With crop and notes',
    downloadOriginal: 'Original',
    downloadOriginalDesc: 'As captured, no crop or notes',
    annotTools: 'Annotation tools',
    colour: 'Colour',
    undo: 'Undo',
    redo: 'Redo',
    clearNotes: 'Delete all notes',
    buildFailed: "Couldn't build the image: {msg}",
    loadingImage: 'Loading image',
    notFound: 'Capture not found. Older captures are removed automatically once there are more than 30.',
    tooLongToCopy: 'Too long to copy as one image. Download it instead.',
    partAlt: 'Part {i}',
    captureAlt: 'Captured image',
    partOf: 'Part {i} of {n}',
    tooLongToAnnotate: "Too long to annotate (split into several files)",
    notesCleared: 'All notes deleted. Press {mod}Z to undo',
    saveNotesFailed: "Couldn't save notes: {msg}",
    downloadedFiles: 'Downloaded {n} files',
    downloadFailed: 'Download failed: {msg}',
    copied: 'Copied. Paste it into your document',
    copyFailed: 'Copy failed: {msg}',
    seeAllCaptures: 'See all captures',
    exportFailed: "Couldn't export the image",
    typeHere: 'Type',

    // เครื่องมือโน้ต
    toolSelect: 'Select / move',
    toolRect: 'Shape',
    toolArrow: 'Arrow',
    toolPen: 'Pen',
    crop: 'Crop',
    cropMode: 'Crop mode',
    cropApply: 'Apply crop',
    cropSelectAll: 'Select all',
    cropRestore: 'Restore original',
    cropHint: 'Drag edges or corners · drag inside to move',
    cropDone: 'Cropped to {w} × {h} px · {mod}Z to undo',
    cropUndone: 'Crop undone',
    cropRestored: 'Original image restored',
    cropUnavailable: 'Too long to crop (split into several files)',
    toolStep: 'Number',
    toolText: 'Text',
    toolBlur: 'Blur',
    toolLoupe: 'Magnifier',
    toolHighlight: 'Highlight area',
    shapeKind: 'Shape',
    otherCaptures: 'Other captures',
    libraryHint: 'Click to edit · drag onto the image to add it',
    libraryEmpty: 'No other captures yet',
    editingNow: 'Editing',
    pasteImage: 'Paste image',
    imageBorder: 'Image border',
    borderNone: 'No border',
    borderLine: 'Border',
    selectAllNotes: 'Select all notes',
    pasteNoImage: 'No image on the clipboard · or press {mod}V',
    rename: 'Rename',
    renameHint: 'Click to rename',
    renameDblHint: 'Double-click to rename',
    selectCapture: 'Select',
    selectedCount: '{n} selected',
    selectAllShown: 'Select all',
    clearSelection: 'Clear',
    downloadFiles: 'Download images',
    downloadZip: 'Download ZIP',
    preparingN: 'Preparing {i}/{n}…',
    downloadedN: 'Downloaded {n} images',
    zipDone: 'Downloaded ZIP · {n} images',
    someFailed: "{n} couldn't be prepared",
    renameDuplicate: 'That name is taken · renamed to “{name}”',
    renameFailed: "Couldn't rename: {msg}",
    imagePasted: 'Image added · double-click it to crop',
    imagePasteFailed: "Couldn't add the image: {msg}",
    imageCropHint: 'Drag the edges or corners to crop · Enter when done',
    cropImage: 'Crop image',
    lineStyle: 'Line style',
    dashSolid: 'Solid',
    dashDash: 'Dashed',
    dashDot: 'Dotted',
    shapeRect: 'Rectangle',
    shapeEllipse: 'Ellipse',
    shapeBubble: 'Speech bubble',
    shapeStar: 'Star',
    hintSelect: 'Click a note to select, drag to move, double-click text to edit · Delete removes',
    hintRect: 'Drag to draw a box',
    hintArrow: 'Drag from the start to what you want to point at · hold Shift to snap the angle',
    hintPen: 'Hold and drag to draw freely',
    hintStep: 'Click to place 1, 2, 3 … in order',
    hintText: 'Click where you want to type, then press Enter',
    hintBlur: 'Drag over private details such as names, phone numbers or emails',
    colourRed: 'Red',
    colourYellow: 'Yellow',
    colourBlue: 'Blue',
    colourGreen: 'Green',
    colourBlack: 'Black',
    colourOrange: 'Orange',
    colourPurple: 'Purple',
    colourPink: 'Pink',
    colourWhite: 'White',
    colourGrey: 'Grey',
    recentColours: 'Recent',
    pickColour: 'Pick from image',
    pickHint: 'Click the image to pick a colour · Esc to cancel',
    customColour: 'Custom colour',
    strokeSize: 'Line size',
    sizeS: 'Thin',
    sizeM: 'Medium',
    sizeL: 'Thick',
    fillStyle: 'Box fill',
    arrowHead: 'Arrowhead',
    textOutline: 'Text style',
    arrange: 'Arrange',
    bringFront: 'Bring to front',
    bringForward: 'Bring forward',
    sendBackward: 'Send backward',
    sendBack: 'Send to back',
    duplicate: 'Duplicate',
    outlineNone: 'Plain',
    outlineAuto: 'Outline',
    bgWhite: 'White background',
    bgDark: 'Dark background',
    bgYellow: 'Yellow highlight',
    bgSolid: 'Filled with color',
    headTriangle: 'Solid',
    headOpen: 'Open',
    headDouble: 'Double',
    headNone: 'None',
    fillNone: 'Outline',
    fillTint: 'Tinted',
    fillSolid: 'Solid',

    // แคป (background / ในหน้าเว็บ)
    cancelled: 'Capture cancelled',
    restricted: "Extensions can't capture browser or store pages",
    elementMissing: "Couldn't find the selected element. Try selecting again.",
    prepareFailed: "Couldn't prepare the page",
    pageTooLong: 'The page is longer than {px} px, so only the top part was captured',
    attachFailed: "Couldn't connect to the tab: {msg}",
    stepConnect: 'Connecting to the tab',
    stepPrepare: 'Preparing the page',
    stepScroll: 'Scrolling to load everything',
    stepScrollPct: 'Scrolling to load everything {pct}%',
    stepImages: 'Waiting for images and fonts',
    stepAnimations: 'Waiting for animations to finish',
    stepSettle: 'Waiting for the page to settle',
    stepShoot: 'Taking the picture',
    noteScrollContainer: 'Found an inner scroll area and expanded it to show all content',
    noteScrollTimeout: "The page is very long, so not everything loaded in time",
    progressTitle: 'The crab is capturing the page…',
    errorTitle: 'Oops, the capture failed',
    cancelling: 'Cancelling and restoring the page…',
    cancel: 'Cancel',
    close: 'Close',
    selectHint: 'Drag to select an area, or click to pick an element <kbd>Esc</kbd> cancel',
  },

  th: {
    appName: 'CrabCap',
    untitled: 'ไม่มีชื่อหน้า',
    allCaptures: 'ภาพทั้งหมด',
    themeLight: 'ธีม: สว่าง',
    themeDark: 'ธีม: มืด',
    langButton: 'ภาษา: ไทย (เปลี่ยนเป็นอังกฤษ)',
    justNow: 'เมื่อสักครู่',

    modeFull: 'ทั้งหน้า',
    imageSize: 'ขนาด',
    modeVisible: 'ส่วนที่มองเห็น',
    modeRegion: 'เลือกพื้นที่',
    modeElement: 'element',

    greeting: 'ปูพร้อมแคปแล้ว',
    captureThisPage: 'แคปหน้านี้',
    captureFullTitle: 'แคปทั้งหน้า',
    captureVisibleTitle: 'แคปส่วนที่มองเห็น',
    captureSelectTitle: 'แคปพื้นที่หรือ element',
    fullDesc: 'รวมส่วนที่ต้องเลื่อนลงไปดู',
    visibleTitle: 'ส่วนที่มองเห็น',
    visibleDesc: 'เร็วที่สุด ไม่แตะต้องหน้าเว็บ',
    selectTitle: 'เลือกพื้นที่หรือ element',
    selectDesc: 'ลากเป็นกรอบ หรือคลิกที่ส่วนประกอบ',
    blocked: 'หน้านี้เป็นหน้าของ browser หรือ store ปูแคปให้ไม่ได้นะ ลองเปิดหน้าเว็บอื่นดู',
    recent: 'ล่าสุด',
    seeAll: 'ดูทั้งหมด',
    settingsTitle: 'การรอก่อนแคปทั้งหน้า',
    setPreload: 'เลื่อนโหลดเนื้อหาให้ครบก่อน',
    setPreloadDesc: 'สำหรับรูปและส่วนที่โหลดเมื่อเลื่อนถึง',
    setWaitAnim: 'รอ animation เล่นจบ',
    setWaitAnimDesc: 'ไม่ได้ภาพที่ค้างครึ่งทาง',
    setFreeze: 'หยุดการเคลื่อนไหวระหว่างแคป',
    setFreezeDesc: 'เช่น spinner, carousel',
    setFreezeVh: 'ล็อกความสูงเต็มจอ',
    setFreezeVhDesc: 'กันส่วนที่สูง 100vh ยืดยาวผิดปกติ',
    setExpand: 'ขยายพื้นที่เลื่อนภายใน',
    setExpandDesc: 'สำหรับเว็บแอปที่เลื่อนในกรอบ ไม่ใช่ทั้งหน้า',
    setDelay: 'หน่วงเพิ่มก่อนแคป',
    settings: 'การตั้งค่า',
    language: 'ภาษา',
    theme: 'ธีม',
    themeLightShort: 'สว่าง',
    themeDarkShort: 'มืด',
    changeShortcuts: 'เปลี่ยนปุ่มลัด',
    shortcutTip: 'ปุ่มลัด: {key}',

    historyTitle: 'ภาพทั้งหมด',
    searchPlaceholder: 'ค้นหาชื่อหน้าหรือ URL',
    filterByMode: 'กรองตามโหมด',
    filterAll: 'ทั้งหมด',
    keepHint: 'เก็บไว้ 30 ภาพล่าสุดในเครื่องนี้',
    count: '{n} ภาพ',
    countOne: '1 ภาพ',
    emptyTitle: 'ปูยังไม่ได้แคปอะไรเลย',
    emptyBody: 'กดไอคอน CrabCap บนแถบเครื่องมือ หรือใช้ปุ่มลัด <kbd>Alt+Shift+F</kbd> เพื่อแคปทั้งหน้า',
    noMatchTitle: 'หาไม่เจอเลย',
    noMatchBody: 'ลองคำอื่น หรือเลือก "ทั้งหมด"',
    open: 'เปิด {title}',
    download: 'ดาวน์โหลด',
    downloadNamed: 'ดาวน์โหลด {title}',
    delete: 'ลบ',
    deleteNamed: 'ลบ {title}',
    deleteConfirm: 'ยืนยันการลบ?',
    deleteConfirmIn: 'ยืนยันการลบ? ({s}s)',
    deleteThis: 'ลบรูปนี้',
    styleOptions: 'รูปแบบ',
    fontSize: 'ขนาดตัวอักษร',
    fontSmall: 'เล็ก',
    fontBody: 'ปกติ',
    fontSubheading: 'หัวข้อย่อย',
    fontHeading: 'หัวข้อ',
    fontTitle: 'หัวเรื่องใหญ่',
    clearSite: 'ล้าง',
    clearSiteNamed: 'ลบภาพที่แสดงอยู่ของ {host}',
    clearSiteConfirm: 'ลบ {n} ภาพ?',
    siteCleared: 'ลบ {n} ภาพของ {host} แล้ว',
    siteClearedOne: 'ลบ 1 ภาพของ {host} แล้ว',
    deleted: 'ลบภาพแล้ว',
    downloaded: 'ดาวน์โหลดแล้ว',
    notesCount: 'โน้ต {n}',

    preparing: 'กำลังเตรียมภาพ',
    zoom: 'ซูม',
    zoomOut: 'ซูมออก (-)',
    zoomIn: 'ซูมเข้า (+)',
    zoomToggle: 'สลับ พอดีจอ / 100% (0)',
    fit: 'พอดีจอ',
    showAll: 'แสดงทั้งหมด',
    copy: 'คัดลอก',
    downloadPng: 'ดาวน์โหลด PNG',
    downloadOptions: 'ตัวเลือกการดาวน์โหลด',
    downloadEdited: 'ที่แก้ไขแล้ว',
    downloadEditedDesc: 'รวมการครอปและโน้ต',
    downloadOriginal: 'ต้นฉบับ',
    downloadOriginalDesc: 'ภาพที่แคปมา ไม่ครอป ไม่มีโน้ต',
    annotTools: 'เครื่องมือใส่โน้ต',
    colour: 'สี',
    undo: 'เลิกทำ',
    redo: 'ทำซ้ำ',
    clearNotes: 'ลบโน้ตทั้งหมด',
    buildFailed: 'สร้างภาพไม่สำเร็จ: {msg}',
    loadingImage: 'กำลังโหลดภาพ',
    notFound: 'ไม่พบภาพนี้ ภาพเก่าจะถูกลบอัตโนมัติเมื่อมีภาพใหม่เกิน 30 ภาพ',
    tooLongToCopy: 'ภาพยาวเกินกว่าจะคัดลอกเป็นภาพเดียว ใช้ดาวน์โหลดแทน',
    partAlt: 'ภาพส่วนที่ {i}',
    captureAlt: 'ภาพที่แคป',
    partOf: 'ส่วนที่ {i} จาก {n}',
    tooLongToAnnotate: 'ภาพยาวเกินกว่าจะใส่โน้ตได้ (แบ่งเป็นหลายไฟล์)',
    notesCleared: 'ลบโน้ตทั้งหมดแล้ว กด {mod}Z เพื่อเลิกทำ',
    saveNotesFailed: 'บันทึกโน้ตไม่สำเร็จ: {msg}',
    downloadedFiles: 'ดาวน์โหลด {n} ไฟล์แล้ว',
    downloadFailed: 'ดาวน์โหลดไม่สำเร็จ: {msg}',
    copied: 'คัดลอกแล้ว วางในเอกสารได้เลย',
    copyFailed: 'คัดลอกไม่สำเร็จ: {msg}',
    seeAllCaptures: 'ดูภาพทั้งหมด',
    exportFailed: 'ส่งออกภาพไม่สำเร็จ',
    typeHere: 'พิมพ์ข้อความ',

    toolSelect: 'เลือก/ย้าย',
    toolRect: 'รูปทรง',
    toolArrow: 'ลูกศร',
    toolPen: 'ปากกา',
    crop: 'ครอป',
    cropMode: 'โหมดครอป',
    cropApply: 'ครอปภาพ',
    cropSelectAll: 'เลือกทั้งภาพ',
    cropRestore: 'คืนภาพต้นฉบับ',
    cropHint: 'ลากขอบหรือมุมเพื่อปรับ · ลากข้างในเพื่อย้าย',
    cropDone: 'ครอปเป็น {w} × {h} px แล้ว · {mod}Z เพื่อย้อน',
    cropUndone: 'ย้อนการครอปแล้ว',
    cropRestored: 'คืนภาพต้นฉบับแล้ว',
    cropUnavailable: 'ภาพยาวเกินกว่าจะครอปได้ (แบ่งเป็นหลายไฟล์)',
    toolStep: 'เลขลำดับ',
    toolText: 'ข้อความ',
    toolBlur: 'เบลอข้อมูล',
    toolLoupe: 'แว่นขยาย',
    toolHighlight: 'ไฮไลต์พื้นที่',
    shapeKind: 'รูปทรง',
    otherCaptures: 'รูปอื่นที่แคปไว้',
    libraryHint: 'คลิกเพื่อแก้ไข · ลากมาวางบนภาพเพื่อแปะ',
    libraryEmpty: 'ยังไม่มีรูปอื่น',
    editingNow: 'กำลังแก้ไข',
    pasteImage: 'วางภาพ',
    imageBorder: 'เส้นขอบภาพ',
    borderNone: 'ไม่มีขอบ',
    borderLine: 'มีขอบ',
    selectAllNotes: 'เลือกโน้ตทั้งหมด',
    pasteNoImage: 'ไม่พบภาพในคลิปบอร์ด · หรือลองกด {mod}V',
    rename: 'เปลี่ยนชื่อ',
    renameHint: 'คลิกเพื่อเปลี่ยนชื่อ',
    renameDblHint: 'ดับเบิลคลิกเพื่อเปลี่ยนชื่อ',
    selectCapture: 'เลือก',
    selectedCount: 'เลือก {n} รูป',
    selectAllShown: 'เลือกทั้งหมด',
    clearSelection: 'ยกเลิก',
    downloadFiles: 'ดาวน์โหลดเป็นรูป',
    downloadZip: 'ดาวน์โหลด ZIP',
    preparingN: 'กำลังเตรียม {i}/{n}…',
    downloadedN: 'ดาวน์โหลด {n} รูปแล้ว',
    zipDone: 'ดาวน์โหลด ZIP แล้ว · {n} รูป',
    someFailed: 'เตรียมไม่สำเร็จ {n} รูป',
    renameDuplicate: 'ชื่อนี้มีแล้ว · ตั้งเป็น “{name}” แทน',
    renameFailed: 'เปลี่ยนชื่อไม่สำเร็จ: {msg}',
    imagePasted: 'แปะภาพแล้ว · ดับเบิลคลิกที่ภาพเพื่อครอป',
    imagePasteFailed: 'แปะภาพไม่สำเร็จ: {msg}',
    imageCropHint: 'ลากขอบหรือมุมเพื่อครอป · กด Enter เมื่อเสร็จ',
    cropImage: 'ครอปภาพ',
    lineStyle: 'แบบเส้น',
    dashSolid: 'เส้นทึบ',
    dashDash: 'เส้นประ',
    dashDot: 'เส้นจุด',
    shapeRect: 'สี่เหลี่ยม',
    shapeEllipse: 'วงรี',
    shapeBubble: 'กล่องคำพูด',
    shapeStar: 'ดาว',
    hintSelect: 'คลิกโน้ตเพื่อเลือก ลากเพื่อย้าย ดับเบิลคลิกข้อความเพื่อแก้ · Delete ลบ',
    hintRect: 'ลากเพื่อวาดกรอบ',
    hintArrow: 'ลากจากต้นไปหาสิ่งที่จะชี้ · กด Shift ค้างเพื่อล็อกมุม',
    hintPen: 'กดค้างแล้วลากเพื่อวาดอิสระ',
    hintStep: 'คลิกเพื่อวางเลข 1, 2, 3 … ตามลำดับ',
    hintText: 'คลิกตรงที่จะพิมพ์ แล้วกด Enter',
    hintBlur: 'ลากคลุมข้อมูลส่วนตัว เช่น ชื่อ เบอร์โทร อีเมล',
    colourRed: 'แดง',
    colourYellow: 'เหลือง',
    colourBlue: 'น้ำเงิน',
    colourGreen: 'เขียว',
    colourBlack: 'ดำ',
    colourOrange: 'ส้ม',
    colourPurple: 'ม่วง',
    colourPink: 'ชมพู',
    colourWhite: 'ขาว',
    colourGrey: 'เทา',
    recentColours: 'ใช้ล่าสุด',
    pickColour: 'ดูดสีจากภาพ',
    pickHint: 'คลิกที่ภาพเพื่อดูดสี · Esc ยกเลิก',
    customColour: 'กำหนดสีเอง',
    strokeSize: 'ขนาดเส้น',
    sizeS: 'บาง',
    sizeM: 'กลาง',
    sizeL: 'หนา',
    fillStyle: 'การเติมสีกรอบ',
    arrowHead: 'หัวลูกศร',
    textOutline: 'สไตล์ข้อความ',
    arrange: 'ลำดับชั้น',
    bringFront: 'นำไปไว้หน้าสุด',
    bringForward: 'เลื่อนขึ้นหนึ่งชั้น',
    sendBackward: 'เลื่อนลงหนึ่งชั้น',
    sendBack: 'ส่งไปไว้หลังสุด',
    duplicate: 'ทำสำเนา',
    outlineNone: 'ธรรมดา',
    outlineAuto: 'มีขอบ',
    bgWhite: 'พื้นขาว',
    bgDark: 'พื้นดำ',
    bgYellow: 'ไฮไลต์เหลือง',
    bgSolid: 'พื้นสีตามที่เลือก',
    headTriangle: 'ทึบ',
    headOpen: 'เปิด',
    headDouble: 'สองหัว',
    headNone: 'ไม่มีหัว',
    fillNone: 'เส้นขอบ',
    fillTint: 'สีจาง',
    fillSolid: 'ทึบ',

    cancelled: 'ยกเลิกการแคปแล้ว',
    restricted: 'หน้านี้เป็นหน้าของ browser หรือ store ซึ่ง extension แคปไม่ได้',
    elementMissing: 'ไม่พบ element ที่เลือก ลองเลือกใหม่อีกครั้ง',
    prepareFailed: 'เตรียมหน้าไม่สำเร็จ',
    pageTooLong: 'หน้ายาวเกิน {px} px จึงแคปเฉพาะส่วนบน',
    attachFailed: 'เชื่อมต่อแท็บไม่ได้: {msg}',
    stepConnect: 'เชื่อมต่อกับแท็บ',
    stepPrepare: 'เตรียมหน้าเว็บ',
    stepScroll: 'เลื่อนโหลดเนื้อหาให้ครบ',
    stepScrollPct: 'เลื่อนโหลดเนื้อหาให้ครบ {pct}%',
    stepImages: 'รอรูปภาพและฟอนต์โหลดเสร็จ',
    stepAnimations: 'รอ animation เล่นจบ',
    stepSettle: 'รอให้หน้าเว็บนิ่ง',
    stepShoot: 'กำลังถ่ายภาพ',
    noteScrollContainer: 'พบพื้นที่เลื่อนภายในหน้า จึงขยายให้แสดงเนื้อหาทั้งหมด',
    noteScrollTimeout: 'หน้ายาวมาก เลื่อนโหลดเนื้อหาได้ไม่ครบตามเวลาที่กำหนด',
    progressTitle: 'ปูกำลังแคปทั้งหน้า…',
    errorTitle: 'อุ๊ย แคปไม่สำเร็จ',
    cancelling: 'กำลังยกเลิกและคืนสภาพหน้าเว็บ…',
    cancel: 'ยกเลิก',
    close: 'ปิด',
    selectHint: 'ลากเพื่อเลือกพื้นที่ หรือคลิกเพื่อเลือก element <kbd>Esc</kbd> ยกเลิก',
  },
};

const hasLocalStorage = (() => {
  try {
    return typeof localStorage !== 'undefined';
  } catch (_) {
    return false;
  }
})();

function readLocal() {
  if (!hasLocalStorage) return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (_) {
    return null;
  }
}

let current = LANGS.includes(readLocal()) ? readLocal() : DEFAULT_LANG;

export function getLang() {
  return current;
}

/** ใน service worker ไม่มี localStorage ให้เรียกตัวนี้ก่อนใช้ t() */
export async function loadLang() {
  try {
    const { lang } = await chrome.storage.local.get('lang');
    if (LANGS.includes(lang)) current = lang;
  } catch (_) {
    /* ใช้ค่าเดิม */
  }
  return current;
}

export async function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  current = lang;
  if (hasLocalStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {
      /* ignore */
    }
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    applyI18n();
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }
  try {
    await chrome.storage.local.set({ lang });
  } catch (_) {
    /* dev preview */
  }
}

/** แปลข้อความตาม key แทนค่า {name} ด้วย params */
export function t(key, params = {}, lang = current) {
  const table = MESSAGES[lang] || MESSAGES[DEFAULT_LANG];
  const text = table[key] ?? MESSAGES[DEFAULT_LANG][key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => (name in params ? String(params[name]) : `{${name}}`));
}

/** ชุดข้อความสำหรับส่งเข้าไปใช้ในหน้าเว็บ (content script ไม่มี import) */
export function pick(keys, lang = current) {
  return Object.fromEntries(keys.map((k) => [k, t(k, {}, lang)]));
}

export function locale() {
  return current === 'th' ? 'th-TH' : 'en-US';
}

/**
 * เติมข้อความให้ element ที่มี
 * data-i18n (ข้อความ), data-i18n-html (มี markup เช่น <kbd>), data-i18n-title,
 * data-i18n-aria (aria-label), data-i18n-placeholder
 */
export function applyI18n(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) {
    // เก็บไอคอน/kbd ที่อยู่ในปุ่มไว้ แทนเฉพาะ text node แรก
    const textNode = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    const text = t(el.dataset.i18n);
    if (textNode) textNode.textContent = el.children.length ? `${text} ` : text;
    else if (el.children.length) el.insertBefore(document.createTextNode(`${text} `), el.querySelector('kbd'));
    else el.textContent = text;
  }
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const el of root.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
}

/** ปุ่มสลับภาษา แสดงภาษาปัจจุบัน (EN / TH) */
export function setupLangButton(btn) {
  if (!btn) return;
  const render = () => {
    btn.textContent = current.toUpperCase();
    btn.title = t('langButton');
    btn.setAttribute('aria-label', t('langButton'));
  };
  btn.addEventListener('click', () => setLang(current === 'en' ? 'th' : 'en'));
  document.addEventListener('langchange', render);
  // หน้าอื่นเปลี่ยนภาษา ให้หน้านี้เปลี่ยนตาม
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && LANGS.includes(e.newValue) && e.newValue !== current) setLang(e.newValue);
  });
  render();
}
