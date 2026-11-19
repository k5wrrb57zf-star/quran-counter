// معجم الأحكام: يُستعمل في التدريب القرآني وتصنيف الشواهد
// group: مجموعة الأحكام المتشابهة (تُستعمل لتوليد البدائل في الأسئلة)
export const RULES = {
  'izhar-halqi': { name: 'إظهار حلقي', group: 'noon', lesson: 'noon-izhar', cause: 'نون ساكنة أو تنوين بعده حرف من حروف الحلق' },
  'idgham-ghunna': { name: 'إدغام بغنة', group: 'noon', lesson: 'noon-idgham', cause: 'نون ساكنة أو تنوين بعده حرف من «ينمو» في كلمتين' },
  'idgham-bila': { name: 'إدغام بغير غنة', group: 'noon', lesson: 'noon-idgham', cause: 'نون ساكنة أو تنوين بعده لام أو راء' },
  'izhar-mutlaq': { name: 'إظهار مطلق', group: 'noon', lesson: 'noon-idgham', cause: 'نون ساكنة بعدها ياء أو واو في كلمة واحدة' },
  iqlab: { name: 'إقلاب', group: 'noon', lesson: 'noon-iqlab', cause: 'نون ساكنة أو تنوين بعده باء' },
  ikhfa: { name: 'إخفاء حقيقي', group: 'noon', lesson: 'noon-ikhfa', cause: 'نون ساكنة أو تنوين بعده أحد حروف الإخفاء الخمسة عشر' },

  'ghunna-mushaddad': { name: 'غنة واجبة (حرف أغن مشدد)', group: 'meem', lesson: 'ghunna', cause: 'نون أو ميم مشددة' },
  'ikhfa-shafawi': { name: 'إخفاء شفوي', group: 'meem', lesson: 'meem-ikhfa-idgham', cause: 'ميم ساكنة بعدها باء' },
  'idgham-shafawi': { name: 'إدغام شفوي (صغير)', group: 'meem', lesson: 'meem-ikhfa-idgham', cause: 'ميم ساكنة بعدها ميم' },
  'izhar-shafawi': { name: 'إظهار شفوي', group: 'meem', lesson: 'meem-izhar', cause: 'ميم ساكنة بعدها غير الباء والميم' },

  'lam-qamari': { name: 'لام قمرية (إظهار)', group: 'lam', lesson: 'lam-al', cause: 'لام «أل» بعدها حرف من «ابغ حجك وخف عقيمه»' },
  'lam-shamsi': { name: 'لام شمسية (إدغام)', group: 'lam', lesson: 'lam-al', cause: 'لام «أل» بعدها حرف من الحروف الشمسية' },
  'lam-fil': { name: 'إظهار لام الفعل', group: 'lam', lesson: 'lam-fil', cause: 'لام ساكنة في فعل بعدها غير اللام والراء' },

  'idgham-mithlayn': { name: 'إدغام متماثلين صغير', group: 'idgham', lesson: 'idgham-ahkam', cause: 'حرف ساكن بعده مثله' },
  'idgham-mutajanisayn': { name: 'إدغام متجانسين صغير', group: 'idgham', lesson: 'idgham-ahkam', cause: 'حرف ساكن بعده حرف يتحد معه مخرجًا ويختلف صفة' },
  'idgham-mutaqaribayn': { name: 'إدغام متقاربين صغير', group: 'idgham', lesson: 'idgham-ahkam', cause: 'حرف ساكن بعده حرف يقاربه مخرجًا أو صفة' },

  'madd-tabii': { name: 'مد طبيعي', group: 'madd', lesson: 'madd-intro', cause: 'حرف مد ليس بعده همز ولا سكون' },
  'madd-muttasil': { name: 'مد واجب متصل', group: 'madd', lesson: 'madd-muttasil', cause: 'حرف مد بعده همز في كلمته' },
  'madd-munfasil': { name: 'مد جائز منفصل', group: 'madd', lesson: 'madd-munfasil', cause: 'حرف مد آخر كلمة وهمز أول التي تليها' },
  'madd-arid': { name: 'مد عارض للسكون', group: 'madd', lesson: 'madd-arid', cause: 'حرف مد بعده سكون عارض للوقف' },
  'madd-leen': { name: 'مد اللين (عند الوقف)', group: 'madd', lesson: 'madd-arid', cause: 'حرف لين بعده سكون عارض للوقف' },
  'madd-badal': { name: 'مد البدل', group: 'madd', lesson: 'madd-badal', cause: 'همز متقدم على حرف المد' },
  'madd-lazim-km': { name: 'مد لازم كلمي مثقل', group: 'madd', lesson: 'madd-lazim', cause: 'حرف مد بعده سكون أصلي مدغم في كلمته' },
  'madd-lazim-kh': { name: 'مد لازم كلمي مخفف', group: 'madd', lesson: 'madd-lazim', cause: 'حرف مد بعده سكون أصلي غير مدغم في كلمته' },
  'madd-lazim-hm': { name: 'مد لازم حرفي مثقل', group: 'madd', lesson: 'madd-lazim', cause: 'حرف هجاؤه ثلاثي وسطه حرف مد وأُدغم آخره فيما بعده' },
  'madd-lazim-hk': { name: 'مد لازم حرفي مخفف', group: 'madd', lesson: 'madd-lazim', cause: 'حرف هجاؤه ثلاثي وسطه حرف مد ولم يُدغم آخره' },
  'madd-harfi-tabii': { name: 'مد طبيعي حرفي', group: 'madd', lesson: 'madd-fawatih', cause: 'حرف من «حي طهر» في فواتح السور' },

  'qalqala-sughra': { name: 'قلقلة صغرى', group: 'qalqala', lesson: 'qalqala', cause: 'حرف من «قطب جد» ساكن وصلًا' },
  'qalqala-kubra': { name: 'قلقلة كبرى', group: 'qalqala', lesson: 'qalqala', cause: 'حرف من «قطب جد» سُكّن للوقف' },

  'raa-tafkhim': { name: 'تفخيم الراء', group: 'raa', lesson: 'raa', cause: 'راء مفتوحة أو مضمومة أو ساكنة بعد فتح أو ضم ونحوه' },
  'raa-tarqiq': { name: 'ترقيق الراء', group: 'raa', lesson: 'raa', cause: 'راء مكسورة أو ساكنة بعد كسر أصلي وليس بعدها مستعلٍ' },
  'jalala-tafkhim': { name: 'تفخيم لام الجلالة', group: 'jalala', lesson: 'lam-jalala', cause: 'لفظ الجلالة بعد فتح أو ضم' },
  'jalala-tarqiq': { name: 'ترقيق لام الجلالة', group: 'jalala', lesson: 'lam-jalala', cause: 'لفظ الجلالة بعد كسر' },
};

export const GROUPS = {
  noon: 'أحكام النون الساكنة والتنوين',
  meem: 'أحكام الميم الساكنة والغنة',
  lam: 'اللامات',
  idgham: 'المثلان والمتقاربان والمتجانسان',
  madd: 'المدود',
  qalqala: 'القلقلة',
  raa: 'الراء',
  jalala: 'لام لفظ الجلالة',
};
