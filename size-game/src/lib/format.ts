import type { Lang } from "./types";

const UNITS = {
  mm: { ar: "مم", en: "mm" },
  cm: { ar: "سم", en: "cm" },
  m: { ar: "م", en: "m" },
  km: { ar: "كم", en: "km" },
};

function num(v: number, digits: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

/** Human friendly length, e.g. 1.55 m, 22 cm, 8,849 m, 139,820 km, 1.06 billion km */
export function fmtLen(m: number, lang: Lang): string {
  const u = (k: keyof typeof UNITS) => UNITS[k][lang];
  if (m < 0.01) return `${num(m * 1000, m * 1000 < 10 ? 1 : 0)} ${u("mm")}`;
  if (m < 1) return `${num(m * 100, m * 100 < 10 ? 2 : 1)} ${u("cm")}`;
  if (m < 10) return `${num(m, 2)} ${u("m")}`;
  if (m < 10000) return `${num(m, m < 100 ? 1 : 0)} ${u("m")}`;
  const km = m / 1000;
  if (km < 1e7) return `${num(km, km < 100 ? 1 : 0)} ${u("km")}`;
  const bil = km / 1e9;
  if (bil >= 1) return lang === "ar" ? `${num(bil, 2)} مليار ${u("km")}` : `${num(bil, 2)} billion ${u("km")}`;
  const mil = km / 1e6;
  return lang === "ar" ? `${num(mil, 1)} مليون ${u("km")}` : `${num(mil, 1)} million ${u("km")}`;
}

export function fmtRatio(r: number): string {
  if (r < 10) return num(r, 2);
  if (r < 100) return num(r, 1);
  return num(r, 0);
}

export const fmtPct = (v: number, digits = 0) => `${num(v, digits)}%`;
export const fmtInt = (v: number) => num(Math.round(v), 0);
