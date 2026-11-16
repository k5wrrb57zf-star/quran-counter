import type { DiffChoice, Difficulty, Key, Round, Subject } from "./types";
import { pick, type Rng } from "./rng";
import raw from "../data/subjects.json";

export const SUBJECTS = raw as Subject[];
export const CATEGORIES = [
  "pop", "anime", "animals", "prehistoric", "vehicles", "giants",
  "landmarks", "nature", "space", "rocks", "sports", "people", "everyday",
] as const;

const LENGTH_CATS = new Set(["vehicles", "giants", "prehistoric"]);

/** value of a subject along a comparison key; diameters count as both height and length */
export function valueOf(s: Subject, key: Key): number | undefined {
  if (key === "d") return s.dims.d;
  return s.dims[key] ?? s.dims.d;
}

/** Which dimension two subjects can be compared on (never height vs length). */
export function compareKey(a: Subject, b: Subject): Key | null {
  const A = a.dims, B = b.dims;
  const both = (k: "h" | "l") => A[k] != null && B[k] != null;
  if (both("h") && both("l")) return LENGTH_CATS.has(a.cat) || LENGTH_CATS.has(b.cat) ? "l" : "h";
  if (both("h")) return "h";
  if (both("l")) return "l";
  if (A.d != null && B.d != null) return "d";
  if (A.d != null) return B.h != null ? "h" : B.l != null ? "l" : null;
  if (B.d != null) return A.h != null ? "h" : A.l != null ? "l" : null;
  return null;
}

export function ratioOf(a: Subject, b: Subject, key: Key) {
  const va = valueOf(a, key)!, vb = valueOf(b, key)!;
  return Math.max(va, vb) / Math.min(va, vb);
}

function fitsDifficulty(a: Subject, b: Subject, R: number, d: Difficulty): boolean {
  const cross = a.cat !== b.cat;
  switch (d) {
    case "easy":
      return R >= 1.3 && R <= 6 && a.tier === 1 && b.tier === 1 && a.conf !== "estimate" && b.conf !== "estimate";
    case "medium":
      // a wider range is fine when at least one side is very familiar
      return Math.min(a.tier, b.tier) === 1 ? R >= 1.2 && R <= 60 : R >= 1.25 && R <= 25;
    case "hard":
      return (R >= 1.06 && R <= 1.35 && cross) || (R >= 40 && R <= 40000);
  }
}

const SPAN: Record<Difficulty, number> = { easy: 1.5, medium: 2.1, hard: 2.8 };

export interface GenOptions {
  difficulty: Difficulty;
  category: string; // "all" or a category id
  rng: Rng;
  avoidPairs?: Set<string>;
  avoidSubjects?: Set<string>;
  preferCross?: boolean;
}

export const pairKey = (a: Subject, b: Subject) => [a.id, b.id].sort().join("|");

export function makeRound(opts: GenOptions): Round {
  const { difficulty, category, rng } = opts;
  const filtered = category === "all" ? SUBJECTS : SUBJECTS.filter((s) => s.cat === category);
  const inCat = filtered.length >= 2 ? filtered : SUBJECTS;
  const attempts: Array<{ strictCat: boolean; strictDiff: boolean; strictAvoid: boolean }> = [
    { strictCat: true, strictDiff: true, strictAvoid: true },
    { strictCat: true, strictDiff: true, strictAvoid: false },
    { strictCat: true, strictDiff: false, strictAvoid: false },
    { strictCat: false, strictDiff: true, strictAvoid: false },
    { strictCat: false, strictDiff: false, strictAvoid: false },
  ];
  for (const st of attempts) {
    const poolA = st.strictCat ? inCat : SUBJECTS;
    for (let i = 0; i < 4000; i++) {
      // reference: lean towards familiar subjects
      let a = pick(poolA, rng);
      if (rng() < 0.6) {
        const fam = poolA.filter((s) => s.tier === 1);
        if (fam.length) a = pick(fam, rng);
      }
      let poolB = st.strictCat ? inCat : SUBJECTS;
      if (category !== "all" && !st.strictCat) poolB = SUBJECTS; // one may come from outside
      const wantCross = category === "all" && (opts.preferCross ?? true) && rng() < 0.72;
      const b = pick(poolB, rng);
      if (a.id === b.id) continue;
      if (wantCross && a.cat === b.cat && i < 3000) continue;
      if (category !== "all" && a.cat !== category && b.cat !== category) continue;
      const key = compareKey(a, b);
      if (!key) continue;
      const R = ratioOf(a, b, key);
      if (R < 1.04 || R > 40000) continue;
      if (st.strictDiff && !fitsDifficulty(a, b, R, difficulty)) continue;
      if (st.strictAvoid) {
        if (opts.avoidPairs?.has(pairKey(a, b))) continue;
        if (opts.avoidSubjects?.has(a.id) || opts.avoidSubjects?.has(b.id)) continue;
      }
      // the more familiar subject is the fixed reference
      let [ref, ch] = [a, b];
      if (b.tier < a.tier || (b.tier === a.tier && rng() < 0.5)) [ref, ch] = [b, a];
      const answerPos = 0.2 + rng() * 0.6;
      let startPos = answerPos;
      while (Math.abs(startPos - answerPos) < 0.2) startPos = 0.06 + rng() * 0.88;
      return {
        a: ref, b: ch, key,
        va: valueOf(ref, key)!, vb: valueOf(ch, key)!,
        difficulty, span: SPAN[difficulty], answerPos, startPos,
      };
    }
  }
  throw new Error("could not generate a round");
}

export function difficultyFor(choice: DiffChoice, index: number, total: number | null, rng: Rng): Difficulty {
  if (choice !== "mixed") return choice;
  if (total == null) {
    // endless: ramps up over time
    const t = Math.min(1, index / 14);
    const r = rng();
    return r < 0.45 * (1 - t) ? "easy" : r < 0.85 - 0.25 * t ? "medium" : "hard";
  }
  const f = index / Math.max(1, total - 1);
  return f < 0.2 ? "easy" : f < 0.6 ? "medium" : "hard";
}

/** slider position -> k (guessed size / true size) */
export const kFromPos = (r: Round, p: number) => Math.pow(10, (p - r.answerPos) * r.span);
