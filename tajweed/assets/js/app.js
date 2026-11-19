// نقطة الانطلاق: الهيكل العام والتوجيه بين الصفحات
import { I } from './icons.js';
import { store } from './store.js';
import { loadSnippets } from './data.js';
import { initAudio, stopAudio, modal, toast, esc } from './ui.js';

const routes = {
  '': () => import('./views/home.js'),
  curriculum: () => import('./views/curriculum.js'),
  lesson: () => import('./views/lesson.js'),
  practice: () => import('./views/practice.js'),
  review: () => import('./views/review.js'),
  test: () => import('./views/test.js'),
  brief: () => import('./views/brief.js'),
  mutun: () => import('./views/mutun.js'),
  letters: () => import('./views/letters.js'),
  map: () => import('./views/map.js'),
  search: () => import('./views/search.js'),
  saved: () => import('./views/saved.js'),
  about: () => import('./views/about.js'),
};

const NAV = [
  ['', 'الرئيسية', 'home'],
  ['curriculum', 'المنهج', 'tree'],
  ['practice', 'التدريب', 'target'],
  ['review', 'المراجعة', 'review'],
  ['mutun', 'المتنان', 'scroll'],
];

function applySettings() {
  const t = store.setting('theme');
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  document.documentElement.setAttribute('data-font', store.setting('font') || 'm');
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f1613' : '#f8f5ee');
  const tb = document.getElementById('theme-btn');
  if (tb) tb.innerHTML = dark ? I.sun : I.moon;
}

function shell() {
  document.getElementById('app-shell').innerHTML = `
  <a class="skip" href="#main">تخطَّ إلى المحتوى</a>
  <header class="top">
    <a class="brand" href="#/" aria-label="إتقان — الصفحة الرئيسية"><span class="brand-mark">${I.logo}</span><span><b>إتقان</b><small>منصة تعلّم التجويد</small></span></a>
    <nav class="nav" aria-label="التنقل الرئيسي">${NAV.map(([r, t]) => `<a href="#/${r}" data-r="${r}">${t}</a>`).join('')}</nav>
    <div class="top-tools">
      <a class="icon-btn" href="#/search" aria-label="البحث">${I.search}</a>
      <button class="icon-btn" id="theme-btn" aria-label="تبديل الوضع الليلي"></button>
      <button class="icon-btn" id="more-btn" aria-label="المزيد">${I.more}</button>
    </div>
  </header>
  <div class="read-progress" aria-hidden="true"><i></i></div>
  <main id="main" tabindex="-1"></main>
  <footer class="footer"><div>المادة العلمية مبنية على <a href="#/mutun?m=tuhfa">تحفة الأطفال</a> و<a href="#/mutun?m=jazariyya">المقدمة الجزرية</a> وشروحهما من المكتبة الشاملة. النص القرآني من مصحف المدينة (رواية حفص).</div>
  <div style="margin-top:6px"><a href="#/map">خريطة المنهج والتحقق</a> · <a href="#/letters">الحروف والمخارج</a> · <a href="#/about">عن المنصة والمصادر</a></div></footer>
  <nav class="tabbar" aria-label="التنقل السفلي">${NAV.slice(0, 4).map(([r, t, ic]) => `<a href="#/${r}" data-r="${r}">${I[ic]}<span>${t}</span></a>`).join('')}<a href="#" id="more-tab">${I.more}<span>المزيد</span></a></nav>`;

  document.getElementById('theme-btn').addEventListener('click', () => {
    const cur = store.setting('theme');
    const dark = cur === 'dark' || (cur === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    store.setting('theme', dark ? 'light' : 'dark');
    applySettings();
  });
  const more = (e) => { e?.preventDefault(); openMore(); };
  document.getElementById('more-btn').addEventListener('click', more);
  document.getElementById('more-tab').addEventListener('click', more);
}

function openMore() {
  const links = [
    ['#/mutun', 'المتنان: تحفة الأطفال والمقدمة الجزرية', 'scroll'],
    ['#/letters', 'الحروف: المخارج والصفات', 'mouth'],
    ['#/saved', 'الدروس المحفوظة', 'star'],
    ['#/map', 'خريطة المنهج والتحقق من الاكتمال', 'map'],
    ['#/search', 'البحث', 'search'],
    ['#/about', 'عن المنصة والمصادر والإعدادات', 'info'],
  ];
  modal(`<div class="row" style="margin-bottom:8px"><h3 style="margin:0">المزيد</h3><span class="spacer"></span><button class="icon-btn" data-close aria-label="إغلاق">${I.x}</button></div>
    <div class="grid" style="gap:8px">${links.map(([h, t, ic]) => `<a class="lesson-row" href="${h}" data-close><span class="bab-ic" style="width:36px;height:36px">${I[ic]}</span><span class="t"><b>${t}</b></span></a>`).join('')}</div>
    ${settingsHTML()}`, bindSettings);
}

export function settingsHTML() {
  const t = store.setting('theme');
  const f = store.setting('font') || 'm';
  return `<div style="margin-top:14px"><div class="settings-row"><span>المظهر</span><div class="seg" data-set="theme">${[['auto', 'تلقائي'], ['light', 'نهاري'], ['dark', 'ليلي']].map(([v, l]) => `<button data-v="${v}" class="${t === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
  <div class="settings-row"><span>حجم الخط</span><div class="seg" data-set="font">${[['s', 'صغير'], ['m', 'متوسط'], ['l', 'كبير'], ['xl', 'أكبر']].map(([v, l]) => `<button data-v="${v}" class="${f === v ? 'on' : ''}">${l}</button>`).join('')}</div></div></div>`;
}
export function bindSettings(root) {
  root.querySelectorAll('[data-set]').forEach((seg) =>
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      store.setting(seg.dataset.set, b.dataset.v);
      seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      applySettings();
    }),
  );
}

let cleanup = null;
let renderId = 0;
async function route() {
  const id = ++renderId;
  stopAudio();
  cleanup?.();
  cleanup = null;
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const name = routes[parts[0] || ''] ? parts[0] || '' : '';
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  document.querySelectorAll('[data-r]').forEach((a) => a.classList.toggle('on', a.dataset.r === (name === 'lesson' || name === 'brief' || name === 'test' ? 'curriculum' : name)));
  const main = document.getElementById('main');
  document.querySelector('.read-progress > i').style.width = '0';
  try {
    const mod = await routes[name]();
    if (id !== renderId) return;
    main.innerHTML = '';
    const view = document.createElement('div');
    view.className = 'view';
    main.append(view);
    cleanup = (await mod.render(view, parts.slice(1), params)) || null;
    if (!location.hash.includes('#s-')) window.scrollTo({ top: 0 });
    const h1 = view.querySelector('h1');
    document.title = (h1 ? h1.textContent.trim() + ' — ' : '') + 'إتقان | منصة تعلّم التجويد';
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="wrap"><div class="card empty"><h2>تعذّر عرض الصفحة</h2><p>${esc(err.message)}</p><a class="btn" href="#/">العودة إلى الرئيسية</a></div></div>`;
  }
}

async function boot() {
  applySettings();
  shell();
  applySettings();
  initAudio();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applySettings);
  await loadSnippets();
  window.addEventListener('hashchange', route);
  await route();
  if (!store.persistent) toast('تنبيه: حفظ التقدم غير متاح في هذا المتصفح (الوضع الخاص).');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
boot();
