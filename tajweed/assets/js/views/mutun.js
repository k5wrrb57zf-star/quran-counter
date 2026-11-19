import { MUTUN, LESSONS, verseLessons } from '../data.js';
import { esc, AR, verseHTML } from '../ui.js';

// عرض المتنين بترتيبهما الأصلي مع ربط كل بيت بدرسه
export async function render(el, _p, params) {
  const m = params.m === 'jazariyya' ? 'jazariyya' : 'tuhfa';
  const M = MUTUN[m];
  el.innerHTML = `<div class="wrap narrow matn-page">
    <div class="tabs" role="tablist"><a class="btn sm ${m === 'tuhfa' ? 'primary' : ''}" href="#/mutun?m=tuhfa">تحفة الأطفال</a><a class="btn sm ${m === 'jazariyya' ? 'primary' : ''}" href="#/mutun?m=jazariyya">المقدمة الجزرية</a></div>
    <h1 style="margin-top:16px">${esc(M.title)}</h1>
    <p><b>الناظم:</b> ${esc(M.author)}</p>
    <p class="muted">${esc(M.about)}</p>
    <div class="note small">${esc(M.edition)} <a href="${M.sourceUrl}" target="_blank" rel="noopener">المصدر</a>. تحت كل بيت روابط الدروس التي تشرح مسائله.</div>
    <div class="row" style="margin:12px 0"><span class="small muted">الأبواب:</span>${M.sections.map((s, k) => `<a class="chip" href="#/mutun?m=${m}#sec-${k}" data-sec="${k}">${esc(s.title)}</a>`).join('')}</div>
    ${M.sections.map((s, k) => `<section class="matn-sec" id="sec-${k}"><h3>${esc(s.title)} <span class="small muted" style="font-family:var(--font-ui)">(${AR(s.from)}–${AR(s.to)})</span></h3>
      ${M.verses.filter((v) => v.n >= s.from && v.n <= s.to).map((v) => {
        const ls = verseLessons(m, v.n);
        return `${verseHTML(m, v.n)}${ls.length ? `<div class="vlinks">${ls.map((id) => `<a class="chip green" href="#/lesson/${id}">${esc(LESSONS[id].title)}</a>`).join('')}</div>` : `<div class="vlinks"><span class="chip">مقدمة أو خاتمة</span></div>`}`;
      }).join('')}</section>`).join('')}
  </div>`;
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-sec]');
    if (!a) return;
    e.preventDefault();
    el.querySelector('#sec-' + a.dataset.sec)?.scrollIntoView({ behavior: 'smooth' });
  });
  const anchor = location.hash.split('#')[2];
  if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ block: 'center' }), 60);
}
