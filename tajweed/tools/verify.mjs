#!/usr/bin/env node
// أداة التحقق من المنهج والمحتوى
// - تتحقق من شمول المنهج لكل أبيات المتنين، ومن اكتمال كل درس بأقسامه الأحد عشر
// - تتحقق من كل شاهد قرآني في المحتوى بمطابقته لنص المصحف (الرسم العثماني)
// - تتحقق آليًّا من تصنيف أحكام النون الساكنة والتنوين والميم الساكنة ولام التعريف
// - تولّد data/quran-snippets.json و data/verification.json
// الاستعمال: node tools/verify.mjs   (من داخل مجلد tajweed)
import { writeFileSync, readdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadQuran, tokenize, findSpan, getAyah, detectNoon, detectMeem, detectLam, AUTO_RULES } from './quran-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imp = (p) => import(pathToFileURL(join(root, p)).href);

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const { ABWAB, LESSONS, MASAIL, OUTSIDE } = await imp('content/curriculum.js');
const { TUHFA, JAZARIYYA } = await imp('content/mutun.js');
const practiceMod = await imp('content/practice.js');
const PRACTICE = practiceMod.PRACTICE;
const lettersMod = await imp('content/letters.js');

// ---------------- تحميل الدروس ----------------
const bodies = {};
for (const f of readdirSync(join(root, 'content', 'lessons')).filter((f) => f.endsWith('.js'))) {
  const mod = await imp(`content/lessons/${f}`);
  for (const [id, body] of Object.entries(mod.default)) {
    if (bodies[id]) err(`درس مكرر في الملفات: ${id}`);
    bodies[id] = { ...body, _file: f };
  }
}

// ---------------- شمول المنهج للمتنين ----------------
const coveredT = new Map();
const coveredJ = new Map();
for (const m of MASAIL) {
  for (const v of m.src.t || []) coveredT.set(v, [...(coveredT.get(v) || []), m.id]);
  for (const v of m.src.j || []) coveredJ.set(v, [...(coveredJ.get(v) || []), m.id]);
}
for (const v of OUTSIDE.t) coveredT.set(v, ['(مقدمة/خاتمة)']);
for (const v of OUTSIDE.j) coveredJ.set(v, ['(مقدمة/خاتمة)']);
const missT = TUHFA.verses.filter((v) => !coveredT.has(v.n)).map((v) => v.n);
const missJ = JAZARIYYA.verses.filter((v) => !coveredJ.has(v.n)).map((v) => v.n);
if (TUHFA.verses.length !== 61) err(`عدد أبيات التحفة ${TUHFA.verses.length} والمتوقع 61`);
if (JAZARIYYA.verses.length !== 107) err(`عدد أبيات الجزرية ${JAZARIYYA.verses.length} والمتوقع 107`);
if (missT.length) err(`أبيات من التحفة بلا مسألة: ${missT.join('، ')}`);
if (missJ.length) err(`أبيات من الجزرية بلا مسألة: ${missJ.join('، ')}`);

// ---------------- المسائل والدروس ----------------
const babIds = new Set(ABWAB.map((b) => b.id));
const lessonIds = new Set(Object.keys(LESSONS));
for (const m of MASAIL) {
  if (!babIds.has(m.bab)) err(`مسألة ${m.id} في باب غير معروف ${m.bab}`);
  if (!m.lessons?.length) err(`مسألة بلا درس: ${m.id} — ${m.title}`);
  for (const l of m.lessons || []) if (!lessonIds.has(l)) err(`مسألة ${m.id} تشير إلى درس غير موجود ${l}`);
  if (!m.branches?.length) warn(`مسألة بلا فروع مفصلة: ${m.id}`);
}
for (const b of ABWAB) for (const l of b.lessons) if (!lessonIds.has(l)) err(`الباب ${b.id} يشير إلى درس غير معرّف ${l}`);
const inBab = new Set(ABWAB.flatMap((b) => b.lessons));
for (const id of lessonIds) if (!inBab.has(id)) err(`درس غير مدرج في أي باب: ${id}`);

const REQUIRED = ['intro', 'definition', 'rule', 'divisions', 'details', 'examples', 'practice', 'mistakes', 'compare', 'summary', 'quiz'];
const lessonStatus = {};
for (const id of lessonIds) {
  const b = bodies[id];
  if (!b) { err(`درس معرّف بلا محتوى: ${id}`); lessonStatus[id] = 'missing'; continue; }
  const missing = REQUIRED.filter((k) => b[k] == null || (Array.isArray(b[k]) ? b[k].length === 0 : String(b[k]).trim() === ''));
  if (missing.length) { err(`درس ${id} ينقصه: ${missing.join('، ')}`); lessonStatus[id] = 'partial'; }
  else lessonStatus[id] = 'complete';
  if ((b.quiz || []).length < 4) warn(`درس ${id}: الاختبار أقل من 4 أسئلة`);
  if (!(b.cards || []).length) warn(`درس ${id}: لا بطاقات مراجعة`);
  if (!(b.refs || []).length) warn(`درس ${id}: لم تُذكر المصادر`);
  (b.quiz || []).forEach((q, i) => {
    if (!q.q) err(`درس ${id} سؤال ${i + 1}: بلا نص`);
    if (q.t === 'tf') { if (typeof q.a !== 'boolean') err(`درس ${id} سؤال ${i + 1}: إجابة صح/خطأ غير منطقية`); }
    else {
      if (!Array.isArray(q.o) || q.o.length < 2) err(`درس ${id} سؤال ${i + 1}: خيارات ناقصة`);
      else if (!(q.a >= 0 && q.a < q.o.length)) err(`درس ${id} سؤال ${i + 1}: رقم الإجابة خارج الخيارات`);
      else if (new Set(q.o).size !== q.o.length) err(`درس ${id} سؤال ${i + 1}: خيارات مكررة`);
    }
    if (!q.e) warn(`درس ${id} سؤال ${i + 1}: بلا تعليل`);
  });
}
for (const id of Object.keys(bodies)) if (!lessonIds.has(id)) err(`محتوى درس غير معرّف في المنهج: ${id}`);

// ---------------- الشواهد القرآنية ----------------
const Q = loadQuran();
const refs = new Map(); // key -> {where, rule}
const REF_RE = /\{\{(\d{1,3}:\d{1,3}\|[^{}]+?)\}\}/g;
const addRef = (key, where, rule) => {
  if (!refs.has(key)) refs.set(key, { where: [], rules: new Set() });
  const r = refs.get(key);
  r.where.push(where);
  if (rule) r.rules.add(rule);
};
function walk(node, where) {
  if (typeof node === 'string') {
    for (const m of node.matchAll(REF_RE)) addRef(m[1], where);
    return;
  }
  if (Array.isArray(node)) return node.forEach((x, i) => walk(x, where));
  if (node && typeof node === 'object') {
    if (typeof node.q === 'string' && /^\d{1,3}:\d{1,3}\|/.test(node.q)) addRef(node.q, where, node.rule);
    if (typeof node.ex === 'string' && /^\d{1,3}:\d{1,3}\|/.test(node.ex)) addRef(node.ex, where, node.rule);
    for (const [k, v] of Object.entries(node)) if (k !== '_file') walk(v, where);
  }
}
for (const [id, b] of Object.entries(bodies)) walk(b, `درس ${id}`);
walk(PRACTICE, 'التدريب القرآني');
walk(lettersMod, 'الحروف');

const snippets = {};
for (const [key, info] of refs) {
  const [ref, phrase, hl] = key.split('|');
  const [s, a] = ref.split(':').map(Number);
  const ay = getAyah(Q, s, a);
  if (!ay) { err(`مرجع غير موجود ${ref} (${info.where[0]})`); continue; }
  const words = tokenize(ay.text);
  const span = findSpan(words, phrase);
  if (!span) { err(`لم يُعثر على «${phrase}» في ${ay.name} ${a} (${info.where[0]})`); continue; }
  const t = words.slice(span[0], span[1] + 1);
  let h = [];
  if (hl) {
    const hs = findSpan(words, hl, span[0]);
    if (!hs || hs[1] > span[1]) { err(`الكلمة المظللة «${hl}» ليست ضمن «${phrase}» في ${ay.name} ${a} (${info.where[0]})`); continue; }
    for (let i = hs[0]; i <= hs[1]; i++) h.push(i - span[0]);
  }
  snippets[key] = { s, a, n: ay.name, g: ay.g, t: t.join(' '), h };
  // التحقق الآلي من الحكم
  for (const rule of info.rules) {
    const cat = AUTO_RULES[rule];
    if (!cat || !h.length) continue;
    const idx = span[0] + h[h.length - 1];
    let ok = false;
    let got = '';
    if (cat === 'noon') {
      const all = h.flatMap((i) => detectNoon(words, span[0] + i));
      got = all.map((x) => x.rule).join('/');
      ok = all.some((x) => x.rule === rule);
    } else if (cat === 'meem') {
      const all = h.map((i) => detectMeem(words, span[0] + i)).filter(Boolean);
      got = all.map((x) => x.rule).join('/');
      ok = all.some((x) => x.rule === rule);
    } else if (cat === 'lam') {
      const all = h.map((i) => detectLam(words[span[0] + i])).filter(Boolean);
      got = all.map((x) => x.rule).join('/');
      ok = all.some((x) => x.rule === rule);
    }
    if (!ok) err(`تصنيف الحكم «${rule}» لا يطابق الكشف الآلي (${got || 'لا شيء'}) في «${t.join(' ')}» ${ay.name} ${a} (${info.where[0]})`);
    void idx;
  }
}

// ---------------- التدريب ----------------
const ids = new Set();
for (const p of PRACTICE) {
  if (ids.has(p.id)) err(`معرّف تدريب مكرر ${p.id}`);
  ids.add(p.id);
  for (const t of p.targets || []) if (!t.rule || !t.hl) err(`تدريب ${p.id}: هدف ناقص`);
}

// ---------------- الإخراج ----------------
writeFileSync(join(root, 'data', 'quran-snippets.json'), JSON.stringify(snippets));
const complete = Object.values(lessonStatus).filter((s) => s === 'complete').length;
const summary = {
  checkedAt: new Date().toISOString(),
  tuhfa: { verses: TUHFA.verses.length, uncovered: missT },
  jazariyya: { verses: JAZARIYYA.verses.length, uncovered: missJ },
  masail: MASAIL.length,
  lessons: { total: lessonIds.size, complete },
  quranRefs: { total: refs.size, verified: Object.keys(snippets).length },
  practice: PRACTICE.length,
  errors: errors.length,
  warnings: warnings.length,
  ok: errors.length === 0,
};
writeFileSync(join(root, 'data', 'verification.json'), JSON.stringify({ summary, lessonStatus, errors, warnings }, null, 1));

console.log(`المسائل: ${MASAIL.length} | الدروس: ${complete}/${lessonIds.size} مكتملة | الشواهد: ${Object.keys(snippets).length}/${refs.size} | التدريب: ${PRACTICE.length}`);
console.log(`أبيات التحفة غير المغطاة: ${missT.length} | أبيات الجزرية غير المغطاة: ${missJ.length}`);
if (warnings.length) console.log(`\nتنبيهات (${warnings.length}):\n- ` + warnings.slice(0, 40).join('\n- '));
if (errors.length) {
  console.log(`\nأخطاء (${errors.length}):\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log('\n✓ اجتاز المحتوى جميع اختبارات التحقق');
