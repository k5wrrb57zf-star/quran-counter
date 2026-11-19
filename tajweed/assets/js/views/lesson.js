import { LESSONS, BAB, lessonBody, lessonVerses, lessonMasail, neighbors, lessonQuestions, RULES } from '../data.js';
import { store } from '../store.js';
import { I } from '../icons.js';
import { esc, AR, rich, quranHTML, refPlayHTML, verseHTML, levelName, toast, modal } from '../ui.js';
import { mountQuiz } from '../quiz.js';
import { mountMakharij, madBarsHTML, bindMadBars } from '../diagrams.js';
import { vrange } from './curriculum.js';

export const SECTIONS = [
  ['intro', 'تمهيد'],
  ['definition', 'التعريف'],
  ['rule', 'شرح القاعدة'],
  ['divisions', 'التقسيم'],
  ['details', 'التفصيل والقيود'],
  ['examples', 'الأمثلة القرآنية'],
  ['practice', 'التطبيق الصوتي'],
  ['mistakes', 'الأخطاء الشائعة'],
  ['compare', 'الفروق الدقيقة'],
  ['summary', 'خلاصة الدرس'],
  ['quiz', 'اختبار قصير'],
];

function sectionBody(key, b, id) {
  const v = b[key];
  switch (key) {
    case 'examples':
      return `<div class="ex-list">${v.map((x) => `<div class="ex">${quranHTML(x.q, { cls: 'q', ref: false })}<div class="foot">${x.rule && RULES[x.rule] ? `<span class="chip green">${esc(RULES[x.rule].name)}</span>` : ''}<span>${rich(esc(x.note || ''))}</span>${refPlayHTML(x.q)}</div></div>`).join('')}</div>`;
    case 'mistakes':
      return `<ul class="mistakes">${v.map((m) => `<li><span>${rich(esc(m))}</span></li>`).join('')}</ul>`;
    case 'compare':
      return Array.isArray(v)
        ? `<div class="compare">${v.map((c) => `<div class="cmp"><span class="a">${esc(c.a)}</span><span class="vs">مقابل</span><span class="b">${esc(c.b)}</span><div class="d">${rich(esc(c.diff))}</div></div>`).join('')}</div>`
        : rich(v);
    case 'summary':
      return `<div class="summary-card"><ul>${v.map((s) => `<li><span>${rich(esc(s))}</span></li>`).join('')}</ul></div>`;
    case 'quiz':
      return `<div id="lesson-quiz"></div>`;
    default:
      return rich(v);
  }
}

export async function render(el, params) {
  const [id, anchor] = (params[0] || '').split('#');
  const meta = LESSONS[id];
  if (!meta) {
    el.innerHTML = `<div class="wrap"><div class="card empty"><h1>الدرس غير موجود</h1><a class="btn" href="#/curriculum">العودة إلى المنهج</a></div></div>`;
    return;
  }
  const body = await lessonBody(id);
  const bab = BAB[meta.bab];
  const { prev, next } = neighbors(id);
  const verses = lessonVerses(id);
  const masail = lessonMasail(id);
  if (!body) {
    el.innerHTML = `<div class="wrap narrow"><h1>${esc(meta.title)}</h1><div class="card empty">لم يُكتب محتوى هذا الدرس بعد.</div></div>`;
    return;
  }
  store.visit(id);
  const st = store.lesson(id);
  const marked = store.isBookmarked(id);
  const srcChips = [verses.t.length ? `<a class="chip gold" href="#/mutun?m=tuhfa#tuhfa-${verses.t[0]}">التحفة: ${vrange(verses.t)}</a>` : '', verses.j.length ? `<a class="chip gold" href="#/mutun?m=jazariyya#jazariyya-${verses.j[0]}">الجزرية: ${vrange(verses.j)}</a>` : ''].join('');

  el.innerHTML = `<div class="wrap"><div class="lesson-layout"><article>
    <div class="crumbs"><a href="#/curriculum">المنهج</a><span>›</span><a href="#/curriculum?open=${bab.id}">الباب ${AR(bab.n)}: ${esc(bab.title)}</a></div>
    <header class="lesson-head"><h1>${esc(meta.title)}</h1>
      <div class="row"><span class="chip green">${esc(levelName(meta.level))}</span><span class="chip">${AR(meta.mins)} دقيقة</span>${srcChips}${st.done ? '<span class="chip ok">مكتمل</span>' : ''}${st.best ? `<span class="chip info">أفضل نتيجة: ${AR(st.best)}٪</span>` : ''}</div>
      <div class="action-bar">
        <button class="btn sm" id="bm">${marked ? I.starFill : I.star}<span>${marked ? 'محفوظ للمراجعة' : 'احفظ للمراجعة'}</span></button>
        <button class="btn sm" id="cards">${I.cards}<span>بطاقات الدرس</span></button>
        <button class="btn sm" id="done">${I.check}<span>${st.done ? 'إلغاء الإكمال' : 'تحديد كمكتمل'}</span></button>
        <a class="btn sm ghost" href="#s-quiz" data-jump="quiz">انتقل إلى الاختبار</a>
      </div>
    </header>

    ${verses.t.length || verses.j.length ? `<section class="matn-card"><div class="row"><b>من المتن</b><span class="spacer"></span><span class="small muted">${masail.map((m) => esc(m.title)).join(' · ')}</span></div>
      ${verses.t.length ? `<div class="matn-src">تحفة الأطفال — الجمزوري</div>${verses.t.map((n) => verseHTML('tuhfa', n)).join('')}` : ''}
      ${verses.j.length ? `<div class="matn-src">المقدمة الجزرية — ابن الجزري</div>${verses.j.map((n) => verseHTML('jazariyya', n)).join('')}` : ''}
    </section>` : ''}

    ${SECTIONS.map(([k, t], n) => (body[k] == null || (Array.isArray(body[k]) && !body[k].length)) && k !== 'quiz' ? '' : `
      <section class="lsec" id="s-${k}"><header><span class="n">${AR(n + 1)}</span><h2>${t}</h2></header>
      <div class="body">${sectionBody(k, body, id)}${k === 'rule' && body.visual ? `<div id="visual" style="margin-top:14px"></div>` : ''}</div></section>`).join('')}

    ${body.refs?.length ? `<section class="lsec" id="s-refs"><header><span class="n">${I.book}</span><h2>المصادر</h2></header><ul class="refs">${body.refs.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section>` : ''}

    <nav class="lesson-nav" aria-label="التنقل بين الدروس">
      ${prev ? `<a class="card" href="#/lesson/${prev}"><small>الدرس السابق</small><b>${esc(LESSONS[prev].title)}</b></a>` : '<span></span>'}
      ${next ? `<a class="card next" href="#/lesson/${next}"><small>الدرس التالي</small><b>${esc(LESSONS[next].title)}</b></a>` : '<span></span>'}
    </nav>
  </article>
  <aside class="toc"><div class="card"><div class="small muted" style="margin-bottom:6px">محتويات الدرس</div><ol>${SECTIONS.map(([k, t], n) => (body[k] ? `<li><a href="#s-${k}" data-jump="${k}"><span>${AR(n + 1)}</span>${t}</a></li>` : '')).join('')}</ol>
  <div class="bar" style="margin-top:12px"><i id="toc-bar" style="width:0"></i></div></div></aside>
  </div></div>`;

  // المرئيات
  if (body.visual === 'makharij') mountMakharij(el.querySelector('#visual'), { focus: body.visualFocus });
  if (body.visual === 'mad') { const v = el.querySelector('#visual'); v.innerHTML = madBarsHTML(); bindMadBars(v); }

  // الاختبار
  const quizEl = el.querySelector('#lesson-quiz');
  if (quizEl) {
    mountQuiz(quizEl, lessonQuestions(id, body), {
      title: 'اختبار الدرس',
      onDone: (score) => {
        store.quizResult(id, score);
        if (score >= 70) toast('أحسنت! سُجّل الدرس مكتملًا.');
      },
      endActions: next ? `<a class="btn primary" href="#/lesson/${next}">الدرس التالي</a>` : `<a class="btn primary" href="#/test/${bab.id}">اختبار الباب</a>`,
    });
  }

  // الأزرار
  el.querySelector('#bm').addEventListener('click', (e) => {
    const on = store.toggleBookmark(id);
    e.currentTarget.innerHTML = `${on ? I.starFill : I.star}<span>${on ? 'محفوظ للمراجعة' : 'احفظ للمراجعة'}</span>`;
    toast(on ? 'حُفظ الدرس في قائمة المراجعة.' : 'أُزيل الدرس من المحفوظات.');
  });
  el.querySelector('#done').addEventListener('click', (e) => {
    const d = !store.lesson(id).done;
    store.markDone(id, d);
    e.currentTarget.innerHTML = `${I.check}<span>${d ? 'إلغاء الإكمال' : 'تحديد كمكتمل'}</span>`;
    toast(d ? 'سُجّل الدرس مكتملًا.' : 'أُلغي إكمال الدرس.');
  });
  el.querySelector('#cards').addEventListener('click', () => openCards(id, body));
  el.addEventListener('click', (e) => {
    const j = e.target.closest('[data-jump]');
    if (!j) return;
    e.preventDefault();
    document.getElementById('s-' + j.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // شريط التقدم في القراءة وفهرس المحتويات
  const barTop = document.querySelector('.read-progress > i');
  const tocBar = el.querySelector('#toc-bar');
  const links = [...el.querySelectorAll('.toc [data-jump]')];
  const onScroll = () => {
    const art = el.querySelector('article');
    const r = art.getBoundingClientRect();
    const p = Math.min(100, Math.max(0, ((-r.top + innerHeight * 0.3) / (r.height - innerHeight * 0.5)) * 100));
    barTop.style.width = p + '%';
    if (tocBar) tocBar.style.width = p + '%';
    let cur = null;
    for (const [k] of SECTIONS) { const s = document.getElementById('s-' + k); if (s && s.getBoundingClientRect().top < innerHeight * 0.35) cur = k; }
    links.forEach((a) => a.classList.toggle('on', a.dataset.jump === cur));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ block: 'start' }), 60);
  return () => removeEventListener('scroll', onScroll);
}

// بطاقات الدرس (مراجعة بنظام لايتنر)
export function openCards(id, body, list = null) {
  const cards = list || (body.cards || []).map((c, k) => ({ ...c, cid: `${id}#c${k}` }));
  if (!cards.length) return toast('لا بطاقات لهذا الدرس.');
  let i = 0;
  modal(`<div class="row" style="margin-bottom:10px"><h3 style="margin:0">بطاقات المراجعة</h3><span class="spacer"></span><button class="icon-btn" data-close aria-label="إغلاق">${I.x}</button></div><div id="fc"></div>`, (root, close) => {
    const fc = root.querySelector('#fc');
    const draw = () => {
      if (i >= cards.length) { fc.innerHTML = `<div class="empty"><h3>انتهت البطاقات</h3><p>ستظهر لك البطاقات مرة أخرى في موعد مراجعتها.</p><button class="btn primary" data-close>إغلاق</button></div>`; return; }
      const c = cards[i];
      fc.innerHTML = `<div class="flash"><div class="flash-inner" tabindex="0" role="button" aria-label="اقلب البطاقة"><div class="flash-face"><small>${AR(i + 1)} / ${AR(cards.length)}</small><div>${rich(esc(c.f))}</div></div><div class="flash-face back"><div>${rich(esc(c.b))}</div></div></div></div>
        <p class="small muted" style="text-align:center">اضغط على البطاقة لقلبها</p>
        <div class="row" style="justify-content:center"><button class="btn" data-r="0">لم أتذكر</button><button class="btn primary" data-r="1">تذكرتها</button></div>`;
      const f = fc.querySelector('.flash');
      const inner = fc.querySelector('.flash-inner');
      const flip = () => f.classList.toggle('flip');
      inner.addEventListener('click', flip);
      inner.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
      fc.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => { store.rateCard(c.cid, b.dataset.r === '1'); i++; draw(); }));
    };
    draw();
    void close;
  });
}
