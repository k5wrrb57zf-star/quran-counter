const KEY = "miqyas.v1";

export interface GameRecord {
  score: number;
  max: number;
  rounds: number;
  accuracy: number; // average 0..1
  mode: string;
  date: string;
}

export interface SavedState {
  rounds: number;
  totalScore: number;
  sumAccuracy: number;
  bestStreak: number;
  curStreak: number;
  games: GameRecord[]; // top results (leaderboard)
  daily: Record<string, { score: number; accuracy: number }>;
  recentPairs: string[];
  theme: "light" | "dark" | "auto";
  lang: "ar" | "en";
  partyNames: string[];
}

const DEFAULTS: SavedState = {
  rounds: 0, totalScore: 0, sumAccuracy: 0, bestStreak: 0, curStreak: 0,
  games: [], daily: {}, recentPairs: [], theme: "auto", lang: "ar", partyNames: [],
};

export function load(): SavedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(s: SavedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable (private mode) – game still works */
  }
}
