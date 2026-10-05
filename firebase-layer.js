/* ==========================================================================
   firebase-layer.js — ชั้นเชื่อมต่อ Firebase (Authentication + Firestore)
   ศูนย์ปฏิบัติงานเชิงเนิน (CN-Hub) — เว็บรวมลิงก์ระบบงานต้นแบบ

   ต่างจากระบบงานอุบัติเหตุ/โจรกรรม: เว็บนี้มีผู้ล็อกอินได้แค่คนเดียว (เจ้าของเว็บ)
   จึงไม่มีคอลเลกชัน team / ไม่มีการเพิ่มสมาชิก ใช้บัญชี Auth บัญชีเดียวคงที่

   โครงสร้างข้อมูล:
     - sites_public  : การ์ดระบบที่ทีมงานเห็นได้เลยโดยไม่ต้องล็อกอิน (อ่านได้ทุกคน, เขียนได้เฉพาะเจ้าของ)
     - sites_private : การ์ดงานส่วนตัว (อ่าน/เขียนได้เฉพาะเจ้าของที่ล็อกอินแล้วเท่านั้น)
     - settings/hero : { image, imagePos, logo, title, subtitle, updatedAt } รูปพื้นหลัง/รูปโปรไฟล์/ชื่อเว็บ (อ่านได้ทุกคน, เขียนได้เฉพาะเจ้าของ)
     - config/bootstrap : { uid, at } ระบุว่าใครคือเจ้าของเว็บ ตั้งได้ครั้งเดียว (ดู firestore.rules)

   หมายเหตุ: ค่า firebaseConfig ด้านล่างเป็นค่าสาธารณะโดยออกแบบ (ไม่ใช่รหัสลับ)
   ความปลอดภัยจริงอยู่ที่ firestore.rules
   ========================================================================== */
(function () {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyA_WKBSteeP5EZQ08_K7zOh8J_Wwed4pYY",
    authDomain: "choengnoen-index.firebaseapp.com",
    projectId: "choengnoen-index",
    storageBucket: "choengnoen-index.firebasestorage.app",
    messagingSenderId: "443440738049",
    appId: "1:443440738049:web:77472f2ce7c2994b9b7500"
  };

  // ล็อกอินได้แค่เจ้าของเว็บคนเดียว ใช้ ID ที่ตั้งเองแปลงเป็นอีเมลสังเคราะห์ (โดเมน .invalid ไม่มีอยู่จริง ไม่มีการส่งอีเมลใดๆ)
  function idToEmail(id) {
    const clean = String(id || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    return clean + '@index.invalid';
  }

  const FBL = {};
  window.FBL = FBL;
  FBL.configured = !/^YOUR_/.test(String(firebaseConfig.apiKey || '')) && !/^YOUR_/.test(String(firebaseConfig.projectId || ''));
  if (!FBL.configured) return; // หน้าเว็บจะแสดงข้อความ "ยังไม่ได้ตั้งค่า" แทน ไม่ทำให้พังทั้งหน้า

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  try {
    db.enablePersistence({ synchronizeTabs: true }).catch(function (e) {
      console.warn('Firestore offline cache unavailable:', e && e.code);
    });
  } catch (e) { /* เบราว์เซอร์ที่ไม่รองรับ — ทำงานต่อแบบไม่มีแคช */ }

  FBL.isOwner = false; // true เมื่อล็อกอินสำเร็จ

  /* ---------- ข้อความผิดพลาดภาษาไทย ---------- */
  function thErr(e) {
    const code = (e && e.code) || '';
    const map = {
      'auth/invalid-credential': 'รหัสผ่านไม่ถูกต้อง',
      'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
      'auth/invalid-login-credentials': 'รหัสผ่านไม่ถูกต้อง',
      'auth/user-not-found': 'ยังไม่ได้ตั้งรหัสผ่านเจ้าของ',
      'auth/too-many-requests': 'ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่',
      'auth/network-request-failed': 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ ตรวจสอบสัญญาณแล้วลองใหม่',
      'auth/weak-password': 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร',
      'auth/email-already-in-use': 'มีการตั้งรหัสผ่านเจ้าของไว้แล้ว',
      'auth/invalid-email': 'ID ต้องเป็นตัวอักษร/ตัวเลขภาษาอังกฤษเท่านั้น',
      'auth/unauthorized-domain': 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase (Authentication → Settings → Authorized domains)',
      'permission-denied': 'ไม่มีสิทธิ์ทำรายการนี้ (ตรวจสอบว่าวางกฎ firestore.rules แล้ว และล็อกอินด้วยบัญชีเจ้าของ)',
      'unavailable': 'เชื่อมต่อฐานข้อมูลไม่ได้ในขณะนี้ กรุณาลองใหม่'
    };
    return map[code] || ((e && e.message) ? e.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
  }
  FBL.errorText = thErr;

  function nowIso() { return new Date().toISOString(); }
  function clean(o) {
    const out = {};
    Object.keys(o).forEach(function (k) {
      let v = o[k];
      if (v === undefined) return;
      if (typeof v === 'number' && !isFinite(v)) v = null;
      out[k] = v;
    });
    return out;
  }

  /* ---------- เจ้าของเว็บ / ล็อกอิน ---------- */
  FBL.hasOwner = async function () {
    const d = await db.collection('config').doc('bootstrap').get();
    return d.exists;
  };

  // ตั้ง ID + รหัสผ่านเจ้าของครั้งแรก — ใช้ได้แค่ตอนยังไม่มีเอกสาร config/bootstrap (ดู firestore.rules)
  FBL.bootstrapOwner = async function (id, password) {
    try {
      const cred = await auth.createUserWithEmailAndPassword(idToEmail(id), password);
      const uid = cred.user.uid;
      try {
        await db.collection('config').doc('bootstrap').set({ uid: uid, ownerId: id, at: nowIso() });
      } catch (e) {
        try { await cred.user.delete(); } catch (_) { /* ล้างบัญชีที่ค้าง */ }
        throw e;
      }
      FBL.isOwner = true;
    } catch (e) { throw new Error(thErr(e)); }
  };

  FBL.login = async function (id, password) {
    try {
      await auth.signInWithEmailAndPassword(idToEmail(id), password);
    } catch (e) { throw new Error(thErr(e)); }
  };

  FBL.logout = async function () {
    await auth.signOut();
    FBL.stop('sites_private'); // คง sites_public ไว้ — ถ้าหยุดด้วย การ์ดงานหมวดจะหายเมื่อล็อกอินใหม่โดยไม่รีโหลดหน้า
    FBL.isOwner = false;
  };

  /* ==== IDLE-GUARD v1 — ออกจากระบบอัตโนมัติเมื่อไม่ได้ใช้งาน + ล้างข้อมูลแคชในเครื่อง (โค้ดชุดเดียวกันทุกระบบ ห้ามแก้เฉพาะระบบ) ====
     - นับเวลาจากเมาส์/แป้นพิมพ์/แตะจอ รวมทุกแท็บของระบบเดียวกัน (แชร์ผ่าน localStorage)
     - เตือนก่อนออก (ไม่ขัดจังหวะ ไม่ดึงโฟกัสจากช่องที่กำลังพิมพ์) แล้วออกจากระบบ: signOut → terminate → clearPersistence → โหลดหน้าใหม่
     - ทดสอบ: ตั้ง localStorage 'fbl_idle_test' = "วินาทีออก,วินาทีเตือน" (ใช้ได้เฉพาะ "ลดเวลา" ลง ไม่ทำให้ยาวขึ้น) */
  (function (FBL, auth, db, pid) {
    var IDLE_MIN = 60, WARN_MIN = 5;
    var idleMs = IDLE_MIN * 60000, warnMs = WARN_MIN * 60000;
    try {
      var tst = String(localStorage.getItem('fbl_idle_test') || '').split(',');
      if (+tst[0] > 0) { idleMs = Math.min(idleMs, +tst[0] * 1000); warnMs = Math.min(warnMs, (+tst[1] > 0 ? +tst[1] : +tst[0] / 3) * 1000, idleMs - 1000); }
    } catch (e) { /* ข้าม */ }
    var K_ACT = 'fbl_idle_act_' + pid, K_OUT = 'fbl_idle_out_' + pid, K_DONE = 'fbl_idle_done_' + pid;
    var lastLocal = 0, lastWrite = 0, warnEl = null, shield = null, leaving = false, inFlight = null, leader = false;

    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function lsGet(k) { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } }
    function lsSet(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { /* ข้าม */ } }
    function lastActive() { return Math.max(lastLocal, lsGet(K_ACT)); }
    function touch() {
      var n = Date.now(); lastLocal = n;
      if (n - lastWrite > 3000) { lastWrite = n; lsSet(K_ACT, n); }
      if (warnEl) hideWarn();
    }
    var staleOnLoad = lsGet(K_ACT) > 0 && Date.now() - lsGet(K_ACT) >= idleMs; // เปิดหน้าขึ้นมาตอนที่ค้างไม่ได้ใช้งานเกินกำหนดแล้ว
    if (!lsGet(K_ACT)) lsSet(K_ACT, Date.now()); // ครั้งแรกที่ใช้ระบบนี้ในเครื่อง — ยังไม่มีบันทึก ถือว่าเริ่มนับจากตอนนี้

    /* ---------- กล่องเตือน ---------- */
    function dirtyCount() {
      var n = 0;
      try {
        var els = document.querySelectorAll('input:not([type=password]):not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea');
        for (var i = 0; i < els.length; i++) { var el = els[i]; if (el.offsetParent !== null && !el.readOnly && !el.disabled && el.value !== el.defaultValue) n++; }
      } catch (e) { /* ข้าม */ }
      return n;
    }
    function fmt(ms) { var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60); return m + ':' + ('0' + (s % 60)).slice(-2); }
    function showWarn(left) {
      if (!warnEl) {
        warnEl = document.createElement('div');
        warnEl.setAttribute('role', 'alert');
        warnEl.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483000;max-width:340px;background:#fff8e1;color:#4a3300;border:2px solid #f59e0b;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.35);padding:14px 16px;font:14px/1.5 system-ui,"Sarabun","Noto Sans Thai",sans-serif';
        warnEl.innerHTML = '<div style="font-weight:700;margin-bottom:4px">⏱ ไม่มีการใช้งานสักครู่</div>' +
          '<div>ระบบจะออกจากระบบอัตโนมัติใน <b data-idle-left></b> เพื่อความปลอดภัยของข้อมูล</div>' +
          '<div data-idle-dirty style="display:none;margin-top:6px;color:#b45309;font-weight:600"></div>' +
          '<button type="button" data-idle-stay style="margin-top:10px;width:100%;padding:8px;border:0;border-radius:8px;background:#f59e0b;color:#fff;font:inherit;font-weight:700;cursor:pointer">ยังใช้งานอยู่ — อยู่ต่อ</button>';
        warnEl.querySelector('[data-idle-stay]').onclick = function () { touch(); };
        // ไม่ดึงโฟกัสออกจากช่องที่กำลังพิมพ์: กดปุ่มนี้ด้วยเมาส์ไม่ย้ายโฟกัส
        warnEl.addEventListener('mousedown', function (e) { e.preventDefault(); });
        (document.body || document.documentElement).appendChild(warnEl);
      }
      warnEl.querySelector('[data-idle-left]').textContent = fmt(left);
      var d = dirtyCount(), dEl = warnEl.querySelector('[data-idle-dirty]');
      if (d > 0) { dEl.style.display = 'block'; dEl.textContent = 'อาจมีข้อมูลที่กรอกค้างอยู่ ' + d + ' ช่อง — กดบันทึกก่อนครบเวลา ไม่เช่นนั้นข้อมูลจะหาย'; }
      else dEl.style.display = 'none';
    }
    function hideWarn() { if (warnEl) { warnEl.remove(); warnEl = null; } }
    function showShield() {
      if (shield) return;
      shield = document.createElement('div');
      shield.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:#0b2540;color:#fff;display:flex;align-items:center;justify-content:center;font:600 18px system-ui,"Sarabun","Noto Sans Thai",sans-serif';
      shield.textContent = 'กำลังออกจากระบบและล้างข้อมูลในเครื่อง...';
      (document.body || document.documentElement).appendChild(shield);
    }

    /* ---------- ออกจากระบบ + ล้างแคช ---------- */
    async function wipe() {
      try { await db.terminate(); } catch (e) { /* ข้าม */ }
      for (var i = 0; i < 8; i++) {
        try { await db.clearPersistence(); return true; } catch (e) { await sleep(500); }
      }
      console.warn('ล้างแคชในเครื่องไม่สำเร็จ (อาจมีแท็บอื่นเปิดระบบนี้ค้างอยู่)');
      return false;
    }
    var origLogout = FBL.logout;
    FBL.logout = function () {
      if (inFlight) return inFlight;
      var args = arguments;
      leaving = true; leader = true; FBL._leaving = true;
      hideWarn(); showShield();
      inFlight = (async function () {
        setTimeout(function () { location.reload(); }, 25000); // กันค้าง
        lsSet(K_OUT, Date.now());                    // บอกแท็บอื่นของระบบนี้ให้ปิดฐานข้อมูล (ไม่งั้นล้างแคชไม่ได้)
        // ส่งข้อมูลที่ค้างรอส่งขึ้นเซิร์ฟเวอร์ให้เสร็จก่อน ไม่งั้นการล้างแคชจะทำให้ข้อมูลที่เพิ่งบันทึกตอนออฟไลน์หาย
        try { await Promise.race([db.waitForPendingWrites(), sleep(5000)]); } catch (e) { /* ข้าม */ }
        try { await origLogout.apply(FBL, args); } catch (e) { /* ข้าม */ }
        try { await auth.signOut(); } catch (e) { /* ข้าม */ }
        await wipe();
        lsSet(K_DONE, Date.now());
        location.reload();
        await new Promise(function () { });          // ไม่ให้โค้ดหลังปุ่มออกจากระบบทำงานต่อระหว่างโหลดหน้าใหม่
      })();
      return inFlight;
    };

    // แท็บอื่นของระบบเดียวกัน: ปิดฐานข้อมูลแล้วรอแท็บที่กดออกล้างเสร็จ จึงโหลดใหม่
    window.addEventListener('storage', function (e) {
      if (e.key === K_OUT && e.newValue && !leader && !leaving) {
        leaving = true; FBL._leaving = true; showShield();
        try { db.terminate().catch(function () { }); } catch (x) { /* ข้าม */ }
        setTimeout(function () { location.reload(); }, 15000);
      } else if (e.key === K_DONE && e.newValue && !leader && leaving) {
        location.reload();
      }
    });

    /* ---------- นับเวลาไม่ใช้งาน ---------- */
    ['mousemove', 'mousedown', 'pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll', 'click'].forEach(function (t) {
      window.addEventListener(t, touch, { passive: true, capture: true });
    });
    // เหตุการณ์ล็อกอินครั้งแรกหลังเปิดหน้า: ถ้าเป็นเซสชันเก่าที่ค้างมานานเกินกำหนด ให้ออกจากระบบทันที (ไม่ให้แค่ขยับเมาส์แล้วเข้าได้เลย)
    auth.onAuthStateChanged(function (u) { if (u && staleOnLoad && !leaving) FBL.logout(); staleOnLoad = false; });
    function tick() {
      if (leaving || !auth.currentUser) { if (!auth.currentUser) hideWarn(); return; }
      var idle = Date.now() - lastActive();
      if (idle >= idleMs) FBL.logout();
      else if (idle >= idleMs - warnMs) showWarn(idleMs - idle);
      else if (warnEl) hideWarn();
    }
    setInterval(tick, 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  })(FBL, auth, db, firebaseConfig.projectId);

  // ต้องเรียกครั้งเดียวตอนเริ่มระบบ — cb(isOwner)
  FBL.onAuth = function (cb) {
    auth.onAuthStateChanged(async function (u) {
      if (!u) { FBL.isOwner = false; cb(false); return; }
      try {
        // อ่านจากแคชในเครื่องก่อน (เร็ว ไม่ต้องรอเน็ต) — สิทธิ์จริงยังบังคับที่ firestore.rules
        let d = null;
        try { d = await db.collection('config').doc('bootstrap').get({ source: 'cache' }); } catch (_) { d = null; }
        if (!d || !d.exists || d.data().uid !== u.uid) d =await db.collection('config').doc('bootstrap').get();
        FBL.isOwner = d.exists && d.data().uid === u.uid;
        if (!FBL.isOwner) await auth.signOut();
        cb(FBL.isOwner);
      } catch (e) {
        FBL.isOwner = false;
        cb(false, thErr(e));
      }
    });
  };

  /* ---------- อ่านการ์ดระบบแบบ realtime ---------- */
  const subs = {};
  FBL.watch = function (col, onChange) {
    if (subs[col]) { subs[col].onChange = onChange || subs[col].onChange; return subs[col].first; }
    const s = subs[col] = { docs: [], firstDone: false, onChange: onChange };
    s.first = new Promise(function (resolve) {
      s.unsub = db.collection(col).onSnapshot(function (snap) {
        s.docs = snap.docs.map(function (d) { return Object.assign({}, d.data(), { __id: d.id }); });
        s.docs.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        if (!s.firstDone) { s.firstDone = true; resolve(s.docs); }
        else if (s.onChange) { try { s.onChange(col, s.docs); } catch (e) { console.error(e); } }
      }, function (err) {
        console.error('watch ' + col + ' failed', err);
        if (FBL.onError) FBL.onError(thErr(err));
        if (!s.firstDone) { s.firstDone = true; resolve([]); }
      });
    });
    return s.first;
  };
  FBL.onError = null;
  FBL.docs = function (col) { return subs[col] ? subs[col].docs : []; };
  FBL.loaded = function (col) { return !!(subs[col] && subs[col].firstDone); };
  FBL.stop = function (col) {
    if (subs[col]) { subs[col].unsub(); delete subs[col]; }
  };
  FBL.stopAll = function () {
    Object.keys(subs).forEach(function (k) { if (subs[k].unsub) subs[k].unsub(); delete subs[k]; });
  };

  /* ---------- เพิ่ม/แก้/ลบการ์ดระบบ (เจ้าของเท่านั้น — บังคับที่ firestore.rules) ---------- */
  FBL.saveSite = async function (col, site) {
    const isNew = !site.__id;
    const data = clean({
      name: site.name, desc: site.desc || '', url: site.url,
      firebaseUrl: site.firebaseUrl || '', githubUrl: site.githubUrl || '',
      appsScriptUrl: site.appsScriptUrl || '', driveUrl: site.driveUrl || '', icon: site.icon || '',
      accentColor: site.accentColor || '', // สีแถบข้างการ์ด "#RRGGBB" — '' = ใช้สีตามหมวด
      order: site.order != null ? site.order : Date.now(),
      updatedAt: nowIso()
    });
    if (isNew) {
      await db.collection(col).add(data);
    } else {
      await db.collection(col).doc(site.__id).set(data, { merge: true });
    }
  };

  FBL.deleteSite = async function (col, id) {
    await db.collection(col).doc(id).delete();
  };

  // เรียงลำดับการ์ดใหม่ตามรายการ id ที่ส่งมา (ลากวางบนหน้าเว็บ)
  // ให้เลข order ใหม่ 10, 20, 30… แล้วบันทึกพร้อมกันทุกใบในคำสั่งเดียว — ไม่สำเร็จจะไม่มีใบไหนเปลี่ยน
  // breaks (ถ้ามี) = true/false ตามลำดับเดียวกับ ids — true คือขึ้นบรรทัดใหม่หลังการ์ดใบนั้น
  FBL.reorderSites = async function (col, ids, breaks) {
    try {
      const batch = db.batch();
      ids.forEach(function (id, i) {
        const data = { order: (i + 1) * 10 };
        if (breaks) data.breakAfter = !!breaks[i];
        batch.update(db.collection(col).doc(id), data);
      });
      await batch.commit();
    } catch (e) { throw new Error(thErr(e)); }
  };

  /* ---------- ตั้งค่าหัวเว็บ (settings/hero) — ทุกคนเห็น, เปลี่ยนได้เฉพาะเจ้าของ ---------- */
  // cb({ image, imagePos, logo, title, subtitle }) — image/logo เป็น data URL ของรูปที่ย่อแล้ว, '' หรือไม่มี = ใช้ค่าเริ่มต้น
  // imagePos = ตำแหน่งรูปพื้นหลัง เช่น "50% 30%"
  FBL.watchHero = function (cb) {
    return db.collection('settings').doc('hero').onSnapshot(function (d) {
      cb(d.exists ? d.data() : {});
    }, function (err) { console.warn('watch hero failed', err && err.code); });
  };

  FBL.saveHero = async function (fields) {
    try {
      await db.collection('settings').doc('hero').set(clean({
        image: fields.image || '',
        imagePos: fields.imagePos || '',
        logo: fields.logo || '',
        title: fields.title || '',
        subtitle: fields.subtitle || '',
        updatedAt: nowIso()
      }));
    } catch (e) { throw new Error(thErr(e)); }
  };

  /* ==========================================================================
     ฐานข้อมูลกลาง (master) — ข้อมูลอ้างอิงที่ทุกระบบงานมาอ่าน (ดู master-data.html / master-client.js)
       master/routes        { version, updatedAt, items: [สายทาง] }
       master/zones         { version, updatedAt, items: [เขตพื้นที่รับผิดชอบ] }
       master/workcodes     { version, updatedAt, items: [รหัสงาน { code, name, nameEn, units: [หน่วยนับ], parent, output?, description? }] }
       master/assets_<ปีงบ> { version, updatedAt, fiscalYear, items: [ราคาประเมินทรัพย์สิน] }
       master/manuals       { version, updatedAt, items: [ทะเบียนคู่มือกรมทางหลวง] }
       master/traffic_std   { version, updatedAt, updatedBy, items: [], manual, sources, signDistances, taper, … } (หลายตารางในเอกสารเดียว)
       master_history/{id}  { docId, fromVersion, toVersion, summary, before (JSON), at }
         before = รายการ items เดิม หรือ ถ้าเป็นเอกสารหลายตาราง = { ชื่อตาราง: ข้อมูลเดิม } (กู้คืนได้ทั้งคู่)
     ========================================================================== */
  // Firestore เก็บ "รายการซ้อนในรายการ" ไม่ได้ ช่วง กม. ของสายทาง [[เริ่ม, สิ้นสุด], ...] จึงเก็บเป็น [{from, to}, ...]
  // หน้าเว็บและ master-client.js ใช้รูปแบบ [[เริ่ม, สิ้นสุด]] เหมือนเดิม — แปลงที่นี่ที่เดียว
  function encodeItems(items) {
    return (items || []).map(function (x) {
      if (!x || !Array.isArray(x.kmRanges)) return x;
      return Object.assign({}, x, { kmRanges: x.kmRanges.map(function (p) { return Array.isArray(p) ? { from: p[0], to: p[1] } : p; }) });
    });
  }
  function decodeItems(items) {
    return (items || []).map(function (x) {
      if (!x || !Array.isArray(x.kmRanges)) return x;
      return Object.assign({}, x, { kmRanges: x.kmRanges.map(function (p) { return Array.isArray(p) ? p : [p.from, p.to]; }) });
    });
  }
  FBL.decodeMasterItems = decodeItems;

  // cb(ข้อมูล) เมื่ออ่านสำเร็จ / onFail(ข้อความ) เมื่ออ่านไม่ได้ (เช่น ยังไม่ได้วาง firestore.rules ชุดใหม่)
  FBL.watchMaster = function (cb, onFail) {
    return db.collection('master').onSnapshot(function (snap) {
      const out = {};
      snap.docs.forEach(function (d) { const v = d.data(); v.items = decodeItems(v.items); out[d.id] = v; });
      cb(out);
    }, function (err) {
      console.error('watch master failed', err);
      if (onFail) onFail(thErr(err));
      else if (FBL.onError) FBL.onError(thErr(err));
    });
  };

  // บันทึกทั้งเอกสารในคำสั่งเดียว พร้อมเก็บฉบับก่อนแก้ไว้ใน master_history
  // expectVersion = เลขรุ่นที่หน้าเว็บเห็นตอนเริ่มแก้ ถ้าในฐานข้อมูลเปลี่ยนไปแล้ว (เช่น แก้จากอีกแท็บ) จะไม่ยอมบันทึกทับ
  FBL.saveMaster = async function (docId, items, extra, summary, expectVersion) {
    const ref = db.collection('master').doc(docId);
    const histRef = db.collection('master_history').doc();
    try {
      return await db.runTransaction(async function (tx) {
        const cur = await tx.get(ref);
        const curVersion = cur.exists ? (cur.data().version || 0) : 0;
        if ((expectVersion || 0) !== curVersion) {
          throw new Error('ข้อมูลชุดนี้ถูกแก้ไขจากที่อื่นระหว่างที่คุณกำลังแก้ (รุ่น ' + curVersion + ') กรุณาโหลดหน้าใหม่แล้วแก้อีกครั้ง');
        }
        const u = auth.currentUser;
        const data = Object.assign({}, extra || {}, {
          items: encodeItems(items), version: curVersion + 1, updatedAt: nowIso(),
          updatedBy: u && u.email ? u.email.replace(/@index\.invalid$/, '') : ''
        });
        // เอกสารหลายตาราง (เช่น traffic_std): เก็บทุกตารางเดิมไว้ในประวัติ ไม่ใช่แค่ items
        const sectionKeys = Object.keys(extra || {}).filter(function (k) { return k !== 'fiscalYear'; });
        let before = '[]';
        if (cur.exists && sectionKeys.length) {
          const old = cur.data(), snap = {};
          sectionKeys.forEach(function (k) { if (old[k] !== undefined) snap[k] = old[k]; });
          before = JSON.stringify(snap);
        } else if (cur.exists) before = JSON.stringify(decodeItems(cur.data().items));
        tx.set(ref, data);
        tx.set(histRef, {
          docId: docId, fromVersion: curVersion, toVersion: curVersion + 1,
          summary: String(summary || '').slice(0, 2000),
          before: before,
          at: nowIso()
        });
        return curVersion + 1;
      });
    } catch (e) {
      if (e && e.code) throw new Error(thErr(e));
      throw e;
    }
  };

  FBL.masterHistory = async function (limit) {
    try {
      const snap = await db.collection('master_history').orderBy('at', 'desc').limit(limit || 50).get();
      return snap.docs.map(function (d) { return Object.assign({ __id: d.id }, d.data()); });
    } catch (e) { throw new Error(thErr(e)); }
  };
})();
