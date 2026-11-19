// تحميل المحتوى العلمي (منفصل عن الواجهة في مجلد content)
import { ABWAB, LESSONS, MASAIL, OUTSIDE, EXCLUDED } from '../../content/curriculum.js';
import { MUTUN, TUHFA, JAZARIYYA } from '../../content/mutun.js';
import { RULES, GROUPS } from '../../content/rules.js';

export { ABWAB, LESSONS, MASAIL, OUTSIDE, EXCLUDED, MUTUN, TUHFA, JAZARIYYA, RULES, GROUPS };

export const ORDER = ABWAB.flatMap((b) => b.lessons);
export const BAB = Object.fromEntries(ABWAB.map((b) => [b.id, b]));

const babCache = {};
export function loadBab(babId) {
  babCache[babId] ||= import(`../../content/lessons/${babId}.js`).then((m) => m.default).catch(() => ({}));
  return babCache[babId];
}
export async function lessonBody(id) {
  const meta = LESSONS[id];
  if (!meta) return null;
  const all = await loadBab(meta.bab);
  return all[id] || null;
}
export async function allBodies() {
  const out = {};
  await Promise.all(ABWAB.map(async (b) => Object.assign(out, await loadBab(b.id))));
  return out;
}

let snip = null;
export async function loadSnippets() {
  if (snip) return snip;
  try {
    const r = await fetch('data/quran-snippets.json', { cache: 'no-cache' });
    snip = await r.json();
  } catch {
    snip = {};
  }
  return snip;
}
export const snippets = () => snip || {};

let verif = null;
export async function loadVerification() {
  if (verif) return verif;
  try { verif = await (await fetch('data/verification.json', { cache: 'no-cache' })).json(); } catch { verif = null; }
  return verif;
}

let practice = null;
export async function loadPractice() {
  practice ||= import('../../content/practice.js').then((m) => m.PRACTICE);
  return practice;
}
let letters = null;
export async function loadLetters() {
  letters ||= import('../../content/letters.js');
  return letters;
}

export function lessonMasail(id) {
  return MASAIL.filter((m) => m.lessons.includes(id));
}
export function lessonVerses(id) {
  const t = new Set();
  const j = new Set();
  for (const m of lessonMasail(id)) {
    (m.src.t || []).forEach((v) => t.add(v));
    (m.src.j || []).forEach((v) => j.add(v));
  }
  return { t: [...t].sort((a, b) => a - b), j: [...j].sort((a, b) => a - b) };
}
export function verseLessons(matn, n) {
  const key = matn === 'tuhfa' ? 't' : 'j';
  const ids = new Set();
  for (const m of MASAIL) if ((m.src[key] || []).includes(n)) m.lessons.forEach((l) => ids.add(l));
  return [...ids];
}
export function neighbors(id) {
  const i = ORDER.indexOf(id);
  return { prev: ORDER[i - 1] || null, next: ORDER[i + 1] || null, index: i };
}
export function lessonQuestions(id, body) {
  return (body?.quiz || []).map((q, i) => ({ ...q, id: `${id}#${i}`, lesson: id, bab: LESSONS[id].bab }));
}
