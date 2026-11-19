import { ABWAB, LESSONS, ORDER, BAB, allBodies, loadBab } from '../data.js';
import { store } from '../store.js';
import { I } from '../icons.js';
import { esc, AR, ring, shuffle } from '../ui.js';

export function babProgress(b) {
  const done = b.lessons.filter((id) => store.lesson(id).done).length;
  const bests = b.lessons.map((id) => store.lesson(id).best || 0);
  const mastery = bests.reduce((a, x) => a + x, 0) / b.lessons.length;
  return { done, total: b.lessons.length, pct: (done / b.lessons.length) * 100, mastery };
}

export async function render(el) {
  const s = store.s;
  const total = ORDER.length;
  const done = ORDER.filter((id) => store.lesson(id).done).length;
  const seen = ORDER.filter((id) => store.lesson(id).seen).length;
  const pct = (done / total) * 100;
  const last = s.last && LESSONS[s.last.id] ? s.last.id : null;
  const nextUp = ORDER.find((id) => !store.lesson(id).done) || ORDER[0];
  const startHref = `#/lesson/${last && !store.lesson(last).done ? last : nextUp}`;
  const mistakes = Object.keys(s.mistakes).length;
  const dueCards = Object.values(s.cards).filter((c) => c.due <= Date.now()).length;
  const streak = store.streak();

  el.innerHTML = `<div class="wrap">
  <section class="hero">
    <svg class="hero-deco" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2">${Array.from({ length: 8 }, (_, k) => `<rect x="40" y="40" width="120" height="120" rx="6" transform="rotate(${k * 11.25} 100 100)"/>`).join('')}<circle cx="100" cy="100" r="30"/></g></svg>
    <h1>أتقِن تلاوتك… حرفًا حرفًا</h1>
    <p>منهج متدرّج في علم التجويد، يشرح كل مسائل <b>تحفة الأطفال</b> و<b>المقدمة الجزرية</b> شرحًا محررًا من شروحهما المعتمدة، بشواهد قرآنية موثّقة، واختبارات وتدريب يربط القاعدة بالتلاوة.</p>
    <div class="row">
      <a class="btn primary" href="${startHref}">${last ? 'تابع التعلم' : 'ابدأ التعلم'}</a>
      <a class="btn outline" href="#/test/placement">اختبر مستواك</a>
    </div>
    <div class="hero-matn">«وَهُوَ إِعْطَاءُ الحُرُوفِ حَقَّهَا ... مِنْ صِفَةٍ لَهَا وَمُسْتَحَقَّهَا»</div>
  </section>

  <div class="section-title"><h2>تقدّمك</h2></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))">
    <div class="card row" style="gap:18px">${ring(pct)}<div><h3 style="margin:0">${AR(done)} من ${AR(total)} درسًا</h3><div class="muted small">أنهيت ${AR(Math.round(pct))}٪ من المنهج، وزرت ${AR(seen)} درسًا.</div><div class="bar" style="margin-top:10px;width:220px;max-width:100%"><i style="width:${pct}%"></i></div></div></div>
    ${last ? `<a class="card" href="#/lesson/${last}"><div class="muted small">آخر درس زرته</div><h3 style="margin:.2em 0">${esc(LESSONS[last].title)}</h3><div class="small muted">${esc(BAB[LESSONS[last].bab].title)}</div><div class="row" style="margin-top:8px"><span class="btn sm primary">متابعة الدرس</span></div></a>`
      : `<a class="card" href="#/lesson/${ORDER[0]}"><div class="muted small">ابدأ من هنا</div><h3 style="margin:.2em 0">${esc(LESSONS[ORDER[0]].title)}</h3><div class="small muted">الدرس الأول في المنهج</div></a>`}
    <div class="stat-row" style="grid-template-columns:repeat(3,1fr)">
      <a class="stat" href="#/review?tab=mistakes"><b>${AR(mistakes)}</b><span>أخطاء للمراجعة</span></a>
      <a class="stat" href="#/review?tab=cards"><b>${AR(dueCards)}</b><span>بطاقات مستحقة</span></a>
      <div class="stat"><b>${AR(streak)}</b><span>أيام متتالية</span></div>
    </div>
  </div>

  <div class="section-title"><h2>مراجعة سريعة</h2><a href="#/review">كل المراجعات</a></div>
  <div id="quick" class="grid g3"><div class="card muted small">جارٍ تحضير المراجعة…</div></div>

  <div class="section-title"><h2>أبواب التجويد</h2><a href="#/curriculum">عرض المنهج كاملًا</a></div>
  <div class="grid g3">${ABWAB.map((b) => {
    const p = babProgress(b);
    return `<a class="card bab-card" href="#/curriculum?open=${b.id}"><div class="bab-top"><span class="bab-ic">${I[b.icon] || AR(b.n)}</span><div><div class="muted small">الباب ${AR(b.n)}</div><h3 style="margin:0">${esc(b.title)}</h3></div></div><p>${esc(b.desc)}</p><div class="bar"><i style="width:${p.pct}%"></i></div><div class="meta"><span>${AR(p.done)}/${AR(p.total)} دروس</span><span>${b.tuhfa.length ? 'التحفة' : ''}${b.tuhfa.length && b.jazari.length ? ' · ' : ''}${b.jazari.length ? 'الجزرية' : ''}</span></div></a>`;
  }).join('')}</div>

  <div class="section-title"><h2>المتنان</h2></div>
  <div class="grid g2">
    <a class="card" href="#/mutun?m=tuhfa"><div class="row">${I.scroll}<h3 style="margin:0">تحفة الأطفال والغلمان</h3></div><p class="muted small" style="margin:.4em 0 0">للشيخ سليمان الجمزوري — ٦١ بيتًا في النون والتنوين والميم واللامات والمثلين والمدود.</p></a>
    <a class="card" href="#/mutun?m=jazariyya"><div class="row">${I.scroll}<h3 style="margin:0">المقدمة الجزرية</h3></div><p class="muted small" style="margin:.4em 0 0">للإمام ابن الجزري — ١٠٧ أبيات فيما على قارئ القرآن أن يعلمه.</p></a>
  </div>
  </div>`;

  // مراجعة سريعة: خلاصات من الدروس التي مرّ بها المتعلم (أو من أوائل المنهج)
  const pool = ORDER.filter((id) => store.lesson(id).seen);
  const ids = shuffle(pool.length ? pool : ORDER.slice(0, 4)).slice(0, 3);
  const items = await Promise.all(ids.map(async (id) => ({ id, body: (await loadBab(LESSONS[id].bab))[id] })));
  const q = el.querySelector('#quick');
  if (!q) return;
  const cards = items.filter((x) => x.body?.summary?.length);
  q.innerHTML = cards.length
    ? cards.map(({ id, body }) => `<a class="card" href="#/lesson/${id}#s-summary"><div class="muted small">${esc(LESSONS[id].title)}</div><ul style="margin:.4em 0 0;padding-inline-start:1.1em">${body.summary.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></a>`).join('')
    : `<div class="card muted small">ابدأ أول درس لتظهر هنا خلاصات ما تعلمته.</div>`;
  void allBodies;
}
