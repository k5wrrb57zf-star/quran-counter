import { loadLetters, LESSONS } from '../data.js';
import { esc } from '../ui.js';
import { mountMakharij } from '../diagrams.js';

// مستكشف الحروف: مخرج كل حرف وصفاته والأحكام المتعلقة به
export async function render(el, _p, params) {
  const { LETTERS, MAKHARIJ, sifatOf, LETTER_NOTES, LETTER_SETS } = await loadLetters();
  el.innerHTML = `<div class="wrap"><h1>الحروف: المخارج والصفات</h1>
  <p class="muted">رسم تعليمي مبسط لمواضع المخارج السبعة عشر، ومستكشف لكل حرف: مخرجه، وصفاته كما في المقدمة الجزرية، والأحكام التي يدخل فيها.</p>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));align-items:start">
    <div id="dg"></div>
    <div class="card"><h3>اختر حرفًا</h3><div class="letter-grid">${LETTERS.map((l) => `<button data-c="${l.c}" aria-label="${l.name}">${l.c}</button>`).join('')}</div><div id="li" style="margin-top:14px"></div></div>
  </div></div>`;
  const select = await mountMakharij(el.querySelector('#dg'));
  const li = el.querySelector('#li');
  const show = (c) => {
    const L = LETTERS.find((x) => x.c === c);
    if (!L) return;
    el.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('on', b.dataset.c === c));
    const mk = MAKHARIJ.find((m) => m.id === L.makhraj);
    select(mk.id);
    const sets = LETTER_SETS.filter((s) => s.letters.includes(c));
    li.innerHTML = `<div class="row"><span style="font-family:var(--font-matn);font-size:2.6rem;line-height:1;color:var(--primary)">${c}</span><div><b>${esc(L.name)}</b><div class="small muted">المخرج: ${esc(mk.name)}</div></div></div>
      <h4>الصفات</h4><div class="row">${sifatOf(c).map((s) => `<span class="chip green">${esc(s)}</span>`).join('')}</div>
      ${LETTER_NOTES[c] ? `<div class="note small">${esc(LETTER_NOTES[c])}</div>` : ''}
      ${sets.length ? `<h4>يدخل في</h4><ul>${sets.map((s) => `<li><a href="#/lesson/${s.lesson}">${esc(s.name)}</a></li>`).join('')}</ul>` : ''}
      <div class="small"><a href="#/lesson/${mk.lessons[0]}">درس المخرج: ${esc(LESSONS[mk.lessons[0]].title)}</a></div>`;
  };
  el.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => show(b.dataset.c)));
  if (params.c) show(params.c);
}
