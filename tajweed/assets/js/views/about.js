import { store } from '../store.js';
import { I } from '../icons.js';
import { esc, toast } from '../ui.js';
import { settingsHTML, bindSettings } from '../app.js';

export async function render(el) {
  el.innerHTML = `<div class="wrap narrow"><h1>عن المنصة ومنهجها</h1>
  <section class="card pad-l"><h2>الغاية</h2><p>منصة «إتقان» منهج تعليمي متدرج في علم التجويد، يبدأ من فهم القاعدة وينتهي بإدراكها وتطبيقها أثناء التلاوة. والمتنان — <b>تحفة الأطفال</b> للجمزوري و<b>المقدمة الجزرية</b> لابن الجزري — هما الإطار الحاكم لنطاق المنهج: فكل مسألة وردت فيهما مشروحة، ولا يُفرد درس لموضوع لم يتناولاه.</p></section>

  <section class="card pad-l" style="margin-top:14px"><h2>ترتيب المرجعية</h2><ol>
    <li><b>نصا المتنين</b> لتحديد المسائل الداخلة في المنهج: التحفة بنشرة الشيخ علي محمد الضباع، والجزرية بتحقيق د. عبد المحسن القاسم المقابل على نسختين مقروءتين على المصنف (من المكتبة الشاملة/تراث).</li>
    <li><b>الشروح وكتب التجويد المعتمدة</b> لتحرير المسائل وتفصيلها، ومما رُجع إليه في المكتبة الشاملة (تراث): <em>النشر في القراءات العشر</em> و<em>التمهيد</em> لابن الجزري، و<em>هداية القاري</em> للمرصفي، و<em>غاية المريد</em> لعطية قابل نصر، و<em>فتح رب البرية شرح المقدمة الجزرية</em> لصفوت سالم، و<em>الروضة الندية شرح متن الجزرية</em>، و<em>العميد</em> لمحمود بسة، و<em>القول السديد</em>، و<em>دليل الحيران</em> للمارغني، مع ما نقله محقق الجزرية من <em>المنح الفكرية</em> للقاري و<em>الدقائق المحكمة</em> لزكريا الأنصاري و<em>الحواشي المفهمة</em> لابن الناظم و<em>الطرازات المعلمة</em> لعبد الدائم الأزهري.</li>
    <li><b>التطبيق التعليمي</b>: الأمثلة والتمارين والرسوم بما يخدم فهم المسألة نفسها.</li></ol>
    <p class="small muted">تُذكر في آخر كل درس المصادر التي حُرّر منها. وحيث يختلف أهل العلم في مسألة يُبيَّن الخلاف ولا يُعرض قول واحد على أنه محل اتفاق. وما تعذّر التحقق منه لم يُدرج.</p></section>

  <section class="card pad-l" style="margin-top:14px"><h2>توثيق النص القرآني</h2><p>كل شاهد قرآني في المنصة مكتوب بإحالته (السورة والآية)، وتطابقه أداة التحقق آليًّا مع نص <b>مصحف المدينة النبوية برواية حفص عن عاصم</b> بالرسم العثماني (من بيانات المكتبة القرآنية الشاملة QUL)، ثم يُعرض بالرسم العثماني كما في المصحف. وتتحقق الأداة كذلك آليًّا من تصنيف أحكام النون الساكنة والتنوين والميم الساكنة ولام التعريف في الشواهد والتمارين. والتلاوات المسموعة بصوت الشيخ محمود خليل الحصري تُجلب من خوادم عامة عند الضغط على زر التشغيل.</p>
  <p class="small muted">الرواية المعتمدة في الأمثلة والمقادير: رواية حفص عن عاصم من طريق الشاطبية، مع التنبيه على ما يختلف من طريق الطيبة عند الحاجة.</p></section>

  <section class="card pad-l" style="margin-top:14px"><h2>الإعدادات</h2>${settingsHTML()}
  <div class="settings-row"><span>حفظ التقدم</span><span class="small muted">${store.persistent ? 'يُحفظ تقدمك تلقائيًّا في هذا المتصفح.' : 'الحفظ غير متاح في هذا المتصفح.'}</span></div>
  <div class="row" style="margin-top:14px"><button class="btn sm" id="exp">${I.download} تصدير التقدم</button><label class="btn sm" for="imp">${I.upload} استيراد التقدم</label><input id="imp" type="file" accept="application/json" hidden><span class="spacer"></span><button class="btn sm ghost" id="reset" style="color:var(--bad)">مسح التقدم</button></div>
  <p class="small muted">التصدير ينشئ ملفًا تحفظه لديك وتنقل به تقدمك إلى جهاز آخر.</p></section>
  </div>`;
  bindSettings(el);
  el.querySelector('#exp').addEventListener('click', () => {
    const blob = new Blob([store.export()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `itqan-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  el.querySelector('#imp').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { store.import(await f.text()); toast('تم استيراد التقدم.'); } catch { toast('الملف غير صالح.'); }
  });
  el.querySelector('#reset').addEventListener('click', () => {
    if (confirm('سيُحذف تقدمك كله في هذا المتصفح. هل أنت متأكد؟')) { store.reset(); toast('تم مسح التقدم.'); }
  });
  void esc;
}
