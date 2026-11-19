import { ABWAB, LESSONS, MASAIL, MUTUN, RULES, BAB, allBodies, snippets, verseLessons, loadLetters } from '../data.js';
import { I } from '../icons.js';
import { esc, norm, AR, quranHTML } from '../ui.js';

let INDEX = null;
const strip = (h) => String(h || '').replace(/\{\{(\d+:\d+)\|([^|}]+)(?:\|[^}]*)?\}\}/g, '$2').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function buildIndex() {
  if (INDEX) return INDEX;
  const bodies = await allBodies();
  const idx = [];
  for (const [id, L] of Object.entries(LESSONS)) {
    const b = bodies[id] || {};
    const text = ['intro', 'definition', 'rule', 'divisions', 'details', 'practice'].map((k) => strip(b[k])).join(' ') + ' ' + (b.summary || []).join(' ') + ' ' + (b.mistakes || []).join(' ');
    idx.push({ kind: 'درس', title: L.title, sub: BAB[L.bab].title, href: `#/lesson/${id}`, key: norm(L.title + ' ' + L.brief), body: norm(text), raw: text, w: 3 });
    for (const ex of b.examples || []) {
      const s = snippets()[ex.q];
      if (!s) continue;
      idx.push({ kind: 'آية', title: `${s.n} ${AR(s.a)}`, sub: L.title, href: `#/lesson/${id}#s-examples`, key: norm(s.t + ' ' + s.n + ' ' + s.a + ' ' + s.s + ':' + s.a), body: '', quran: ex.q, w: 2 });
    }
  }
  for (const m of MASAIL) {
    idx.push({ kind: 'مسألة', title: m.title, sub: (m.branches || []).join('، '), href: `#/lesson/${m.lessons[0]}`, key: norm(m.title + ' ' + (m.branches || []).join(' ')), body: '', w: 2.5 });
  }
  for (const b of ABWAB) {
    for (const t of b.tuhfa) idx.push({ kind: 'باب من التحفة', title: t, sub: `الباب ${b.title}`, href: `#/curriculum?open=${b.id}`, key: norm(t), body: '', w: 2 });
    for (const t of b.jazari) idx.push({ kind: 'باب من الجزرية', title: t, sub: `الباب ${b.title}`, href: `#/curriculum?open=${b.id}`, key: norm(t), body: '', w: 2 });
    idx.push({ kind: 'باب', title: b.title, sub: b.desc, href: `#/curriculum?open=${b.id}`, key: norm(b.title + ' ' + b.desc), body: '', w: 2.5 });
  }
  for (const [mid, M] of Object.entries(MUTUN)) {
    for (const v of M.verses) {
      const ls = verseLessons(mid, v.n);
      idx.push({ kind: M.short, title: `${v.a} ... ${v.b}`, sub: `البيت ${AR(v.n)}`, href: ls.length ? `#/lesson/${ls[0]}` : `#/mutun?m=${mid}#${mid}-${v.n}`, key: norm(v.a + ' ' + v.b), body: '', matn: true, w: 1.5 });
    }
  }
  for (const [, r] of Object.entries(RULES)) idx.push({ kind: 'حكم', title: r.name, sub: r.cause, href: `#/lesson/${r.lesson}`, key: norm(r.name + ' ' + r.cause), body: '', w: 2.5 });
  INDEX = idx;
  return idx;
}

function snippetAround(raw, q) {
  const n = norm(raw);
  const i = n.indexOf(q);
  if (i < 0) return '';
  // تقريب الموضع في النص الخام
  const start = Math.max(0, i - 60);
  return '…' + esc(raw.slice(start, start + 170)) + '…';
}

export async function render(el, _p, params) {
  const q0 = params.q || '';
  el.innerHTML = `<div class="wrap narrow"><h1>البحث</h1>
  <div class="search-box">${I.search}<input id="q" type="search" placeholder="ابحث باسم حكم، أو حرف، أو مصطلح، أو آية، أو باب من المتنين…" value="${esc(q0)}" autocomplete="off" aria-label="نص البحث"></div>
  <div class="row small muted" style="margin-top:8px">أمثلة: <a href="#/search?q=الإخفاء">الإخفاء</a> · <a href="#/search?q=ض">ض</a> · <a href="#/search?q=الاستطالة">الاستطالة</a> · <a href="#/search?q=في الراءات">في الراءات</a> · <a href="#/search?q=البقرة 255">البقرة 255</a> · <a href="#/search?q=يرملون">يرملون</a></div>
  <div id="res" class="res"></div></div>`;
  const input = el.querySelector('#q');
  const res = el.querySelector('#res');
  const { LETTERS, LETTER_SETS, MAKHARIJ } = await loadLetters();
  const idx = await buildIndex();

  const run = () => {
    const raw = input.value.trim();
    const q = norm(raw);
    if (!q) { res.innerHTML = ''; return; }
    const out = [];
    // البحث بحرف واحد
    const letter = LETTERS.find((l) => l.c === raw || norm(l.name) === q);
    if (letter) {
      const mk = MAKHARIJ.find((m) => m.id === letter.makhraj);
      const sets = LETTER_SETS.filter((s) => s.letters.includes(letter.c));
      out.push(`<a class="card" href="#/letters?c=${encodeURIComponent(letter.c)}"><span class="chip gold kind">حرف</span><h3 style="margin:.2em 0">${letter.c} — ${esc(letter.name)}</h3><div class="small muted">المخرج: ${esc(mk.name)}${sets.length ? ' · يدخل في: ' + sets.map((s) => esc(s.name)).join('، ') : ''}</div></a>`);
    }
    const terms = q.split(/\s+/).filter(Boolean);
    const scored = [];
    for (const it of idx) {
      let sc = 0;
      for (const t of terms) {
        if (it.key.includes(t)) sc += it.w * 2;
        else if (it.body && it.body.includes(t)) sc += 1;
        else { sc = 0; break; }
      }
      if (sc > 0) scored.push([sc, it]);
    }
    scored.sort((a, b) => b[0] - a[0]);
    for (const [, it] of scored.slice(0, 40)) {
      const snip = !it.key.includes(terms[0]) && it.raw ? snippetAround(it.raw, terms[0]) : '';
      out.push(`<a class="card" href="${it.href}"><span class="chip ${it.kind === 'درس' ? 'green' : it.kind === 'آية' ? 'info' : 'gold'} kind">${esc(it.kind)}</span>
        <div style="margin-top:4px">${it.quran ? quranHTML(it.quran, { cls: 'q-inline' }) : `<b${it.matn ? ' style="font-family:var(--font-matn);font-size:1.1rem"' : ''}>${esc(it.title)}</b>`}</div>
        <div class="small muted">${esc(it.sub || '')}</div>${snip ? `<div class="small" style="margin-top:4px">${snip}</div>` : ''}</a>`);
    }
    res.innerHTML = out.length ? `<div class="small muted">${AR(out.length)} نتيجة</div>` + out.join('') : `<div class="card empty">لا نتائج لـ«${esc(raw)}». جرّب كلمة أخرى أو جزءًا منها.</div>`;
  };
  let t;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { history.replaceState(null, '', `#/search?q=${encodeURIComponent(input.value)}`); run(); }, 180);
  });
  input.focus();
  run();
}
