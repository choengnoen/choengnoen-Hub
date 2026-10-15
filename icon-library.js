/* ห้องสมุดไอคอนกลาง (Microsoft Fluent Emoji 3D, สัญญาอนุญาต MIT)
 * - ไฟล์รูปอยู่ที่ assets/icons/<id>.png  (ย่อเป็น 128px)
 * - ฐานข้อมูลเก็บแค่ "id" เช่น trophy  ส่วนค่าเก่าที่เป็นอิโมจิ ระบบจับคู่กลับมาเป็นรูปให้เอง
 * - อยากเปลี่ยนหน้าตาไอคอน: เอาไฟล์ใหม่ชื่อเดิมไปทับใน assets/icons/
 * - อยากเพิ่มไอคอน: ใส่ไฟล์ .png ใน assets/icons/ แล้วเพิ่มบรรทัดในรายการนี้ (id = ชื่อไฟล์ไม่รวม .png)
 * - e = อิโมจิเดิมที่ใช้จับคู่ (ใส่ได้หลายตัวคั่นด้วยช่องว่าง), n = ชื่อไทย, k = คำค้นเพิ่ม
 */
(function () {
  var LIB = [
    // งาน / ระบบหลักที่ใช้อยู่
    { id: 'trophy', e: '🏆', n: 'ถ้วยรางวัล', k: 'บริหาร ผลงาน' },
    { id: 'construction', e: '🚧', n: 'ป้ายกั้นก่อสร้าง', k: 'อุบัติเหตุ ซ่อม' },
    { id: 'warning', e: '⚠️ ⚠', n: 'ป้ายเตือน', k: 'โจรกรรม อันตราย' },
    { id: 'pushpin', e: '📌', n: 'หมุด', k: 'ชี้แนวเขต' },
    { id: 'page-facing-up', e: '📄', n: 'เอกสาร', k: 'ขออนุญาต แบบ' },
    { id: 'locked-with-key', e: '🔐', n: 'กุญแจ (ล็อก)', k: 'ข้อมูลกลาง ฐานข้อมูล' },
    { id: 'chart-increasing', e: '📈', n: 'กราฟขึ้น', k: 'รายงาน สถิติ' },
    { id: 'scroll', e: '📜', n: 'หนังสือราชการ', k: 'หนังสือ' },
    { id: 'hourglass-not-done', e: '⏳', n: 'นาฬิกาทราย', k: 'ควบคุมงาน โครงการ เวลา' },
    { id: 'automobile', e: '🚗', n: 'รถยนต์', k: 'ผังจราจร จราจร' },
    { id: 'link', e: '🔗', n: 'ลิงก์', k: 'เชื่อมโยง' },
    // ถนน / จราจร / ความปลอดภัย
    { id: 'motorway', e: '🛣️ 🛣', n: 'ทางหลวง', k: 'ถนน' },
    { id: 'vertical-traffic-light', e: '🚦', n: 'สัญญาณไฟจราจร', k: '' },
    { id: 'stop-sign', e: '🛑', n: 'ป้ายหยุด', k: '' },
    { id: 'police-car-light', e: '🚨', n: 'ไฟฉุกเฉิน', k: 'เหตุด่วน' },
    { id: 'ambulance', e: '🚑', n: 'รถพยาบาล', k: 'กู้ภัย' },
    { id: 'oncoming-automobile', e: '🚘', n: 'รถสวนมา', k: '' },
    { id: 'delivery-truck', e: '🚚', n: 'รถบรรทุก', k: '' },
    { id: 'bus', e: '🚌', n: 'รถบัส', k: '' },
    { id: 'motorcycle', e: '🏍️ 🏍', n: 'รถจักรยานยนต์', k: '' },
    { id: 'tractor', e: '🚜', n: 'รถแทรกเตอร์', k: 'เครื่องจักร' },
    { id: 'fuel-pump', e: '⛽', n: 'ปั๊มน้ำมัน', k: 'เชื้อเพลิง' },
    { id: 'brick', e: '🧱', n: 'อิฐ', k: 'วัสดุ ก่อสร้าง' },
    { id: 'toolbox', e: '🧰', n: 'กล่องเครื่องมือ', k: '' },
    { id: 'wrench', e: '🔧', n: 'ประแจ', k: 'ซ่อม' },
    { id: 'hammer', e: '🔨', n: 'ค้อน', k: '' },
    { id: 'hammer-and-wrench', e: '🛠️ 🛠', n: 'ค้อนกับประแจ', k: 'ซ่อมบำรุง' },
    { id: 'gear', e: '⚙️ ⚙', n: 'เฟือง', k: 'ตั้งค่า' },
    { id: 'high-voltage', e: '⚡', n: 'ไฟฟ้า', k: '' },
    { id: 'droplet', e: '💧', n: 'หยดน้ำ', k: 'น้ำ' },
    { id: 'water-wave', e: '🌊', n: 'คลื่นน้ำ', k: 'น้ำท่วม' },
    { id: 'fire', e: '🔥', n: 'ไฟ', k: '' },
    // เอกสาร / สำนักงาน
    { id: 'memo', e: '📝', n: 'บันทึก', k: '' },
    { id: 'clipboard', e: '📋', n: 'คลิปบอร์ด', k: 'รายการ' },
    { id: 'bar-chart', e: '📊', n: 'แผนภูมิแท่ง', k: 'สถิติ' },
    { id: 'chart-decreasing', e: '📉', n: 'กราฟลง', k: '' },
    { id: 'file-folder', e: '📁', n: 'แฟ้ม', k: '' },
    { id: 'open-file-folder', e: '📂', n: 'แฟ้มเปิด', k: '' },
    { id: 'card-index-dividers', e: '🗂️ 🗂', n: 'แฟ้มแยกหมวด', k: '' },
    { id: 'calendar', e: '📅', n: 'ปฏิทิน', k: 'นัดหมาย' },
    { id: 'spiral-calendar', e: '🗓️ 🗓', n: 'ปฏิทินสันห่วง', k: '' },
    { id: 'books', e: '📚', n: 'หนังสือ', k: 'คู่มือ' },
    { id: 'blue-book', e: '📘', n: 'หนังสือปกน้ำเงิน', k: '' },
    { id: 'bookmark-tabs', e: '📑', n: 'แท็บเอกสาร', k: '' },
    { id: 'bookmark', e: '🔖', n: 'ที่คั่นหนังสือ', k: '' },
    { id: 'newspaper', e: '📰', n: 'ข่าว', k: '' },
    { id: 'receipt', e: '🧾', n: 'ใบเสร็จ', k: 'การเงิน' },
    { id: 'package', e: '📦', n: 'พัสดุ', k: 'วัสดุ' },
    { id: 'label', e: '🏷️ 🏷', n: 'ป้ายราคา', k: '' },
    { id: 'paperclip', e: '📎', n: 'คลิปหนีบ', k: 'แนบไฟล์' },
    { id: 'pencil', e: '✏️ ✏', n: 'ดินสอ', k: 'แก้ไข' },
    { id: 'wastebasket', e: '🗑️ 🗑', n: 'ถังขยะ', k: 'ลบ' },
    { id: 'envelope', e: '✉️ ✉', n: 'ซองจดหมาย', k: '' },
    { id: 'incoming-envelope', e: '📨', n: 'จดหมายเข้า', k: '' },
    { id: 'inbox-tray', e: '📥', n: 'ถาดรับ', k: 'นำเข้า' },
    { id: 'outbox-tray', e: '📤', n: 'ถาดส่ง', k: 'ส่งออก' },
    { id: 'floppy-disk', e: '💾', n: 'บันทึก (แผ่น)', k: '' },
    { id: 'printer', e: '🖨️ 🖨', n: 'เครื่องพิมพ์', k: '' },
    // ที่ตั้ง / แผนที่
    { id: 'round-pushpin', e: '📍', n: 'หมุดแผนที่', k: 'ตำแหน่ง' },
    { id: 'world-map', e: '🗺️ 🗺', n: 'แผนที่', k: '' },
    { id: 'globe-showing-asia-australia', e: '🌏', n: 'โลก', k: '' },
    { id: 'compass', e: '🧭', n: 'เข็มทิศ', k: '' },
    { id: 'straight-ruler', e: '📏', n: 'ไม้บรรทัด', k: 'ระยะ วัด' },
    { id: 'triangular-ruler', e: '📐', n: 'ฉาก', k: 'แบบ' },
    { id: 'house', e: '🏠', n: 'บ้าน', k: '' },
    { id: 'office-building', e: '🏢', n: 'อาคาร', k: 'หน่วยงาน' },
    { id: 'hospital', e: '🏥', n: 'โรงพยาบาล', k: '' },
    { id: 'deciduous-tree', e: '🌳', n: 'ต้นไม้', k: '' },
    { id: 'seedling', e: '🌱', n: 'ต้นกล้า', k: '' },
    { id: 'sun', e: '☀️ ☀', n: 'ดวงอาทิตย์', k: '' },
    // ความปลอดภัย / สิทธิ์ / สถานะ
    { id: 'locked', e: '🔒', n: 'ล็อก', k: '' },
    { id: 'key', e: '🔑', n: 'กุญแจ', k: '' },
    { id: 'shield', e: '🛡️ 🛡', n: 'โล่', k: 'ป้องกัน' },
    { id: 'crown', e: '👑', n: 'มงกุฎ', k: 'เจ้าของ' },
    { id: 'eye', e: '👁️ 👁', n: 'ตา', k: 'ดู' },
    { id: 'star', e: '⭐', n: 'ดาว', k: '' },
    { id: 'sports-medal', e: '🏅', n: 'เหรียญ', k: '' },
    { id: 'check-mark-button', e: '✅', n: 'ถูกต้อง', k: '' },
    { id: 'cross-mark', e: '❌', n: 'กากบาท', k: '' },
    { id: 'identification-card', e: '🪪', n: 'บัตรประจำตัว', k: '' },
    { id: 'busts-in-silhouette', e: '👥', n: 'กลุ่มคน', k: 'บุคลากร' },
    { id: 'handshake', e: '🤝', n: 'จับมือ', k: '' },
    // สื่อสาร / อุปกรณ์
    { id: 'bell', e: '🔔', n: 'กระดิ่ง', k: 'แจ้งเตือน' },
    { id: 'megaphone', e: '📣', n: 'โทรโข่ง', k: 'ประกาศ' },
    { id: 'telephone', e: '☎️ ☎', n: 'โทรศัพท์', k: '' },
    { id: 'telephone-receiver', e: '📞', n: 'หูโทรศัพท์', k: '' },
    { id: 'mobile-phone', e: '📱', n: 'มือถือ', k: '' },
    { id: 'laptop', e: '💻', n: 'แล็ปท็อป', k: '' },
    { id: 'desktop-computer', e: '🖥️ 🖥', n: 'คอมพิวเตอร์', k: '' },
    { id: 'camera', e: '📷', n: 'กล้อง', k: 'รูปภาพ' },
    { id: 'satellite-antenna', e: '📡', n: 'เสาอากาศ', k: '' },
    { id: 'robot', e: '🤖', n: 'หุ่นยนต์', k: 'เอไอ' },
    { id: 'light-bulb', e: '💡', n: 'หลอดไฟ', k: 'ไอเดีย' },
    { id: 'magnifying-glass-tilted-left', e: '🔍', n: 'แว่นขยาย', k: 'ค้นหา' },
    { id: 'money-bag', e: '💰', n: 'ถุงเงิน', k: 'การเงิน' },
    { id: 'coin', e: '🪙', n: 'เหรียญเงิน', k: '' },
    { id: 'credit-card', e: '💳', n: 'บัตรเครดิต', k: '' }
  ];

  function norm(s) { return String(s || '').replace(/️/g, '').trim(); }
  var byId = {}, byEmoji = {};
  LIB.forEach(function (it) {
    byId[it.id] = it;
    it.e.split(' ').forEach(function (e) { if (e) byEmoji[norm(e)] = it; });
  });

  window.IconLib = {
    list: LIB,
    // หาไอคอนจากค่าที่เก็บ: id หรืออิโมจิเดิม — ไม่เจอคืน null
    find: function (v) { v = norm(v); return byId[v] || byEmoji[v] || null; },
    src: function (it) { return 'assets/icons/' + it.id + '.png'; },
    // HTML ของไอคอน: เจอในห้องสมุด → <img>, ไม่เจอ → แสดงข้อความ/อิโมจิเดิม
    html: function (v, fallback) {
      var it = this.find(v);
      if (it) return '<img class="app-icon-img" src="' + this.src(it) + '" alt="' + it.n + '" draggable="false">';
      return String(v || fallback || '🔗').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    }
  };
})();
