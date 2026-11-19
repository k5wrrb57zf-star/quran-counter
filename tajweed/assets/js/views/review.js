import { ABWAB, LESSONS, ORDER, BAB, allBodies, lessonQuestions } from '../data.js';
import { store } from '../store.js';
import { I } from '../icons.js';
import { esc, AR, ring, rich } from '../ui.js';
import { openCards } from './lesson.js';
import { babProgress } from './home.js';

const TABS = [
  ['need', 'تحتاج مراجعة'],
  ['mistakes', 'أخطائي'],
  ['cards', 'البطاقات'],
  ['tests', 'الاختبارات'],
  ['mastery', 'الإتقان'],
];

export async function render(el, _p, params) {
  const tab = TABS.some(([k]) => k === params.tab) ? params.tab : 'need';
  el.innerHTML = `<div class="wrap narrow"><h1>المراجعة</h1><p class="muted">كل ما يحتاج إلى تثبيت في مكان واحد: الدروس الضعيفة، والأخطاء المتكررة، والبطاقات المستحقة، والاختبارات، ونسبة الإتقان لكل باب.</p>
  <div class="tabs" role="tablist">${TABS.map(([k, t]) => `<button role="tab" aria-selected="${k === tab}" class="${k === tab ? 'on' : ''}" data-tab="${k}">${t}</button>`).join('')}</div><div id="pane" style="margin-top:18px"></div></div>`;
  el.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) location.hash = `#/review?tab=${b.dataset.tab}`;
  });
  const pane = el.querySelector('#pane');
  const bodies = await allBodies();
  const s = store.s;

  if (tab === 'need') {
    const rows = ORDER.map((id) => ({ id, st: store.lesson(id) }))
      .filter(({ id, st }) => (st.seen && !st.done) || (st.best && st.best < 80) || s.bookmarks.includes(id) || Object.values(s.mistakes).some((m) => m.lesson === id));
    pane.innerHTML = rows.length
      ? `<div class="grid">${rows.map(({ id, st }) => {
          const reasons = [];
          if (s.bookmarks.includes(id)) reasons.push('<span class="chip gold">محفوظ</span>');
          if (st.seen && !st.done) reasons.push('<span class="chip">لم يكتمل</span>');
          if (st.best && st.best < 80) reasons.push(`<span class="chip bad">أفضل نتيجة ${AR(st.best)}٪</span>`);
          const nm = Object.values(s.mistakes).filter((m) => m.lesson === id).length;
          if (nm) reasons.push(`<span class="chip bad">${AR(nm)} أخطاء</span>`);
          return `<a class="card" href="#/lesson/${id}"><div class="row"><b>${esc(LESSONS[id].title)}</b><span class="spacer"></span>${reasons.join('')}</div><div class="small muted">${esc(BAB[LESSONS[id].bab].title)}</div></a>`;
        }).join('')}</div>`
      : `<div class="card empty">لا توجد دروس تحتاج مراجعة الآن. ادرس درسًا جديدًا أو جرّب <a href="#/test/mix">اختبارًا متنوعًا</a>.</div>`;
  }

  if (tab === 'mistakes') {
    const all = ORDER.flatMap((id) => lessonQuestions(id, bodies[id]));
    const mis = all.filter((q) => s.mistakes[q.id]).sort((a, b) => s.mistakes[b.id].n - s.mistakes[a.id].n);
    pane.innerHTML = mis.length
      ? `<div class="row" style="margin-bottom:12px"><span class="muted">${AR(mis.length)} سؤالًا أخطأت فيها، مرتبة بحسب تكرار الخطأ.</span><span class="spacer"></span><a class="btn primary" href="#/test/mistakes">أعد حلّها الآن</a></div>
        <div class="grid">${mis.slice(0, 40).map((q) => `<div class="card"><div class="row"><span class="chip bad">أخطأت ${AR(s.mistakes[q.id].n)}×</span><a class="small" href="#/lesson/${q.lesson}">${esc(LESSONS[q.lesson].title)}</a></div><div style="margin-top:6px">${rich(esc(q.q))}</div>${q.e ? `<div class="small muted" style="margin-top:4px">${rich(esc(q.e))}</div>` : ''}</div>`).join('')}</div>`
      : `<div class="card empty">لا أخطاء مسجلة. كل إجابة خاطئة في الاختبارات تظهر هنا حتى تتقنها.</div>`;
  }

  if (tab === 'cards') {
    const cards = ORDER.flatMap((id) => (bodies[id]?.cards || []).map((c, k) => ({ ...c, cid: `${id}#c${k}`, lesson: id })));
    const due = cards.filter((c) => store.card(c.cid).due <= Date.now());
    const learned = cards.filter((c) => store.card(c.cid).box >= 3).length;
    pane.innerHTML = `<div class="grid g2"><div class="card row">${ring(cards.length ? (learned / cards.length) * 100 : 0)}<div><b>${AR(cards.length)} بطاقة</b><div class="small muted">ثبت منها ${AR(learned)}، والمستحق الآن ${AR(due.length)}.</div></div></div>
      <div class="card"><b>نظام التكرار المتباعد</b><p class="small muted" style="margin:.3em 0 .6em">البطاقة التي تتذكرها تتباعد مراجعتها (يوم، يومان، أربعة، ثمانية، ستة عشر)، والتي تنساها تعود غدًا.</p><button class="btn primary" id="go" ${due.length ? '' : 'disabled'}>${I.cards} راجع ${AR(Math.min(due.length, 20))} بطاقة</button></div></div>
      <h3 style="margin-top:20px">بطاقات حسب الباب</h3><div class="grid g3">${ABWAB.map((b) => {
        const bc = cards.filter((c) => LESSONS[c.lesson].bab === b.id);
        return bc.length ? `<button class="card" style="text-align:start;cursor:pointer" data-bab="${b.id}"><b>${esc(b.title)}</b><div class="small muted">${AR(bc.length)} بطاقة</div></button>` : '';
      }).join('')}</div>`;
    pane.querySelector('#go')?.addEventListener('click', () => openCards(null, null, due.slice(0, 20)));
    pane.querySelectorAll('[data-bab]').forEach((b) => b.addEventListener('click', () => openCards(null, null, cards.filter((c) => LESSONS[c.lesson].bab === b.dataset.bab))));
  }

  if (tab === 'tests') {
    pane.innerHTML = `<div class="grid g2">
      <a class="card" href="#/test/mix"><b>اختبار متنوع سريع</b><div class="small muted">١٢ سؤالًا من الدروس التي درستها.</div></a>
      <a class="card" href="#/test/mistakes"><b>اختبار الأخطاء</b><div class="small muted">أعد حل ما أخطأت فيه.</div></a>
      <a class="card" href="#/test/placement"><b>اختبر مستواك</b><div class="small muted">سؤال من كل باب لتحديد نقطة البداية.</div></a>
      <a class="card" href="#/practice"><b>التدريب القرآني</b><div class="small muted">استخراج الأحكام من الآيات بمستويات متدرجة.</div></a></div>
      <h3 style="margin-top:20px">الاختبارات الشاملة للأبواب</h3><div class="grid g3">${ABWAB.map((b) => {
        const t = s.tests['bab:' + b.id];
        return `<a class="card" href="#/test/${b.id}"><b>${esc(b.title)}</b><div class="small muted">${t ? `أفضل نتيجة ${AR(t.best)}٪` : 'لم يُختبر بعد'}</div><div class="row" style="margin-top:6px"><span class="small"><a href="#/brief/${b.id}">مراجعة سريعة قبل الاختبار</a></span></div></a>`;
      }).join('')}</div>`;
  }

  if (tab === 'mastery') {
    pane.innerHTML = `<div class="grid">${ABWAB.map((b) => {
      const p = babProgress(b);
      const t = s.tests['bab:' + b.id];
      const m = Math.round(t ? (p.mastery + t.best) / 2 : p.mastery);
      return `<div class="card"><div class="row"><b>${esc(b.title)}</b><span class="spacer"></span><span class="small muted">إتقان ${AR(m)}٪</span></div><div class="bar" style="margin:8px 0"><i style="width:${m}%"></i></div><div class="small muted">الدروس المكتملة ${AR(p.done)}/${AR(p.total)} · متوسط نتائج الدروس ${AR(Math.round(p.mastery))}٪ · اختبار الباب ${t ? AR(t.best) + '٪' : '—'}</div></div>`;
    }).join('')}</div>
    <p class="small muted" style="margin-top:10px">نسبة الإتقان = متوسط أفضل نتائج اختبارات دروس الباب، مع اختبار الباب الشامل إن وُجد.</p>`;
  }
}
