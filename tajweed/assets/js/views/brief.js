import { BAB, LESSONS, loadBab } from '../data.js';
import { esc, AR, rich } from '../ui.js';

// خلاصة الباب: مراجعة سريعة قبل الاختبار
export async function render(el, [babId]) {
  const b = BAB[babId];
  if (!b) { el.innerHTML = '<div class="wrap"><div class="card empty">باب غير معروف</div></div>'; return; }
  const all = await loadBab(babId);
  el.innerHTML = `<div class="wrap narrow"><div class="crumbs"><a href="#/curriculum?open=${b.id}">${esc(b.title)}</a></div><h1>خلاصة الباب: ${esc(b.title)}</h1>
  <p class="muted">مراجعة سريعة يمكن قراءتها في دقائق قبل الاختبار الشامل.</p>
  <div class="grid">${b.lessons.map((id, k) => {
    const body = all[id];
    return `<section class="card"><div class="row"><span class="chip green">${AR(k + 1)}</span><h3 style="margin:0"><a href="#/lesson/${id}">${esc(LESSONS[id].title)}</a></h3></div>
      ${body?.summary ? `<ul style="margin:.6em 0 0">${body.summary.map((s) => `<li>${rich(esc(s))}</li>`).join('')}</ul>` : '<p class="muted">—</p>'}
      ${body?.compare && Array.isArray(body.compare) ? `<div class="small muted" style="margin-top:8px">${body.compare.map((c) => `<div>• <b>${esc(c.a)}</b> / <b>${esc(c.b)}</b>: ${esc(c.diff)}</div>`).join('')}</div>` : ''}
    </section>`;
  }).join('')}</div>
  <div class="row" style="margin-top:18px"><a class="btn primary" href="#/test/${b.id}">ابدأ الاختبار الشامل</a></div></div>`;
}
