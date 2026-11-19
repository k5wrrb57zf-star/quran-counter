// مكوّن الاختبار التفاعلي: اختيار من متعدد، صح/خطأ، إكمال القاعدة، تحديد الحكم في آية، اختيار الكلمة
import { esc, quranHTML, quranWords, AR, ring, shuffle, rich } from './ui.js';
import { store } from './store.js';
import { LESSONS } from './data.js';

const KEYS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

// تحويل السؤال إلى صيغة موحدة مع خلط الخيارات
function prepare(q) {
  if (q.t === 'tf') return { ...q, opts: ['صحيح', 'خطأ'], ans: q.a ? 0 : 1, fixed: true };
  if (q.t === 'pick') return { ...q };
  const idx = q.o.map((_, i) => i);
  const order = q.keep ? idx : shuffle(idx);
  return { ...q, opts: order.map((i) => q.o[i]), ans: order.indexOf(q.a) };
}

/**
 * @param {HTMLElement} el
 * @param {Array} questions
 * @param {{title?:string, onDone?:(score:number, res:Array)=>void, record?:boolean, retry?:boolean}} opts
 */
export function mountQuiz(el, questions, opts = {}) {
  const qs = questions.map(prepare);
  let i = 0;
  let correct = 0;
  const results = [];

  const draw = () => {
    if (i >= qs.length) return end();
    const q = qs[i];
    const head = `<div class="quiz-top"><span>${esc(opts.title || 'اختبار')}</span><span>السؤال ${AR(i + 1)} من ${AR(qs.length)}</span></div>
      <div class="steps">${qs.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</div>`;
    let body = `<div class="quiz-q">${rich(esc(q.q).replace(/\{\{.*?\}\}/g, (m) => m))}</div>`;
    if (q.ex && q.t !== 'pick') body += `<div class="quiz-ex">${quranHTML(q.ex, { cls: 'q' })}</div>`;
    if (q.t === 'pick') {
      const r = quranWords(q.ex);
      body += `<div class="quiz-ex"><div class="word-pick" role="group" aria-label="كلمات الآية">${r.words
        .map((w, k) => `<button data-w="${k}">${esc(w)}</button>`)
        .join('')}</div>${r.ok ? `<div class="q-ref">[${r.s.n}: ${AR(r.s.a)}]</div>` : ''}</div>`;
    } else {
      body += `<div class="opts" role="group">${q.opts
        .map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${KEYS[k]}</span><span>${rich(esc(o))}</span></button>`)
        .join('')}</div>`;
    }
    body += `<div class="explain-slot" aria-live="polite"></div>`;
    el.innerHTML = `<div class="quiz">${head}${body}</div>`;

    const finish = (ok, correctLabel) => {
      if (ok) correct++;
      results.push({ q, ok });
      if (opts.record !== false && q.id) store.answer(q.id, ok, { lesson: q.lesson, bab: q.bab });
      opts.onAnswer?.(q, ok);
      const slot = el.querySelector('.explain-slot');
      slot.innerHTML = `<div class="explain ${ok ? 'ok' : 'bad'}"><b>${ok ? 'إجابة صحيحة' : 'إجابة غير صحيحة'}</b>${!ok && correctLabel ? ` — الصواب: ${rich(esc(correctLabel))}` : ''}${q.e ? `<div>${rich(esc(q.e))}</div>` : ''}${q.lesson && !ok && LESSONS[q.lesson] ? `<div class="small" style="margin-top:6px">راجع: <a href="#/lesson/${q.lesson}">${esc(LESSONS[q.lesson].title)}</a></div>` : ''}</div>
        <div class="row" style="margin-top:12px"><span class="spacer"></span><button class="btn primary next">${i + 1 < qs.length ? 'السؤال التالي' : 'عرض النتيجة'}</button></div>`;
      const nb = slot.querySelector('.next');
      nb.focus({ preventScroll: true });
      nb.addEventListener('click', () => { i++; draw(); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    };

    if (q.t === 'pick') {
      el.querySelectorAll('[data-w]').forEach((b) =>
        b.addEventListener('click', () => {
          const k = +b.dataset.w;
          const ok = q.answer.includes(k);
          el.querySelectorAll('[data-w]').forEach((x) => { x.disabled = true; if (q.answer.includes(+x.dataset.w)) x.classList.add('right'); });
          if (!ok) b.classList.add('wrong');
          finish(ok, null);
        }),
      );
    } else {
      el.querySelectorAll('.opt').forEach((b) =>
        b.addEventListener('click', () => {
          const k = +b.dataset.k;
          const ok = k === q.ans;
          el.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
          el.querySelector(`.opt[data-k="${q.ans}"]`).classList.add('right');
          if (!ok) b.classList.add('wrong');
          finish(ok, q.opts[q.ans]);
        }),
      );
    }
  };

  const end = () => {
    const score = qs.length ? Math.round((correct / qs.length) * 100) : 0;
    const msg = score >= 90 ? 'ممتاز، أتقنت المسألة.' : score >= 70 ? 'جيد، وتحتاج مراجعة يسيرة.' : 'تحتاج إلى إعادة الدرس ومراجعة الأخطاء.';
    el.innerHTML = `<div class="quiz quiz-end">${ring(score)}<h3>${msg}</h3><p class="muted">أجبت إجابة صحيحة عن ${AR(correct)} من ${AR(qs.length)}.</p>
      <div class="row" style="justify-content:center">${opts.retry !== false ? '<button class="btn retry">أعد الاختبار</button>' : ''}${opts.endActions || ''}</div></div>`;
    el.querySelector('.retry')?.addEventListener('click', () => mountQuiz(el, questions, opts));
    opts.onDone?.(score, results);
  };

  draw();
}
