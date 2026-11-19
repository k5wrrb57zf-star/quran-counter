import { loadPractice, RULES, GROUPS, LESSONS } from '../data.js';
import { store } from '../store.js';
import { esc, AR, shuffle, quranWords, ring } from '../ui.js';
import { mountQuiz } from '../quiz.js';

const LEVELS = [
  [1, 'مبتدئ', 'كلمة مظللة: حدّد الحكم، وموضعه، وسببه.'],
  [2, 'متوسط', 'ابحث بنفسك عن موضع الحكم في الآية ثم علّله.'],
  [3, 'متقدم', 'آية فيها عدة أحكام: ميّز بينها جميعًا.'],
];
const ON = {
  noon: ['النون الساكنة', 'التنوين', 'الميم الساكنة', 'لام التعريف'],
  meem: ['الميم الساكنة', 'النون الساكنة', 'الميم المشددة', 'النون المشددة', 'التنوين'],
  lam: ['لام التعريف', 'لام الفعل', 'النون الساكنة', 'الميم الساكنة'],
  idgham: ['الدال الساكنة', 'التاء الساكنة', 'الباء الساكنة', 'الذال الساكنة', 'الطاء الساكنة', 'اللام الساكنة', 'الثاء الساكنة', 'القاف الساكنة'],
  madd: ['الألف', 'الواو المدية', 'الياء المدية', 'الواو اللينة', 'الياء اللينة'],
  qalqala: ['القاف', 'الطاء', 'الباء', 'الجيم', 'الدال'],
  raa: ['الراء'],
  jalala: ['لام لفظ الجلالة'],
};

function distract(correct, pool, n = 3) {
  return shuffle(pool.filter((x) => x !== correct)).slice(0, n);
}
function ruleOptions(rule) {
  const g = RULES[rule].group;
  const pool = Object.entries(RULES).filter(([, r]) => r.group === g).map(([, r]) => r.name);
  const ds = distract(RULES[rule].name, pool);
  const o = shuffle([RULES[rule].name, ...ds]);
  return { o, a: o.indexOf(RULES[rule].name) };
}
function causeOptions(rule, letter) {
  const g = RULES[rule].group;
  const fmt = (c) => c;
  const correct = fmt(RULES[rule].cause) + (letter ? ` (وهو هنا «${letter}»)` : '');
  const pool = Object.entries(RULES).filter(([k, r]) => r.group === g && k !== rule).map(([, r]) => fmt(r.cause));
  const o = shuffle([correct, ...distract(correct, pool)]);
  return { o, a: o.indexOf(correct) };
}

function buildQuestions(item, level) {
  const qs = [];
  const t0 = item.targets[0];
  const lessonOf = (r) => RULES[r].lesson;
  if (level === 1 || item.targets.length === 1 && level !== 2) {
    const t = t0;
    const r = ruleOptions(t.rule);
    qs.push({ t: 'mcq', keep: true, q: 'ما الحكم التجويدي في الكلمة المظللة؟', ex: t.q, o: r.o, a: r.a, e: RULES[t.rule].cause + '.', id: `p:${item.id}:r`, lesson: lessonOf(t.rule), rule: t.rule });
    if (t.on) {
      const pool = ON[RULES[t.rule].group] || [];
      const o = shuffle([t.on, ...distract(t.on, pool)]);
      qs.push({ t: 'mcq', keep: true, q: 'على أي حرف وقع الحكم؟', ex: t.q, o, a: o.indexOf(t.on), e: `وقع الحكم على ${t.on}.`, id: `p:${item.id}:o`, lesson: lessonOf(t.rule), rule: t.rule });
    }
    const c = causeOptions(t.rule, t.letter);
    qs.push({ t: 'mcq', keep: true, q: 'ما سبب هذا الحكم؟', ex: t.q, o: c.o, a: c.a, e: `${RULES[t.rule].name}: ${RULES[t.rule].cause}.`, id: `p:${item.id}:c`, lesson: lessonOf(t.rule), rule: t.rule });
  } else if (level === 2) {
    const t = t0;
    const h = quranWords(t.q).h;
    qs.push({ t: 'pick', q: `اضغط على الكلمة التي فيها: ${RULES[t.rule].name}`, ex: item.q, answer: h, e: RULES[t.rule].cause + '.', id: `p:${item.id}:k`, lesson: lessonOf(t.rule), rule: t.rule });
    const c = causeOptions(t.rule, t.letter);
    qs.push({ t: 'mcq', keep: true, q: 'وما سبب هذا الحكم؟', ex: t.q, o: c.o, a: c.a, e: `${RULES[t.rule].name}: ${RULES[t.rule].cause}.`, id: `p:${item.id}:c`, lesson: lessonOf(t.rule), rule: t.rule });
  } else {
    item.targets.forEach((t, k) => {
      const r = ruleOptions(t.rule);
      qs.push({ t: 'mcq', keep: true, q: `الموضع ${AR(k + 1)} من ${AR(item.targets.length)}: ما حكم الكلمة المظللة؟`, ex: t.q, o: r.o, a: r.a, e: RULES[t.rule].cause + '.', id: `p:${item.id}:r${k}`, lesson: lessonOf(t.rule), rule: t.rule });
    });
    // سؤال التمييز يكون على حكم لا يتكرر في العبارة (يحدده item.pick في بنك التدريب)
    const pickT = item.pick != null ? item.targets[item.pick] : null;
    if (pickT) {
      qs.push({ t: 'pick', q: `ميّز: اضغط على موضع «${RULES[pickT.rule].name}» دون غيره`, ex: item.q, answer: quranWords(pickT.q).h, e: `${RULES[pickT.rule].name}: ${RULES[pickT.rule].cause}.`, id: `p:${item.id}:m`, lesson: lessonOf(pickT.rule), rule: pickT.rule });
    }
  }
  return qs;
}

export async function render(el, _p, params) {
  const all = await loadPractice();
  const level = +(params.level || store.s.practice.level || 1);
  const group = params.group || '';
  const P = store.s.practice;
  const pool = all.filter((x) => x.level === level && (!group || x.targets.some((t) => RULES[t.rule]?.group === group)));
  const groupsHere = [...new Set(all.filter((x) => x.level === level).flatMap((x) => x.targets.map((t) => RULES[t.rule]?.group)))].filter(Boolean);

  el.innerHTML = `<div class="wrap narrow"><h1>التدريب القرآني</h1>
  <p class="muted">آيات حقيقية من المصحف، تتدرب فيها على استخراج الحكم التجويدي، وتحديد الحرف الذي وقع عليه، وتعليله، والتمييز بين الأحكام المختلفة في الآية الواحدة.</p>
  <div class="grid g3" style="margin:14px 0">${LEVELS.map(([l, n, d]) => `<a class="card" href="#/practice?level=${l}" style="${l === level ? 'border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)' : ''}"><div class="row"><b>المستوى ${AR(l)}: ${n}</b><span class="spacer"></span><span class="chip">${AR(all.filter((x) => x.level === l).length)}</span></div><div class="small muted">${d}</div></a>`).join('')}</div>
  <div class="row" style="margin-bottom:14px"><span class="small muted">تصفية بالباب:</span><a class="chip ${!group ? 'green' : ''}" href="#/practice?level=${level}">الكل</a>${groupsHere.map((g) => `<a class="chip ${group === g ? 'green' : ''}" href="#/practice?level=${level}&group=${g}">${esc(GROUPS[g])}</a>`).join('')}</div>
  <div class="card row" style="margin-bottom:14px">${ring(P.n ? (P.ok / P.n) * 100 : 0)}<div><b>دقتك في التدريب</b><div class="small muted">${AR(P.ok)} إجابة صحيحة من ${AR(P.n)}</div></div><span class="spacer"></span><button class="btn primary" id="start">ابدأ جولة (${AR(Math.min(6, pool.length))} آيات)</button></div>
  <div id="pq"></div>
  <h3 style="margin-top:22px">أداؤك بحسب الحكم</h3><div id="perf" class="grid g3"></div></div>`;

  const perf = el.querySelector('#perf');
  const rows = Object.entries(P.rules).filter(([r]) => RULES[r]).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n);
  perf.innerHTML = rows.length ? rows.map(([r, v]) => `<a class="card" href="#/lesson/${RULES[r].lesson}"><b>${esc(RULES[r].name)}</b><div class="bar" style="margin:6px 0"><i style="width:${(v.ok / v.n) * 100}%"></i></div><div class="small muted">${AR(v.ok)}/${AR(v.n)} · ${esc(LESSONS[RULES[r].lesson]?.title || '')}</div></a>`).join('') : '<div class="card muted small">ستظهر هنا نقاط قوتك وضعفك بعد أول جولة.</div>';

  el.querySelector('#start').addEventListener('click', () => {
    store.setPracticeLevel(level);
    const items = shuffle(pool).slice(0, 6);
    const qs = items.flatMap((it) => buildQuestions(it, level));
    if (!qs.length) { el.querySelector('#pq').innerHTML = '<div class="card empty">لا تمارين في هذا الاختيار.</div>'; return; }
    mountQuiz(el.querySelector('#pq'), qs, {
      title: `التدريب — المستوى ${AR(level)}`,
      record: false,
      onAnswer: (q, ok) => q.rule && store.practiced(q.rule, ok),
      onDone: () => {},
      endActions: `<a class="btn primary" href="#/practice?level=${Math.min(3, level + 1)}">المستوى التالي</a>`,
    });
    el.querySelector('#pq').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
