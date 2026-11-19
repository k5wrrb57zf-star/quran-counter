// الحروف ومخارجها وصفاتها على ما في المقدمة الجزرية وشروحها
// المخارج السبعة عشر على مختار ابن الجزري (ب9: «مخارج الحروف سبعة عشر على الذي يختاره من اختبر»)
// x, y: مواضع النقاط على الرسم التوضيحي (assets/js/diagrams.js)
export const MAKHARIJ = [
  { id: 'jawf', n: 1, general: 'الجوف', name: 'الجوف', short: 'الجوف', letters: 'ا و ي (المدية)', place: 'الخلاء الداخل في الحلق والفم؛ تخرج منه حروف المد الثلاثة وتنتهي بانتهاء الهواء، فمخرجها مقدَّر لا محقق.', x: 318, y: 186, lessons: ['makharij-jawf-halq'] },
  { id: 'aqsa-halq', n: 2, general: 'الحلق', name: 'أقصى الحلق', short: 'أقصى الحلق', letters: 'ء هـ', place: 'أبعد الحلق مما يلي الصدر.', x: 186, y: 305, lessons: ['makharij-jawf-halq'] },
  { id: 'wasat-halq', n: 3, general: 'الحلق', name: 'وسط الحلق', short: 'وسط الحلق', letters: 'ع ح', place: 'وسط الحلق.', x: 186, y: 268, lessons: ['makharij-jawf-halq'] },
  { id: 'adna-halq', n: 4, general: 'الحلق', name: 'أدنى الحلق', short: 'أدنى الحلق', letters: 'غ خ', place: 'أقرب الحلق إلى الفم.', x: 186, y: 232, lessons: ['makharij-jawf-halq'] },
  { id: 'qaf', n: 5, general: 'اللسان', name: 'أقصى اللسان مع ما فوقه من الحنك الأعلى', short: 'القاف', letters: 'ق', place: 'أقصى اللسان مما يلي الحلق مع ما يحاذيه من الحنك الأعلى.', x: 214, y: 214, lessons: ['makharij-lisan1'] },
  { id: 'kaf', n: 6, general: 'اللسان', name: 'أقصى اللسان أسفل من مخرج القاف قليلًا', short: 'الكاف', letters: 'ك', place: 'أقصى اللسان أسفل من مخرج القاف قليلًا (أي أقرب إلى الفم) مع ما يحاذيه من الحنك الأعلى.', x: 236, y: 204, lessons: ['makharij-lisan1'] },
  { id: 'wasat-lisan', n: 7, general: 'اللسان', name: 'وسط اللسان مع ما يحاذيه من الحنك الأعلى', short: 'ج ش ي', letters: 'ج ش ي', place: 'وسط اللسان مع ما يحاذيه من الحنك الأعلى؛ والياء هنا غير المدية.', x: 268, y: 200, lessons: ['makharij-lisan1'] },
  { id: 'hafa', n: 8, general: 'اللسان', name: 'إحدى حافتي اللسان أو كلتاهما مع الأضراس العليا', short: 'الضاد', letters: 'ض', place: 'إحدى حافتي اللسان أو كلتاهما مع ما يليها من الأضراس العليا، ومن اليسرى أيسر وأكثر استعمالًا.', x: 352, y: 206, lessons: ['makharij-lisan1'] },
  { id: 'lam', n: 9, general: 'اللسان', name: 'أدنى حافتي اللسان إلى منتهى طرفه', short: 'اللام', letters: 'ل', place: 'أدنى حافتي اللسان إلى منتهى طرفه مع ما يحاذيها من لثة الأسنان العليا.', x: 372, y: 208, lessons: ['makharij-lisan1'] },
  { id: 'nun', n: 10, general: 'اللسان', name: 'طرف اللسان تحت مخرج اللام قليلًا', short: 'النون', letters: 'ن', place: 'طرف اللسان مع ما يحاذيه من لثة الثنايا العليا، تحت مخرج اللام قليلًا.', x: 399, y: 203, lessons: ['makharij-lisan2'] },
  { id: 'raa', n: 11, general: 'اللسان', name: 'طرف اللسان مع ظهره', short: 'الراء', letters: 'ر', place: 'طرف اللسان مع ظهره مما يلي رأسه، قريبًا من مخرج النون لكنه أدخل إلى ظهر اللسان.', x: 386, y: 193, lessons: ['makharij-lisan2'] },
  { id: 'nitiyya', n: 12, general: 'اللسان', name: 'طرف اللسان مع أصول الثنايا العليا', short: 'ط د ت', letters: 'ط د ت', place: 'طرف اللسان مع أصول الثنايا العليا؛ وتسمى النطعية نسبة إلى نطع الغار الأعلى.', x: 404, y: 188, lessons: ['makharij-lisan2'] },
  { id: 'asaliyya', n: 13, general: 'اللسان', name: 'طرف اللسان مع ما فوق الثنايا السفلى', short: 'ص ز س', letters: 'ص ز س', place: 'من طرف اللسان ومن فوق الثنايا السفلى، ويبقى بينهما انفراج يسير يجري فيه الصفير؛ وتسمى الأسلية.', x: 396, y: 225, lessons: ['makharij-lisan2'] },
  { id: 'lathawiyya', n: 14, general: 'اللسان', name: 'طرف اللسان مع أطراف الثنايا العليا', short: 'ظ ذ ث', letters: 'ظ ذ ث', place: 'طرف اللسان مع أطراف الثنايا العليا؛ وتسمى اللثوية لقربها من اللثة.', x: 416, y: 207, lessons: ['makharij-lisan2'] },
  { id: 'fa', n: 15, general: 'الشفتان', name: 'بطن الشفة السفلى مع أطراف الثنايا العليا', short: 'الفاء', letters: 'ف', place: 'باطن الشفة السفلى مع أطراف الثنايا العليا المُشرفة عليها.', x: 431, y: 222, lessons: ['makharij-shafa'] },
  { id: 'shafatan', n: 16, general: 'الشفتان', name: 'الشفتان', short: 'و ب م', letters: 'و ب م', place: 'الشفتان معًا: بانطباقهما في الباء والميم (والباء أقوى انطباقًا)، وبانفتاحهما مع استدارة في الواو غير المدية.', x: 446, y: 196, lessons: ['makharij-shafa'] },
  { id: 'khayshum', n: 17, general: 'الخيشوم', name: 'الخيشوم', short: 'الخيشوم', letters: 'الغنة', place: 'أقصى الأنف من الداخل؛ تخرج منه الغنة، ولو أُمسك الأنف لانحبس صوتها.', x: 330, y: 118, lessons: ['makharij-shafa', 'ghunna'] },
];

// مجموعات الصفات كما نظمها ابن الجزري (ب20–26)
export const SIFAT_SETS = {
  hams: { name: 'الهمس', opp: 'jahr', letters: 'فحثهشخصسكت', key: 'فحثه شخص سكت' },
  shidda: { name: 'الشدة', letters: 'ءجدقطبكت', key: 'أجد قط بكت' },
  tawassut: { name: 'التوسط', letters: 'لنعمر', key: 'لن عمر' },
  istila: { name: 'الاستعلاء', letters: 'خصضغطقظ', key: 'خص ضغط قظ' },
  itbaq: { name: 'الإطباق', letters: 'صضطظ', key: 'ص ض ط ظ' },
  idhlaq: { name: 'الإذلاق', letters: 'فرمنلب', key: 'فر من لب' },
  safir: { name: 'الصفير', letters: 'صزس', key: 'ص ز س' },
  qalqala: { name: 'القلقلة', letters: 'قطبجد', key: 'قطب جد' },
  leen: { name: 'اللين', letters: 'وي', key: 'الواو والياء الساكنتان بعد فتح' },
  inhiraf: { name: 'الانحراف', letters: 'لر', key: 'اللام والراء' },
  takrir: { name: 'التكرير', letters: 'ر', key: 'الراء' },
  tafashi: { name: 'التفشي', letters: 'ش', key: 'الشين' },
  istitala: { name: 'الاستطالة', letters: 'ض', key: 'الضاد' },
};

export const LETTERS = [
  ['ء', 'الهمزة', 'aqsa-halq'], ['ا', 'الألف', 'jawf'], ['ب', 'الباء', 'shafatan'], ['ت', 'التاء', 'nitiyya'], ['ث', 'الثاء', 'lathawiyya'],
  ['ج', 'الجيم', 'wasat-lisan'], ['ح', 'الحاء', 'wasat-halq'], ['خ', 'الخاء', 'adna-halq'], ['د', 'الدال', 'nitiyya'], ['ذ', 'الذال', 'lathawiyya'],
  ['ر', 'الراء', 'raa'], ['ز', 'الزاي', 'asaliyya'], ['س', 'السين', 'asaliyya'], ['ش', 'الشين', 'wasat-lisan'], ['ص', 'الصاد', 'asaliyya'],
  ['ض', 'الضاد', 'hafa'], ['ط', 'الطاء', 'nitiyya'], ['ظ', 'الظاء', 'lathawiyya'], ['ع', 'العين', 'wasat-halq'], ['غ', 'الغين', 'adna-halq'],
  ['ف', 'الفاء', 'fa'], ['ق', 'القاف', 'qaf'], ['ك', 'الكاف', 'kaf'], ['ل', 'اللام', 'lam'], ['م', 'الميم', 'shafatan'],
  ['ن', 'النون', 'nun'], ['ه', 'الهاء', 'aqsa-halq'], ['و', 'الواو', 'shafatan'], ['ي', 'الياء', 'wasat-lisan'],
].map(([c, name, makhraj]) => ({ c, name, makhraj }));

export const LETTER_NOTES = {
  ا: 'الألف لا تكون إلا ساكنة مدية بعد فتح، ومخرجها الجوف، وتتبع ما قبلها تفخيمًا وترقيقًا.',
  و: 'الواو المتحركة أو الساكنة بعد فتح مخرجها الشفتان، والواو المدية (ساكنة بعد ضم) مخرجها الجوف. وإذا سكنت وانفتح ما قبلها فهي حرف لين.',
  ي: 'الياء المتحركة أو الساكنة بعد فتح مخرجها وسط اللسان، والياء المدية (ساكنة بعد كسر) مخرجها الجوف. وإذا سكنت وانفتح ما قبلها فهي حرف لين.',
  ن: 'الغنة صفة لازمة للنون، ومخرجها الخيشوم.',
  م: 'الغنة صفة لازمة للميم، ومخرجها الخيشوم.',
  ر: 'تتصف بالتكرير، ويُعرف ليُتحرز منه لا ليُعمل به.',
};

// الصفات المتضادة لحرف (خمس صفات لازمة) ثم الصفات التي لا ضد لها
export function sifatOf(c) {
  const S = SIFAT_SETS;
  const has = (k) => S[k].letters.includes(c);
  const list = [
    has('hams') ? 'الهمس' : 'الجهر',
    has('shidda') ? 'الشدة' : has('tawassut') ? 'التوسط' : 'الرخاوة',
    has('istila') ? 'الاستعلاء' : 'الاستفال',
    has('itbaq') ? 'الإطباق' : 'الانفتاح',
    has('idhlaq') ? 'الإذلاق' : 'الإصمات',
  ];
  for (const k of ['safir', 'qalqala', 'leen', 'inhiraf', 'takrir', 'tafashi', 'istitala']) if (has(k)) list.push(k === 'leen' ? 'اللين (إذا سكن بعد فتح)' : S[k].name);
  return list;
}

// عضوية الحرف في أحكام الأبواب (للبحث بالحرف)
export const LETTER_SETS = [
  { name: 'الإظهار الحلقي (النون الساكنة والتنوين)', letters: 'ءهعحغخ', lesson: 'noon-izhar' },
  { name: 'الإدغام بغنة', letters: 'ينمو', lesson: 'noon-idgham' },
  { name: 'الإدغام بغير غنة', letters: 'لر', lesson: 'noon-idgham' },
  { name: 'الإقلاب', letters: 'ب', lesson: 'noon-iqlab' },
  { name: 'الإخفاء الحقيقي', letters: 'صذثكجشقسدطزفتضظ', lesson: 'noon-ikhfa' },
  { name: 'الإخفاء الشفوي (الميم الساكنة)', letters: 'ب', lesson: 'meem-ikhfa-idgham' },
  { name: 'الإدغام الشفوي', letters: 'م', lesson: 'meem-ikhfa-idgham' },
  { name: 'اللام القمرية', letters: 'ابغحجكوخفعقيمه', lesson: 'lam-al' },
  { name: 'اللام الشمسية', letters: 'طثصرتضذندسظزشل', lesson: 'lam-al' },
  { name: 'حروف المد', letters: 'اوي', lesson: 'madd-intro' },
  { name: 'حروف «كم عسل نقص» في الفواتح', letters: 'كمعسلنقص', lesson: 'madd-fawatih' },
  { name: 'حروف «حي طهر» في الفواتح', letters: 'حيطهر', lesson: 'madd-fawatih' },
  { name: 'حروف الاستعلاء (التفخيم)', letters: 'خصضغطقظ', lesson: 'tafkhim-maratib' },
  { name: 'حروف القلقلة', letters: 'قطبجد', lesson: 'qalqala' },
];
