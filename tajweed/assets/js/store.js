// حفظ تقدم المتعلم في المتصفح (localStorage) مع إمكانية التصدير والاستيراد
const KEY = 'itqan-tajweed.v1';

const fresh = () => ({
  v: 1,
  created: Date.now(),
  lessons: {}, // id: { seen, done, best, last, tries, at }
  bookmarks: [], // lesson ids
  last: null, // { id, at }
  mistakes: {}, // qid: { n, ok, at, lesson, bab }
  answers: {}, // qid: { ok, at }
  cards: {}, // cardId: { box, due }
  tests: {}, // testId: { best, last, at }
  practice: { n: 0, ok: 0, rules: {}, level: 1 },
  days: [], // أيام الدراسة (لعرض المواظبة)
  settings: { theme: 'auto', font: 'm', reciter: 'husary' },
});

let mem = null;
let available = true;

function load() {
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(KEY);
    mem = raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch {
    available = false;
    mem = fresh();
  }
  return mem;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(mem));
  } catch {
    available = false;
  }
}

const today = () => new Date().toISOString().slice(0, 10);
function touchDay() {
  const d = today();
  if (mem.days[mem.days.length - 1] !== d) {
    mem.days.push(d);
    if (mem.days.length > 400) mem.days = mem.days.slice(-400);
  }
}

export const store = {
  get s() { return load(); },
  get persistent() { load(); return available; },

  visit(id) {
    load();
    const L = (mem.lessons[id] ||= {});
    L.seen = true;
    L.at = Date.now();
    mem.last = { id, at: Date.now() };
    touchDay();
    save();
  },
  lesson(id) { return load().lessons[id] || {}; },
  markDone(id, done = true) {
    load();
    const L = (mem.lessons[id] ||= {});
    L.done = done;
    L.at = Date.now();
    save();
  },
  quizResult(id, score) {
    load();
    const L = (mem.lessons[id] ||= {});
    L.tries = (L.tries || 0) + 1;
    L.last = score;
    L.best = Math.max(L.best || 0, score);
    if (score >= 70) L.done = true;
    L.at = Date.now();
    touchDay();
    save();
  },
  testResult(id, score) {
    load();
    const T = (mem.tests[id] ||= {});
    T.last = score;
    T.best = Math.max(T.best || 0, score);
    T.at = Date.now();
    touchDay();
    save();
  },
  answer(qid, ok, meta = {}) {
    load();
    mem.answers[qid] = { ok, at: Date.now() };
    const M = mem.mistakes[qid];
    if (!ok) mem.mistakes[qid] = { n: (M?.n || 0) + 1, ok: 0, at: Date.now(), ...meta };
    else if (M) {
      M.ok = (M.ok || 0) + 1;
      if (M.ok >= 2) delete mem.mistakes[qid]; // يُعدّ الخطأ مُعالجًا بعد إجابتين صحيحتين
    }
    save();
  },
  practiced(rule, ok) {
    load();
    const P = mem.practice;
    P.n++;
    if (ok) P.ok++;
    const R = (P.rules[rule] ||= { n: 0, ok: 0 });
    R.n++;
    if (ok) R.ok++;
    touchDay();
    save();
  },
  setPracticeLevel(l) { load(); mem.practice.level = l; save(); },
  toggleBookmark(id) {
    load();
    const i = mem.bookmarks.indexOf(id);
    if (i >= 0) mem.bookmarks.splice(i, 1);
    else mem.bookmarks.push(id);
    save();
    return i < 0;
  },
  isBookmarked(id) { return load().bookmarks.includes(id); },
  // بطاقات المراجعة بنظام صناديق لايتنر
  card(id) { return load().cards[id] || { box: 0, due: 0 }; },
  rateCard(id, knew) {
    load();
    const c = mem.cards[id] || { box: 0, due: 0 };
    c.box = knew ? Math.min(5, c.box + 1) : 1;
    const days = [0, 1, 2, 4, 8, 16][c.box];
    c.due = Date.now() + days * 864e5;
    mem.cards[id] = c;
    touchDay();
    save();
  },
  setting(k, v) {
    load();
    if (v === undefined) return mem.settings[k];
    mem.settings[k] = v;
    save();
  },
  export() { return JSON.stringify(load(), null, 1); },
  import(text) {
    const data = JSON.parse(text);
    if (!data || data.v !== 1 || typeof data.lessons !== 'object') throw new Error('bad file');
    mem = { ...fresh(), ...data };
    save();
  },
  reset() { mem = fresh(); save(); },
  // عدد الأيام المتتالية للدراسة (حتى اليوم أو الأمس)
  streak() {
    const set = new Set(load().days);
    const iso = (x) => x.toISOString().slice(0, 10);
    let d = new Date();
    if (!set.has(iso(d))) d = new Date(d.getTime() - 864e5);
    let n = 0;
    while (set.has(iso(d))) { n++; d = new Date(d.getTime() - 864e5); }
    return n;
  },
};
