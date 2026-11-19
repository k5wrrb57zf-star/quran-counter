import { ABWAB, LESSONS, MASAIL, lessonVerses } from '../data.js';
import { store } from '../store.js';
import { I } from '../icons.js';
import { esc, AR, levelName } from '../ui.js';
import { babProgress } from './home.js';

const vrange = (arr) => {
  if (!arr.length) return '';
  const out = [];
  let a = arr[0];
  let p = a;
  for (const x of arr.slice(1).concat([null])) {
    if (x === p + 1) { p = x; continue; }
    out.push(a === p ? AR(a) : `${AR(a)}–${AR(p)}`);
    a = p = x;
  }
  return out.join('، ');
};
export { vrange };

function mastery(best) {
  const n = best >= 90 ? 3 : best >= 70 ? 2 : best > 0 ? 1 : 0;
  return `<span class="mastery" title="مستوى الإتقان">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>`;
}

export async function render(el, _p, params) {
  const open = params.open;
  const showMasail = params.masail === '1';
  el.innerHTML = `<div class="wrap narrow">
    <h1>المنهج</h1>
    <p class="muted">أبواب مرتبة بحسب موضوعات التجويد، وتحت كل باب دروسه ومسائله، مع بيان موضعها من المتنين. يمكنك أيضًا قراءة <a href="#/mutun">المتنين بترتيبهما الأصلي</a> مع روابط كل بيت إلى درسه.</p>
    <div class="row" style="margin:14px 0"><a class="btn sm ${showMasail ? 'primary' : ''}" href="#/curriculum?masail=${showMasail ? '0' : '1'}">${showMasail ? 'إخفاء المسائل' : 'إظهار المسائل الجزئية'}</a><a class="btn sm" href="#/map">${I.map} خريطة التحقق</a><span class="spacer"></span><button class="btn sm ghost" id="toggle-all">فتح الكل</button></div>
    <div class="tree">${ABWAB.map((b) => {
      const p = babProgress(b);
      return `<details id="bab-${b.id}" ${open === b.id || (!open && b.n === 1) ? 'open' : ''}>
        <summary><span class="bab-ic">${I[b.icon] || AR(b.n)}</span><div style="min-width:0"><div class="muted small">الباب ${AR(b.n)} · ${AR(p.done)}/${AR(p.total)}</div><h3>${esc(b.title)}</h3></div><span class="chev">${I.chevL}</span></summary>
        <div class="lessons">
          ${b.lessons.map((id, k) => {
            const L = LESSONS[id];
            const st = store.lesson(id);
            const v = lessonVerses(id);
            const src = [v.t.length ? `التحفة: ${vrange(v.t)}` : '', v.j.length ? `الجزرية: ${vrange(v.j)}` : ''].filter(Boolean).join(' · ');
            const ms = showMasail ? MASAIL.filter((m) => m.lessons.includes(id)) : [];
            return `<a class="lesson-row ${st.done ? 'done' : st.seen ? 'seen' : ''}" href="#/lesson/${id}"><span class="num">${st.done ? '✓' : AR(k + 1)}</span><span class="t"><b>${esc(L.title)}</b><small>${esc(levelName(L.level))} · ${AR(L.mins)} دقيقة${src ? ' · ' + src : ''}</small></span>${mastery(st.best || 0)}${store.isBookmarked(id) ? `<span style="color:var(--gold);width:18px">${I.starFill}</span>` : ''}</a>
            ${ms.length ? `<ul class="masail">${ms.map((m) => `<li><span class="chip">${esc(m.title)}</span></li>`).join('')}</ul>` : ''}`;
          }).join('')}
          <div class="row" style="padding:8px 12px 10px"><a class="btn sm gold" href="#/test/${b.id}">اختبار شامل للباب</a><a class="btn sm" href="#/brief/${b.id}">خلاصة الباب للمراجعة السريعة</a></div>
        </div></details>`;
    }).join('')}</div></div>`;
  const btn = el.querySelector('#toggle-all');
  btn.addEventListener('click', () => {
    const all = [...el.querySelectorAll('details')];
    const openAll = all.some((d) => !d.open);
    all.forEach((d) => (d.open = openAll));
    btn.textContent = openAll ? 'طيّ الكل' : 'فتح الكل';
  });
  if (open) setTimeout(() => el.querySelector(`#bab-${open}`)?.scrollIntoView({ block: 'start' }), 50);
}
