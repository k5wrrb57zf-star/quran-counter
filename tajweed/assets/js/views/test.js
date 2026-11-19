import { ABWAB, BAB, LESSONS, ORDER, loadBab, lessonQuestions, allBodies } from '../data.js';
import { store } from '../store.js';
import { esc, AR, shuffle } from '../ui.js';
import { mountQuiz } from '../quiz.js';

async function babQuestions(babId) {
  const all = await loadBab(babId);
  return BAB[babId].lessons.flatMap((id) => lessonQuestions(id, all[id]));
}

export async function render(el, [kind]) {
  let title = '';
  let intro = '';
  let qs = [];
  let testId = kind;
  if (kind === 'placement') {
    title = 'اختبر مستواك';
    intro = 'سؤال من كل باب تقريبًا، لتعرف من أين تبدأ. لا يُسجَّل في أخطائك.';
    const per = await Promise.all(ABWAB.map(async (b) => shuffle(await babQuestions(b.id)).slice(0, 1)));
    qs = per.flat();
  } else if (kind === 'mistakes') {
    title = 'إعادة الأسئلة التي أخطأت فيها';
    intro = 'تُزال المسألة من قائمة أخطائك بعد إجابتين صحيحتين عنها.';
    const bodies = await allBodies();
    const mis = store.s.mistakes;
    const all = ORDER.flatMap((id) => lessonQuestions(id, bodies[id]));
    qs = all.filter((q) => mis[q.id]).sort((a, b) => mis[b.id].n - mis[a.id].n).slice(0, 15);
  } else if (kind === 'mix') {
    title = 'اختبار مراجعة متنوع';
    intro = 'أسئلة متنوعة من الدروس التي درستها.';
    const bodies = await allBodies();
    const seen = ORDER.filter((id) => store.lesson(id).seen);
    qs = shuffle((seen.length ? seen : ORDER).flatMap((id) => lessonQuestions(id, bodies[id]))).slice(0, 12);
  } else if (BAB[kind]) {
    title = `الاختبار الشامل: ${BAB[kind].title}`;
    intro = 'أسئلة من جميع دروس الباب، تقيس الفهم والتمييز لا الحفظ فقط. النجاح من ٧٠٪.';
    qs = shuffle(await babQuestions(kind)).slice(0, 15);
    testId = 'bab:' + kind;
  } else {
    el.innerHTML = `<div class="wrap"><div class="card empty"><h1>اختبار غير معروف</h1><a class="btn" href="#/review">المراجعة</a></div></div>`;
    return;
  }
  el.innerHTML = `<div class="wrap narrow"><h1>${esc(title)}</h1><p class="muted">${esc(intro)}</p><div id="qz"></div><div id="after" style="margin-top:16px"></div></div>`;
  if (!qs.length) {
    el.querySelector('#qz').innerHTML = `<div class="card empty">${kind === 'mistakes' ? 'لا أخطاء مسجلة لديك الآن. أحسنت!' : 'لا أسئلة متاحة بعد.'}</div>`;
    return;
  }
  mountQuiz(el.querySelector('#qz'), qs, {
    title,
    record: kind !== 'placement',
    onDone: (score, res) => {
      store.testResult(testId, score);
      if (kind === 'placement') {
        const weak = ABWAB.filter((b) => res.some((r) => r.q.bab === b.id && !r.ok));
        const first = weak[0];
        el.querySelector('#after').innerHTML = `<div class="card"><h3>توصية</h3>${first
          ? `<p>أظهرت إجاباتك حاجة إلى مراجعة: ${weak.map((b) => `<a href="#/curriculum?open=${b.id}">${esc(b.title)}</a>`).join('، ')}.</p><a class="btn primary" href="#/lesson/${first.lessons[0]}">ابدأ من: ${esc(LESSONS[first.lessons[0]].title)}</a>`
          : '<p>إجاباتك ممتازة في جميع الأبواب. ننصحك بالتدريب القرآني والاختبارات الشاملة لتثبيت الإتقان.</p><a class="btn primary" href="#/practice">إلى التدريب القرآني</a>'}</div>`;
      } else {
        const wrong = res.filter((r) => !r.ok).map((r) => r.q.lesson);
        const uniq = [...new Set(wrong)].filter(Boolean);
        el.querySelector('#after').innerHTML = uniq.length ? `<div class="card"><h3>دروس تحتاج إلى مراجعة</h3><ul>${uniq.map((id) => `<li><a href="#/lesson/${id}">${esc(LESSONS[id].title)}</a></li>`).join('')}</ul></div>` : '';
      }
    },
  });
  void AR;
}
