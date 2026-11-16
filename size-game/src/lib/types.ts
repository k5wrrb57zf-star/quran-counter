export type Conf = "official" | "measured" | "typical" | "estimate";
export type Key = "h" | "l" | "d";
export type Difficulty = "easy" | "medium" | "hard";
export type DiffChoice = Difficulty | "mixed";
export type Lang = "ar" | "en";

export interface Subject {
  id: string;
  cat: string;
  en: string;
  ar: string;
  conf: Conf;
  src: string;
  tier: number;
  note: string | null;
  noteAr: string | null;
  dims: { h?: number; l?: number; d?: number };
  /** world size (metres) of the full trimmed cut-out image */
  w: number;
  h: number;
  cut: string;
  ref: string;
  cw: number;
  ch: number;
  credit: { file: string; page: string; artist: string; license: string; nonfree: boolean };
}

export interface Round {
  a: Subject; // reference (fixed)
  b: Subject; // challenge (resizable)
  key: Key;
  va: number; // compared value of a (m)
  vb: number; // compared value of b (m)
  difficulty: Difficulty;
  /** slider: log10(k) = (p - answerPos) * span */
  span: number;
  answerPos: number;
  startPos: number;
}

export interface Guess {
  /** k = guessed size / true size of b (1 = perfect) */
  k: number;
  score: number;
  accuracy: number; // 0..1, min(k, 1/k)
}

export interface Player {
  name: string;
  color: string;
  total: number;
}
