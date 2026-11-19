import { ABWAB, MASAIL, LESSONS, OUTSIDE, EXCLUDED, TUHFA, JAZARIYYA, allBodies, loadVerification } from '../data.js';
import { esc, AR } from '../ui.js';
import { SECTIONS } from './lesson.js';
import { vrange } from './curriculum.js';

// خريطة المنهج: نظام التحقق من اكتمال تغطية مسائل المتنين
export async function render(el) {
  const bodies = await allBodies();
  const ver = await loadVerification();
  const status = (id) => {
    const b = bodies[id];
    if (!b) return 'missing';
    const miss = SECTIONS.filter(([k]) => b[k] == null || (Array.isArray(b[k]) ? !b[k].length : !String(b[k]).trim()));
    return miss.length ? 'partial' : 'complete';
  };
  const cover = (M, key) => {
    const covered = new Set([...MASAIL.flatMap((m) => m.src[key] || []), ...OUTSIDE[key]]);
    return M.verses.filter((v) => !covered.has(v.n)).map((v) => v.n);
  };
  const mt = cover(TUHFA, 't');
  const mj = cover(JAZARIYYA, 'j');
  const ms = MASAIL.map((m) => ({ ...m, st: m.lessons.every((l) => status(l) === 'complete') ? 'complete' : m.lessons.some((l) => status(l) !== 'missing') ? 'partial' : 'missing' }));
  const done = ms.filter((m) => m.st === 'complete').length;
  const allOk = !mt.length && !mj.length && done === ms.length;
  const lbl = { complete: '<span class="status-ok">مكتمل</span>', partial: '<span class="status-bad">ناقص</span>', missing: '<span class="status-bad">غير مكتوب</span>' };

  el.innerHTML = `<div class="wrap"><h1>خريطة المنهج والتحقق من الاكتمال</h1>
  <p class="muted">كل مسألة وردت في <b>تحفة الأطفال</b> أو <b>المقدمة الجزرية</b> مسجلة هنا: بابها، وموضعها من المتن، وفروعها، والدروس التي تشرحها، وحالة اكتمال شرحها. لا يُعدّ المنهج مكتملًا إلا إذا غُطّي كل بيت وكُتب كل درس بأقسامه الأحد عشر.</p>
  <div class="stat-row" style="margin:16px 0">
    <div class="stat"><b>${AR(MASAIL.length)}</b><span>مسألة</span></div>
    <div class="stat"><b>${AR(done)}</b><span>مسألة مكتملة الشرح</span></div>
    <div class="stat"><b>${AR(Object.keys(LESSONS).length)}</b><span>درسًا</span></div>
    <div class="stat"><b>${mt.length ? AR(mt.length) : '✓'}</b><span>أبيات التحفة غير المغطاة</span></div>
    <div class="stat"><b>${mj.length ? AR(mj.length) : '✓'}</b><span>أبيات الجزرية غير المغطاة</span></div>
  </div>
  <div class="card ${allOk ? '' : 'warn'}" style="margin-bottom:16px"><b>${allOk ? '✓ المنهج مكتمل: كل أبيات المتنين مغطاة، وكل مسألة مشروحة بدروس مكتملة الأقسام.' : 'المنهج غير مكتمل بعد.'}</b>
  ${ver ? `<div class="small muted" style="margin-top:6px">آخر تشغيل لأداة التحقق (tools/verify.mjs): ${new Date(ver.summary.checkedAt).toLocaleDateString('ar')} — الشواهد القرآنية الموثقة آليًّا: ${AR(ver.summary.quranRefs.verified)} من ${AR(ver.summary.quranRefs.total)}، والأخطاء: ${AR(ver.summary.errors)}.</div>` : ''}
  ${mt.length ? `<div>أبيات التحفة غير المغطاة: ${mt.map(AR).join('، ')}</div>` : ''}${mj.length ? `<div>أبيات الجزرية غير المغطاة: ${mj.map(AR).join('، ')}</div>` : ''}</div>
  ${ABWAB.map((b) => `<h2 style="margin-top:26px">${AR(b.n)}. ${esc(b.title)}</h2>
    <div class="tbl-wrap"><table class="tbl cov-table"><thead><tr><th>المسألة</th><th>المتن</th><th>الفروع</th><th>الدروس</th><th>الحالة</th></tr></thead><tbody>
    ${ms.filter((m) => m.bab === b.id).map((m) => `<tr><td><b>${esc(m.title)}</b></td><td class="small">${m.src.t ? `التحفة ${vrange(m.src.t)}` : ''}${m.src.t && m.src.j ? '<br>' : ''}${m.src.j ? `الجزرية ${vrange(m.src.j)}` : ''}</td><td class="small">${(m.branches || []).map(esc).join('، ')}</td><td class="small">${m.lessons.map((l) => `<a href="#/lesson/${l}">${esc(LESSONS[l].title)}</a>`).join('<br>')}</td><td>${lbl[m.st]}</td></tr>`).join('')}
    </tbody></table></div>`).join('')}
  <h2 style="margin-top:30px">أبيات لا مسألة فيها</h2><p class="small muted">التحفة: ${OUTSIDE.t.map(AR).join('، ')} — الجزرية: ${OUTSIDE.j.map(AR).join('، ')} (البسملة، والحمد، والتسمية، والخاتمة).</p>
  <h2 style="margin-top:24px">موضوعات لم تُفرد بدروس التزامًا بنطاق المتنين</h2>
  <div class="tbl-wrap"><table class="tbl"><tbody>${EXCLUDED.map((x) => `<tr><td><b>${esc(x.title)}</b></td><td class="small">${esc(x.why)}</td></tr>`).join('')}</tbody></table></div></div>`;
}
