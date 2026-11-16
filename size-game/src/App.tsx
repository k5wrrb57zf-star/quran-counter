import { useCallback, useEffect, useState } from "react";
import { Home } from "./components/Home";
import { Game, type RoundResult, type SessionConfig } from "./components/Game";
import { Sources, Stats, Summary } from "./components/Screens";
import { load, save, type SavedState } from "./lib/storage";
import { pairKey } from "./lib/pairs";
import { STREAK_THRESHOLD } from "./lib/score";
import { t } from "./lib/i18n";
import type { Player } from "./lib/types";

type Screen =
  | { name: "home" }
  | { name: "play"; config: SessionConfig; id: number }
  | { name: "summary"; config: SessionConfig; results: RoundResult[]; players?: Player[]; isBest: boolean }
  | { name: "stats" }
  | { name: "sources" };

export default function App() {
  const [saved, setSaved] = useState<SavedState>(load);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const lang = saved.lang;

  const update = useCallback((fn: (s: SavedState) => SavedState) => {
    setSaved((s) => {
      const n = fn(s);
      save(n);
      return n;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = lang === "ar" ? "مِقياس — لعبة تخمين الأحجام" : "Miqyas — the size guessing game";
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    if (saved.theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", saved.theme);
  }, [saved.theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen.name]);

  const start = (config: SessionConfig) => setScreen({ name: "play", config, id: Date.now() });

  const onRoundDone = (r: RoundResult) => {
    const isParty = r.guesses.length > 1;
    update((s) => {
      const recentPairs = [...s.recentPairs.filter((p) => p !== pairKey(r.round.a, r.round.b)), pairKey(r.round.a, r.round.b)].slice(-220);
      if (isParty) return { ...s, recentPairs };
      const g = r.guesses[0];
      const cur = g.accuracy >= STREAK_THRESHOLD ? s.curStreak + 1 : 0;
      return {
        ...s, recentPairs,
        rounds: s.rounds + 1,
        totalScore: s.totalScore + g.score,
        sumAccuracy: s.sumAccuracy + g.accuracy,
        curStreak: cur,
        bestStreak: Math.max(s.bestStreak, cur),
      };
    });
  };

  const onFinish = (config: SessionConfig, results: RoundResult[], players?: Player[]) => {
    if (!results.length) return setScreen({ name: "home" });
    const score = results.reduce((s, r) => s + r.guesses[0].score, 0);
    const accuracy = results.reduce((s, r) => s + r.guesses[0].accuracy, 0) / results.length;
    let isBest = false;
    if (config.mode !== "party") {
      const comparable = config.mode === "classic";
      isBest = comparable && saved.games.every((g) => g.score < score) && score > 0;
      update((s) => {
        const d = new Date();
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const modeLabel =
          config.mode === "daily" ? t(s.lang, "daily") : config.mode === "endless" ? `${t(s.lang, "endless")} (${results.length})` : `${t(s.lang, config.diff)}`;
        const games = comparable || config.mode === "daily"
          ? [...s.games, { score, max: results.length * 1000, rounds: results.length, accuracy, mode: modeLabel, date }]
              .sort((a, b) => b.score - a.score)
              .slice(0, 10)
          : s.games;
        const daily = config.mode === "daily" && config.seed ? { ...s.daily, [config.seed]: { score, accuracy } } : s.daily;
        return { ...s, games, daily };
      });
    }
    setScreen({ name: "summary", config, results, players, isBest });
  };

  const toggleTheme = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    update((s) => ({ ...s, theme: dark ? "light" : "dark" }));
  };

  return (
    <div className={"app screen-" + screen.name}>
      {screen.name !== "play" && (
        <div className="top-tools">
          <button className="pill" onClick={() => update((s) => ({ ...s, lang: s.lang === "ar" ? "en" : "ar" }))}>
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <button className="pill icon" onClick={toggleTheme} aria-label={t(lang, "theme")}>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
          </button>
        </div>
      )}
      {screen.name === "home" && (
        <Home
          lang={lang}
          saved={saved}
          onStart={start}
          onOpen={(n) => setScreen(n === "stats" ? { name: "stats" } : { name: "sources" })}
          onPartyNames={(names) => update((s) => ({ ...s, partyNames: names }))}
        />
      )}
      {screen.name === "play" && (
        <Game
          key={screen.id}
          config={screen.config}
          lang={lang}
          recentPairs={saved.recentPairs}
          onRoundDone={onRoundDone}
          onFinish={(r, p) => onFinish(screen.config, r, p)}
          onQuit={() => setScreen({ name: "home" })}
        />
      )}
      {screen.name === "summary" && (
        <Summary
          lang={lang}
          results={screen.results}
          players={screen.players}
          isBest={screen.isBest}
          daily={screen.config.mode === "daily"}
          onHome={() => setScreen({ name: "home" })}
          onAgain={() => start({
            ...screen.config,
            players: screen.config.players?.map((p) => ({ ...p, total: 0 })),
          })}
        />
      )}
      {screen.name === "stats" && (
        <Stats
          lang={lang}
          saved={saved}
          onBack={() => setScreen({ name: "home" })}
          onReset={() => update((s) => ({ ...s, rounds: 0, totalScore: 0, sumAccuracy: 0, bestStreak: 0, curStreak: 0, games: [], daily: {} }))}
        />
      )}
      {screen.name === "sources" && <Sources lang={lang} onBack={() => setScreen({ name: "home" })} />}
    </div>
  );
}
