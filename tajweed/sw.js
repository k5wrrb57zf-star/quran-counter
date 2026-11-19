// عامل الخدمة: يتيح استعمال المنصة دون اتصال بعد الزيارة الأولى
// الاستراتيجية: الشبكة أولًا للمحتوى (لضمان التحديث)، ثم الذاكرة المؤقتة عند انقطاع الاتصال
const CACHE = 'itqan-2a3885997a';
// ملفات تُخزَّن عند التثبيت ليعمل الموقع دون اتصال؛ تُحدَّث هذه القائمة ورقم النسخة آليًّا عند تشغيل tools/verify.mjs
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./assets/css/app.css","./assets/icons/icon-192.png","./assets/icons/icon.svg","./assets/js/app.js","./assets/js/data.js","./assets/js/diagrams.js","./assets/js/icons.js","./assets/js/quiz.js","./assets/js/store.js","./assets/js/ui.js","./assets/js/views/about.js","./assets/js/views/brief.js","./assets/js/views/curriculum.js","./assets/js/views/home.js","./assets/js/views/lesson.js","./assets/js/views/letters.js","./assets/js/views/map.js","./assets/js/views/mutun.js","./assets/js/views/practice.js","./assets/js/views/review.js","./assets/js/views/saved.js","./assets/js/views/search.js","./assets/js/views/test.js","./content/curriculum.js","./content/lessons/ghunna.js","./content/lessons/idgham.js","./content/lessons/lam.js","./content/lessons/madd.js","./content/lessons/madkhal.js","./content/lessons/makharij.js","./content/lessons/meem.js","./content/lessons/noon.js","./content/lessons/rasm.js","./content/lessons/sifat.js","./content/lessons/tafkhim.js","./content/lessons/tahdhir.js","./content/lessons/waqf.js","./content/lessons/wasl.js","./content/letters.js","./content/mutun.js","./content/practice.js","./content/rules.js","./data/quran-snippets.json","./data/verification.json"];
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {})))));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('.mp3')) return; // التلاوات لا تُخزَّن
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
