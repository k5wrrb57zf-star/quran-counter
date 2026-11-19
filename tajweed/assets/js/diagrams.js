// الرسوم التعليمية: مخطط المخارج التفاعلي، ومقادير المدود
import { esc, AR } from './ui.js';
import { loadLetters } from './data.js';

// ---------- مخطط المخارج (مقطع جانبي مبسط للفم والحلق) ----------
export async function mountMakharij(el, { focus = null } = {}) {
  const { MAKHARIJ } = await loadLetters();
  const svg = `
<svg viewBox="0 0 480 360" role="img" aria-label="مقطع جانبي مبسط للفم والحلق تظهر عليه مواضع المخارج">
  <defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="var(--gold)" stop-opacity=".35"/><stop offset="1" stop-color="var(--gold)" stop-opacity=".18"/></linearGradient></defs>
  <!-- الرأس -->
  <path d="M330 18 C 240 6 150 30 118 96 C 96 142 104 200 112 238 L 116 352" fill="none" stroke="var(--line-2)" stroke-width="2"/>
  <path d="M330 18 C 382 30 412 70 420 104 L 452 150 C 456 158 450 162 440 163 L 444 176 C 448 182 446 186 440 189 L 448 200 C 452 212 446 222 440 230 C 432 244 412 262 384 268 C 350 276 316 282 300 300 L 296 352" fill="none" stroke="var(--line-2)" stroke-width="2"/>
  <!-- تجويف الأنف والخيشوم -->
  <path d="M440 163 C 380 150 300 138 240 136 C 205 135 186 146 178 166" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="4 4"/>
  <path d="M430 120 C 370 104 290 100 230 112" fill="none" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="2 5" opacity=".7"/>
  <!-- الحنك الأعلى (الصلب واللين) واللهاة -->
  <path d="M410 196 C 380 176 340 168 300 170 C 262 172 230 178 206 190 C 196 196 190 204 186 214" fill="none" stroke="var(--text-2)" stroke-width="2.4"/>
  <path d="M190 206 C 186 216 188 226 194 230" fill="none" stroke="var(--text-2)" stroke-width="2"/>
  <!-- الأسنان -->
  <rect x="406" y="194" width="10" height="20" rx="3" fill="var(--surface)" stroke="var(--text-2)" stroke-width="1.6"/>
  <rect x="404" y="220" width="10" height="18" rx="3" fill="var(--surface)" stroke="var(--text-2)" stroke-width="1.6"/>
  <rect x="352" y="186" width="18" height="12" rx="3" fill="var(--surface)" stroke="var(--text-2)" stroke-width="1.2" opacity=".8"/>
  <!-- الشفتان -->
  <path d="M440 189 C 432 192 424 196 418 204" fill="none" stroke="var(--text-2)" stroke-width="3" stroke-linecap="round"/>
  <path d="M440 200 C 432 206 424 214 416 222" fill="none" stroke="var(--text-2)" stroke-width="3" stroke-linecap="round"/>
  <!-- اللسان -->
  <path d="M402 218 C 396 206 372 198 340 198 C 296 198 252 204 222 222 C 200 236 196 262 198 300 L 252 302 C 290 290 338 266 372 248 C 392 238 404 230 402 218 Z" fill="url(#tg)" stroke="var(--gold)" stroke-width="2"/>
  <!-- الحلق والحنجرة -->
  <path d="M178 166 C 172 200 170 250 172 352" fill="none" stroke="var(--text-2)" stroke-width="2.4"/>
  <path d="M198 300 C 200 318 204 336 206 352" fill="none" stroke="var(--text-2)" stroke-width="2.4"/>
  <path d="M176 318 L 202 314" stroke="var(--text-2)" stroke-width="2"/>
  <text x="300" y="340" font-size="11" fill="var(--muted)" font-family="IBM Plex Sans Arabic" text-anchor="middle">مقطع جانبي تعليمي مبسط</text>
  <g class="mk-points">
  ${MAKHARIJ.map((m) => `<g class="mk-zone" data-id="${m.id}" tabindex="0" role="button" aria-label="${esc(m.name)}: ${esc(m.letters)}"><circle cx="${m.x}" cy="${m.y}" r="9"/><text x="${m.x}" y="${m.y + 4}" text-anchor="middle" font-size="10" fill="#fff" style="pointer-events:none">${AR(m.n)}</text></g>`).join('')}
  </g>
</svg>`;
  el.innerHTML = `<div class="diagram">${svg}<div class="mk-legend">${MAKHARIJ.map((m) => `<button data-id="${m.id}">${AR(m.n)}. ${esc(m.short)}</button>`).join('')}</div><div class="mk-info" aria-live="polite"><span class="muted">اختر مخرجًا من الرسم أو من القائمة لعرض حروفه وموضعه.</span></div></div>`;
  const info = el.querySelector('.mk-info');
  const select = (id) => {
    const m = MAKHARIJ.find((x) => x.id === id);
    if (!m) return;
    el.querySelectorAll('[data-id]').forEach((x) => x.classList.toggle('on', x.dataset.id === id));
    info.innerHTML = `<div class="row"><b>${AR(m.n)}. ${esc(m.name)}</b><span class="chip green">${esc(m.general)}</span></div><div class="letters">${esc(m.letters)}</div><div>${esc(m.place)}</div>`;
  };
  el.addEventListener('click', (e) => { const z = e.target.closest('[data-id]'); if (z) select(z.dataset.id); });
  el.addEventListener('keydown', (e) => { const z = e.target.closest('.mk-zone'); if (z && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(z.dataset.id); } });
  if (focus) select(focus);
  return select;
}

// ---------- مقادير المدود ----------
export const MAD_TABLE = [
  { name: 'المد الطبيعي', min: 2, max: 2, note: 'حركتان' },
  { name: 'المتصل', min: 4, max: 5, extra: 6, note: '4 أو 5، و6 عند الوقف على المتطرف' },
  { name: 'المنفصل', min: 4, max: 5, note: '4 أو 5 لحفص من الشاطبية' },
  { name: 'العارض للسكون', min: 2, max: 6, note: '2 أو 4 أو 6' },
  { name: 'اللين عند الوقف', min: 2, max: 6, note: '2 أو 4 أو 6' },
  { name: 'البدل', min: 2, max: 2, note: 'حركتان لحفص' },
  { name: 'اللازم', min: 6, max: 6, note: '6 حركات' },
  { name: 'عين (مريم والشورى)', min: 4, max: 6, note: '4 أو 6، والطول أولى' },
  { name: '«حي طهر» في الفواتح', min: 2, max: 2, note: 'حركتان' },
];
export function madBarsHTML(rows = MAD_TABLE) {
  return `<div class="diagram"><div class="mad-bars">${rows
    .map(
      (r) => `<div class="mad-row"><div class="lbl"><b>${esc(r.name)}</b></div><div class="mad-units">${[1, 2, 3, 4, 5, 6]
        .map((u) => `<i style="--i:${u}" class="${u <= r.min ? 'on' : u <= (r.extra || r.max) ? 'opt' : ''}"></i>`)
        .join('')}</div><div class="val">${AR(esc(r.note.split('،')[0]))}</div></div>`,
    )
    .join('')}</div>
    <div class="legend"><span><i style="background:var(--primary)"></i>المقدار الأدنى</span><span><i style="background:var(--gold)"></i>ما يجوز الزيادة إليه</span><span>كل خانة = حركة واحدة</span></div>
    <div class="row" style="margin-top:10px"><button class="btn sm mad-play">شغّل العدّ</button><span class="small muted">الحركة: مقدار قبض الإصبع أو بسطه بحركة معتدلة.</span></div></div>`;
}
export function bindMadBars(el) {
  el.querySelector('.mad-play')?.addEventListener('click', () => {
    el.querySelectorAll('.mad-units').forEach((u) => { u.classList.remove('play'); void u.offsetWidth; u.classList.add('play'); });
  });
}
