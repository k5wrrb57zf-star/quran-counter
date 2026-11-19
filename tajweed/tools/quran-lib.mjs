// أدوات مشتركة للتعامل مع نص المصحف (الرسم العثماني — مصحف المدينة، رواية حفص)
// المصدر: QUL (Quranic Universal Library — Tarteel)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export function loadQuran() {
  const raw = JSON.parse(readFileSync(join(here, 'data', 'quran-uthmani.json'), 'utf8'));
  const surahs = raw.surahs;
  // رقم الآية التسلسلي في المصحف كله (1..6236)
  let g = 0;
  for (const s of surahs) {
    s.start = g + 1;
    g += s.ayat.length;
  }
  return { surahs, total: g };
}

// علامات الوقف والرموز التي تأتي كلمة مستقلة
const STANDALONE_MARK = /^[ۖ-۞۩۝]+$/u;

export function tokenize(ayah) {
  return ayah.split(/\s+/).filter((w) => w && !STANDALONE_MARK.test(w));
}

const HAMZA = /[ءأؤإئإٓٔ]/gu;
const MARKS = /[ؐ-ًؚ-ٖٓ-ٰٟۖ-ۭـ]/gu;

// الهيكل الحرفي للكلمة: يجرّد من الحركات والعلامات ويوحّد صور الهمز والألف
export function skeleton(str, loose = false) {
  // لا نستعمل NFC لأنه يركّب «ا+ٓ» إلى «آ». والآن: «آ» في أول الكلمة = همزة+ألف، وفي وسطها = ألف مد
  let s = str.replace(/(^|\s)\u0622/gu, '$1ء').replace(/\u0622/gu, 'ا');
  s = s.replace(/وٰ/gu, ''); // واو الرسم الممثلة للألف: الصلوٰة
  s = s.replace(HAMZA, 'ء');
  s = s.replace(MARKS, '');
  s = s.replace(/[اٱ]/gu, '');
  s = s.replace(/ى/gu, 'ي').replace(/ة/gu, 'ه');
  s = s.replace(/[^ء-ي]/gu, '');
  if (loose) {
    // تساهل في حروف العلة والهمز داخل الكلمة فقط (لا في أولها، حفظًا لحروف العطف)
    s = s.slice(0, 1) + s.slice(1).replace(/[ويء]/gu, '');
    s = s.replace(/(.)\1+/gu, '$1');
  }
  return s;
}

// البحث عن عبارة (كلمات كاملة) داخل كلمات الآية؛ يعيد [بداية، نهاية] بالكلمات
export function findSpan(words, query, from = 0) {
  for (const loose of [false, true]) {
    const sk = words.map((w) => skeleton(w, loose));
    const q = query.split(/\s+/).filter(Boolean).map((w) => skeleton(w, loose)).join('');
    if (!q) return null;
    for (let i = from; i < words.length; i++) {
      let acc = '';
      for (let j = i; j < words.length; j++) {
        acc += sk[j];
        if (acc === q) return [i, j];
        if (acc.length >= q.length || !q.startsWith(acc)) break;
      }
    }
  }
  return null;
}

export function getAyah(Q, s, a) {
  const su = Q.surahs[s - 1];
  if (!su) return null;
  const text = su.ayat[a - 1];
  if (text == null) return null;
  return { text, name: su.name, g: su.start + a - 1 };
}

// ---------- كشف الأحكام آليًّا للتحقق من صحة التصنيف ----------
const BASE = /[ء-يٱ]/u;
const isMark = (c) => /[ؐ-ًؚ-ٰٟۖ-ۭ]/u.test(c);
const HALQ = 'ءأإؤئآهعحغخ';
const YANMU = 'ينمو';
const LR = 'لر';

function letters(word) {
  // يعيد قائمة الحروف الأساسية مع علاماتها
  const out = [];
  for (const ch of word) {
    if (BASE.test(ch) || ch === 'ـ') out.push({ c: ch, m: '' });
    else if (out.length) out[out.length - 1].m += ch;
  }
  // الهمزة المرسومة فوق الكشيدة: ـَٔ
  for (const x of out) if (x.c === 'ـ' && /[ٕٔ]/u.test(x.m)) x.c = 'ء';
  return out.filter((x) => x.c !== 'ـ' || x.m);
}

function firstLetter(word) {
  const ls = letters(word).filter((x) => x.c !== 'ـ');
  return ls[0] || null;
}

const hasHaraka = (m) => /[َُِ]/u.test(m);
const hasTanween = (m) => /[ًٌٍ]/u.test(m);
const hasShadda = (m) => /ّ/u.test(m);

// كشف حكم النون الساكنة أو التنوين في الكلمة رقم idx
export function detectNoon(words, idx) {
  const found = [];
  const ls = letters(words[idx]).filter((x) => x.c !== 'ـ');
  for (let k = ls.length - 1; k >= 0; k--) {
    const L = ls[k];
    const isNoonSakin = L.c === 'ن' && !hasHaraka(L.m) && !hasShadda(L.m) && !hasTanween(L.m);
    const isTanween = hasTanween(L.m) || (k === ls.length - 1 && false);
    // التنوين قد يقع على الحرف الأخير أو قبل ألف/ياء تنوين النصب
    if (!isNoonSakin && !isTanween) continue;
    let next = null;
    let sameWord = false;
    if (k + 1 < ls.length && !(isTanween)) {
      next = ls[k + 1];
      sameWord = true;
    } else if (isTanween && k + 1 < ls.length) {
      // تنوين نصب بعده ألف أو ألف مقصورة: الحرف التالي من الكلمة التالية
      const rest = ls.slice(k + 1).map((x) => x.c).join('');
      if (!/^[اىٰ]*$/u.test(rest)) continue;
      next = idx + 1 < words.length ? firstLetter(words[idx + 1]) : null;
    } else {
      next = idx + 1 < words.length ? firstLetter(words[idx + 1]) : null;
    }
    if (!next) { found.push({ rule: 'waqf' }); continue; }
    if (next.c === 'ٱ') { found.push({ rule: 'none' }); continue; }
    const c = next.c;
    let rule;
    if (HALQ.includes(c)) rule = 'izhar-halqi';
    else if (YANMU.includes(c)) rule = sameWord ? 'izhar-mutlaq' : 'idgham-ghunna';
    else if (LR.includes(c)) rule = 'idgham-bila';
    else if (c === 'ب') rule = 'iqlab';
    else rule = 'ikhfa';
    found.push({ rule, letter: c, tanween: isTanween });
  }
  return found;
}

export function detectMeem(words, idx) {
  const ls = letters(words[idx]).filter((x) => x.c !== 'ـ');
  for (let k = ls.length - 1; k >= 0; k--) {
    const L = ls[k];
    if (L.c !== 'م' || hasHaraka(L.m) || hasShadda(L.m) || hasTanween(L.m)) continue;
    let next = k + 1 < ls.length ? ls[k + 1] : idx + 1 < words.length ? firstLetter(words[idx + 1]) : null;
    if (!next) return { rule: 'waqf' };
    if (next.c === 'ٱ') return { rule: 'none' };
    const c = next.c;
    if (c === 'ب') return { rule: 'ikhfa-shafawi', letter: c };
    if (c === 'م') return { rule: 'idgham-shafawi', letter: c };
    return { rule: 'izhar-shafawi', letter: c };
  }
  return null;
}

export function detectLam(word) {
  const ls = letters(word).filter((x) => x.c !== 'ـ');
  for (let k = 0; k < ls.length - 2; k++) {
    if (ls[k].c === 'ٱ' && ls[k + 1].c === 'ل') {
      const lam = ls[k + 1];
      const nxt = ls[k + 2];
      if (/ْ/u.test(lam.m)) return { rule: 'lam-qamari', letter: nxt.c };
      if (hasShadda(nxt.m)) return { rule: 'lam-shamsi', letter: nxt.c };
      if (hasShadda(lam.m)) return { rule: 'lam-shamsi', letter: 'ل' }; // ٱلَّيْل
    }
  }
  return null;
}

export const AUTO_RULES = {
  'izhar-halqi': 'noon', 'idgham-ghunna': 'noon', 'idgham-bila': 'noon', iqlab: 'noon', ikhfa: 'noon', 'izhar-mutlaq': 'noon',
  'ikhfa-shafawi': 'meem', 'idgham-shafawi': 'meem', 'izhar-shafawi': 'meem',
  'lam-qamari': 'lam', 'lam-shamsi': 'lam',
};
