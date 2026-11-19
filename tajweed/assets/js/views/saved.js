import { LESSONS, BAB } from '../data.js';
import { store } from '../store.js';
import { esc } from '../ui.js';

export async function render(el) {
  const ids = store.s.bookmarks.filter((id) => LESSONS[id]);
  el.innerHTML = `<div class="wrap narrow"><h1>الدروس المحفوظة</h1><p class="muted">الدروس التي علّمتها بنجمة للعودة إليها ومراجعتها.</p>
  ${ids.length ? `<div class="grid">${ids.map((id) => `<a class="card" href="#/lesson/${id}"><b>${esc(LESSONS[id].title)}</b><div class="small muted">${esc(BAB[LESSONS[id].bab].title)}</div></a>`).join('')}</div>`
    : '<div class="card empty">لم تحفظ دروسًا بعد. استعمل زر «احفظ للمراجعة» في أي درس.</div>'}</div>`;
}
