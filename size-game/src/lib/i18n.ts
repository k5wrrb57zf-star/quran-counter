import type { Conf, Key, Lang, Subject } from "./types";
import type { Rating } from "./score";

const STR = {
  appName: { ar: "مِقياس", en: "Miqyas" },
  tagline: { ar: "خمّن الأحجام الحقيقية… وشوف كم عينك دقيقة", en: "Guess real-world sizes. Find out how good your eye really is." },
  play: { ar: "ابدأ اللعب", en: "Play" },
  rounds10: { ar: "10 جولات", en: "10 rounds" },
  difficulty: { ar: "المستوى", en: "Difficulty" },
  mixed: { ar: "منوّع", en: "Mixed" },
  easy: { ar: "سهل", en: "Easy" },
  medium: { ar: "متوسط", en: "Medium" },
  hard: { ar: "صعب", en: "Hard" },
  category: { ar: "الفئة", en: "Category" },
  all: { ar: "الكل (مخلوط)", en: "Everything (mixed)" },
  endless: { ar: "بلا نهاية", en: "Endless" },
  endlessSub: { ar: "العب حتى تقرر التوقف — تزداد الصعوبة تدريجيًا", en: "Keep going until you stop — it gets harder" },
  daily: { ar: "تحدّي اليوم", en: "Daily challenge" },
  dailySub: { ar: "5 مقارنات جديدة كل يوم، نفسها للجميع", en: "5 new comparisons every day, same for everyone" },
  dailyDone: { ar: "لعبت تحدي اليوم", en: "Played today" },
  party: { ar: "تحدّي الأصدقاء", en: "Pass & play" },
  partySub: { ar: "2–4 لاعبين على نفس الجهاز", en: "2–4 players on one device" },
  stats: { ar: "إحصائياتي", en: "My stats" },
  sources: { ar: "المصادر والصور", en: "Sources & credits" },
  round: { ar: "الجولة", en: "Round" },
  of: { ar: "من", en: "of" },
  score: { ar: "النقاط", en: "Score" },
  reveal: { ar: "اكشف الإجابة", en: "Reveal answer" },
  lockIn: { ar: "ثبّت تخميني", en: "Lock in guess" },
  next: { ar: "الجولة التالية", en: "Next round" },
  finish: { ar: "النتيجة النهائية", en: "See results" },
  stop: { ar: "إنهاء", en: "Finish" },
  smaller: { ar: "أصغر", en: "Smaller" },
  bigger: { ar: "أكبر", en: "Bigger" },
  reset: { ar: "إعادة", en: "Reset" },
  dragHint: { ar: "اسحب لتكبير أو تصغير — ابعد إصبعك للأعلى لتحكّم أدق", en: "Drag to resize — move your finger up for finer control" },
  yourGuess: { ar: "تخمينك", en: "Your guess" },
  actual: { ar: "الحجم الحقيقي", en: "Actual size" },
  ratio: { ar: "النسبة الصحيحة", en: "Correct ratio" },
  yourRatio: { ar: "نسبتك", en: "Your ratio" },
  error: { ar: "الخطأ", en: "Error" },
  accuracy: { ar: "الدقة", en: "Accuracy" },
  match: { ar: "نسبة التطابق", en: "Match" },
  biggerBy: { ar: "أكبر بـ", en: "too big by" },
  smallerBy: { ar: "أصغر بـ", en: "too small by" },
  points: { ar: "نقطة", en: "pts" },
  tooBig: { ar: "أكبر من الحقيقة", en: "too big" },
  tooSmall: { ar: "أصغر من الحقيقة", en: "too small" },
  difference: { ar: "الفرق", en: "Difference" },
  source: { ar: "المصدر", en: "Source" },
  reference: { ar: "المرجع", en: "Reference" },
  challenge: { ar: "حرّكه أنت", en: "Resize me" },
  home: { ar: "الرئيسية", en: "Home" },
  playAgain: { ar: "العب مرة أخرى", en: "Play again" },
  totalScore: { ar: "مجموع النقاط", en: "Total score" },
  avgAccuracy: { ar: "متوسط الدقة", en: "Average accuracy" },
  bestStreak: { ar: "أفضل سلسلة", en: "Best streak" },
  streak: { ar: "سلسلة", en: "Streak" },
  roundsPlayed: { ar: "الجولات الملعوبة", en: "Rounds played" },
  personalBest: { ar: "أفضل نتيجة", en: "Personal best" },
  leaderboard: { ar: "لوحة الصدارة", en: "Leaderboard" },
  newBest: { ar: "رقم قياسي جديد!", en: "New personal best!" },
  resetStats: { ar: "مسح الإحصائيات", en: "Reset stats" },
  confirmReset: { ar: "اضغط مرة ثانية للتأكيد — سيتم حذف كل الإحصائيات", en: "Tap again to delete all stats" },
  players: { ar: "اللاعبون", en: "Players" },
  addPlayer: { ar: "إضافة لاعب", en: "Add player" },
  start: { ar: "ابدأ", en: "Start" },
  turnOf: { ar: "دور", en: "Turn:" },
  passTo: { ar: "أعطِ الجهاز لـ", en: "Pass the device to" },
  ready: { ar: "جاهز", en: "I'm ready" },
  winner: { ar: "الفائز", en: "Winner" },
  noGames: { ar: "لا توجد نتائج بعد — العب أول جولة!", en: "No games yet — play your first round!" },
  estimateBadge: { ar: "تقديري", en: "Estimate" },
  searchSubjects: { ar: "ابحث…", en: "Search…" },
  imageCredit: { ar: "الصورة", en: "Image" },
  licence: { ar: "الترخيص", en: "Licence" },
  aboutData: {
    ar: "كل المقاسات مأخوذة من مصادر رسمية أو مراجع موثوقة. المقاسات المصنفة «تقديري» ليست أرقامًا رسمية، والمصنفة «متوسط تقريبي» تمثل الحجم المعتاد للنوع أو الفئة. الصور من ويكيميديا كومنز وويكيبيديا، وصور الشخصيات الخيالية محمية بحقوق أصحابها وتُستخدم هنا بدقة منخفضة لأغراض تعليمية.",
    en: "Every measurement comes from an official or reputable source. Values marked “Estimate” are not official figures; “Typical” values describe a typical adult or model. Images come from Wikimedia Commons and Wikipedia; fictional characters are © their owners and shown at low resolution for educational purposes.",
  },
  theme: { ar: "المظهر", en: "Theme" },
  rounds: { ar: "جولات", en: "rounds" },
  best: { ar: "الأفضل", en: "Best" },
  close: { ar: "إغلاق", en: "Close" },
  tapToCompare: { ar: "تخمينك موضّح بالإطار المنقّط", en: "Your guess is the dotted outline" },
  dailyResult: { ar: "نتيجة تحدي اليوم", en: "Today's result" },
  comeBack: { ar: "ارجع بكرة لتحدٍّ جديد", en: "Come back tomorrow for a new one" },
  heightOf: { ar: "الارتفاع", en: "Height" },
  lengthOf: { ar: "الطول", en: "Length" },
  diameterOf: { ar: "القطر", en: "Diameter" },
} as const;

export type StrKey = keyof typeof STR;
export const t = (lang: Lang, k: StrKey) => STR[k][lang];

export const CAT_LABEL: Record<string, { ar: string; en: string }> = {
  pop: { ar: "شخصيات وألعاب", en: "Pop culture & games" },
  anime: { ar: "أنمي", en: "Anime" },
  animals: { ar: "حيوانات", en: "Animals" },
  prehistoric: { ar: "ديناصورات وما قبل التاريخ", en: "Dinosaurs & prehistoric" },
  vehicles: { ar: "سيارات ومركبات", en: "Cars & vehicles" },
  giants: { ar: "طائرات وسفن وصواريخ", en: "Planes, ships & rockets" },
  landmarks: { ar: "معالم ومبانٍ", en: "Landmarks" },
  nature: { ar: "جبال وطبيعة", en: "Mountains & nature" },
  space: { ar: "الفضاء", en: "Space" },
  rocks: { ar: "كويكبات ونيازك", en: "Asteroids & meteorites" },
  sports: { ar: "رياضة", en: "Sports" },
  people: { ar: "مشاهير ورياضيون", en: "Famous people" },
  everyday: { ar: "أشياء يومية", en: "Everyday objects" },
};

export const CONF_LABEL: Record<Conf, { ar: string; en: string }> = {
  official: { ar: "رسمي", en: "Official" },
  measured: { ar: "مُقاس", en: "Measured" },
  typical: { ar: "متوسط تقريبي", en: "Typical" },
  estimate: { ar: "تقديري", en: "Estimate" },
};

export const RATING_LABEL: Record<Rating, { ar: string; en: string }> = {
  perfect: { ar: "مثالي!", en: "Perfect!" },
  excellent: { ar: "ممتاز", en: "Excellent" },
  great: { ar: "رائع", en: "Great" },
  good: { ar: "جيد", en: "Good" },
  off: { ar: "بعيد شوي", en: "A bit off" },
  wayoff: { ar: "بعيد جدًا", en: "Way off" },
};

export const nameOf = (s: Subject, lang: Lang) => (lang === "ar" ? s.ar : s.en);

export function question(lang: Lang, key: Key, a: Subject, b: Subject): string {
  const A = nameOf(a, lang), B = nameOf(b, lang);
  const sphere = key === "d" || a.dims.d != null || b.dims.d != null;
  if (lang === "ar") {
    if (key === "d") return `ما قطر ${B} مقارنةً بـ${A}؟`;
    if (sphere) return `ما حجم ${B} مقارنةً بـ${A}؟`;
    return key === "h" ? `ما ارتفاع ${B} مقارنةً بـ${A}؟` : `ما طول ${B} مقارنةً بـ${A}؟`;
  }
  if (key === "d") return `How wide is ${B} compared to ${A}?`;
  if (sphere) return `How big is ${B} compared to ${A}?`;
  return key === "h" ? `How tall is ${B} compared to ${A}?` : `How long is ${B} compared to ${A}?`;
}

/** label for the measurement used for subject s when compared on key */
export function dimLabel(lang: Lang, s: Subject, key: Key): string {
  const usesD = key === "d" || (s.dims[key as "h" | "l"] == null && s.dims.d != null);
  if (usesD) return t(lang, "diameterOf");
  return key === "h" ? t(lang, "heightOf") : t(lang, "lengthOf");
}

export function comparisonSentence(lang: Lang, key: Key, big: Subject, small: Subject, ratio: string, sphereMix: boolean) {
  const B = nameOf(big, lang), S = nameOf(small, lang);
  if (lang === "ar") {
    const adj = key === "d" ? "أكبر قطرًا" : sphereMix ? "أكبر" : key === "h" ? "أطول" : "أطول";
    return `${B} ${adj} من ${S} بـ ${ratio} مرة`;
  }
  const adj = key === "d" ? "wider" : sphereMix ? "bigger" : key === "h" ? "taller" : "longer";
  return `${B} is ${ratio}× ${adj} than ${S}`;
}

export function diffSentence(lang: Lang, key: Key, big: Subject, small: Subject, diff: string, sphereMix: boolean) {
  const B = nameOf(big, lang), S = nameOf(small, lang);
  if (lang === "ar") {
    const what = key === "d" ? "قطر" : sphereMix ? "حجم" : key === "h" ? "ارتفاع" : "طول";
    return `يزيد ${what} ${B} على ${S} بمقدار ${diff}`;
  }
  const adj = key === "d" ? "wider" : sphereMix ? "bigger" : key === "h" ? "taller" : "longer";
  return `${B} is ${diff} ${adj} than ${S}`;
}
