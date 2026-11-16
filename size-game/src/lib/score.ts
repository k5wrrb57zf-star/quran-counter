import type { Guess } from "./types";

/**
 * Score a guess. k = guessed size / true size.
 * Error is measured on a log scale so that guessing 2× too big and 2× too small
 * are equally wrong. 1000 points for a perfect guess, ~900 within 7 %, ~550 at 25 %.
 */
export function scoreGuess(k: number): Guess {
  const e = Math.abs(Math.log2(k));
  const score = Math.round(1000 * Math.exp(-Math.pow(e / 0.45, 1.5)));
  return { k, score, accuracy: Math.min(k, 1 / k) };
}

export const signedErrorPct = (k: number) => (k - 1) * 100;

export type Rating = "perfect" | "excellent" | "great" | "good" | "off" | "wayoff";
export function rating(acc: number): Rating {
  if (acc >= 0.97) return "perfect";
  if (acc >= 0.9) return "excellent";
  if (acc >= 0.8) return "great";
  if (acc >= 0.65) return "good";
  if (acc >= 0.4) return "off";
  return "wayoff";
}

export const STREAK_THRESHOLD = 0.85;
