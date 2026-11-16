import { useMemo, useState } from "react";
import type { DiffChoice, Lang, Player } from "../lib/types";
import { CAT_LABEL, t } from "../lib/i18n";
import { CATEGORIES, SUBJECTS } from "../lib/pairs";
import { fmtInt } from "../lib/format";
import type { SavedState } from "../lib/storage";
import { todayKey } from "../lib/rng";
import type { SessionConfig } from "./Game";

export const PLAYER_COLORS = ["#E4572E", "#2E86AB", "#7A9E4B", "#B05FC9"];

interface Props {
  lang: Lang;
  saved: SavedState;
  onStart: (c: SessionConfig) => void;
  onOpen: (screen: "stats" | "sources") => void;
  onPartyNames: (names: string[]) => void;
}



export function Home({ lang, saved, onStart, onOpen, onPartyNames }: Props) {
  const [diff, setDiff] = useState<DiffChoice>("mixed");
  const [cat, setCat] = useState("all");
  const [partyOpen, setPartyOpen] = useState(false);
  const [names, setNames] = useState<string[]>(
    saved.partyNames.length >= 2 ? saved.partyNames : lang === "ar" ? ["لاعب 1", "لاعب 2"] : ["Player 1", "Player 2"],
  );
  const today = todayKey();
  const daily = saved.daily[today];
  const best = saved.games.reduce((m, g) => Math.max(m, g.score), 0);
  // three familiar subjects drawn at their true relative scale
  const hero = useMemo(() => {
    const pool = SUBJECTS.filter((x) => x.tier === 1 && x.dims.h != null && !x.dims.l);
    for (let i = 0; i < 400; i++) {
      const pickN = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
      if (pickN.length < 3) break;
      const hs = pickN.map((x) => x.h);
      const r = Math.max(...hs) / Math.min(...hs);
      if (r > 1.6 && r < 4.5 && new Set(pickN.map((x) => x.cat)).size === 3) {
        const max = Math.max(...hs);
        return pickN.sort((x, y) => x.h - y.h).map((x) => ({ s: x, rel: x.h / max }));
      }
    }
    return pool.slice(0, 3).map((x) => ({ s: x, rel: 0.7 }));
  }, []);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of SUBJECTS) c[s.cat] = (c[s.cat] ?? 0) + 1;
    return c;
  }, []);

  const startParty = () => {
    const clean = names.map((n) => n.trim()).filter(Boolean).slice(0, 4);
    if (clean.length < 2) return;
    onPartyNames(clean);
    const players: Player[] = clean.map((name, i) => ({ name, color: PLAYER_COLORS[i], total: 0 }));
    onStart({ mode: "party", diff, category: cat, total: 8, players });
  };

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-art" aria-hidden dir="ltr">
          {hero.map(({ s, rel }, i) => (
            <img key={s.id} src={s.cut} alt="" className="hero-img" style={{ height: `${rel * 100}%`, animationDelay: `${0.08 * i}s` }} />
          ))}
          <div className="hero-ground" />
        </div>
        <div className="hero-text">
          <h1 className="brand">{t(lang, "appName")}</h1>
          <p className="tagline">{t(lang, "tagline")}</p>
        </div>
      </section>

      <section className="card play-card">
        <div className="field">
          <div className="field-label">{t(lang, "difficulty")}</div>
          <div className="segmented" role="radiogroup">
            {(["mixed", "easy", "medium", "hard"] as const).map((d) => (
              <button key={d} role="radio" aria-checked={diff === d} className={diff === d ? "is-on" : ""} onClick={() => setDiff(d)}>
                {t(lang, d)}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <div className="field-label">{t(lang, "category")}</div>
          <div className="chips">
            <button className={"chip-btn" + (cat === "all" ? " is-on" : "")} onClick={() => setCat("all")}>
              {t(lang, "all")}
            </button>
            {CATEGORIES.filter((c) => (counts[c] ?? 0) >= 5).map((c) => (
              <button key={c} className={"chip-btn" + (cat === c ? " is-on" : "")} onClick={() => setCat(c)}>
                {CAT_LABEL[c][lang]} <small dir="ltr">{counts[c]}</small>
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-xl play-btn" onClick={() => onStart({ mode: "classic", diff, category: cat, total: 10 })}>
          {t(lang, "play")} <span className="sub">· {t(lang, "rounds10")}</span>
        </button>
      </section>

      <section className="mode-grid">
        <button className="card mode" onClick={() => onStart({ mode: "daily", diff: "mixed", category: "all", total: 5, seed: today })} disabled={!!daily}>
          <span className="mode-icon" aria-hidden>
            <svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </span>
          <span className="mode-title">{t(lang, "daily")}</span>
          <span className="mode-sub">
            {daily ? `${t(lang, "dailyDone")} · ${fmtInt(daily.score)} ${t(lang, "points")}` : t(lang, "dailySub")}
          </span>
        </button>
        <button className="card mode" onClick={() => onStart({ mode: "endless", diff, category: cat, total: null })}>
          <span className="mode-icon" aria-hidden>
            <svg viewBox="0 0 24 24"><path d="M7 8.5c-2 0-3.5 1.6-3.5 3.5S5 15.5 7 15.5c3 0 7-7 10-7 2 0 3.5 1.6 3.5 3.5S19 15.5 17 15.5c-3 0-7-7-10-7z" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
          </span>
          <span className="mode-title">{t(lang, "endless")}</span>
          <span className="mode-sub">{t(lang, "endlessSub")}</span>
        </button>
        <button className="card mode" onClick={() => setPartyOpen((o) => !o)} aria-expanded={partyOpen}>
          <span className="mode-icon" aria-hidden>
            <svg viewBox="0 0 24 24"><circle cx="8.5" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="16.5" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M3 19c.6-3 2.8-4.6 5.5-4.6S13.4 16 14 19M14.5 15.2c.6-.4 1.3-.6 2-.6 2 0 3.6 1.3 4 4.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </span>
          <span className="mode-title">{t(lang, "party")}</span>
          <span className="mode-sub">{t(lang, "partySub")}</span>
        </button>
      </section>

      {partyOpen && (
        <section className="card party-setup">
          <div className="field-label">{t(lang, "players")}</div>
          {names.map((n, i) => (
            <div className="player-input" key={i} style={{ ["--pc" as string]: PLAYER_COLORS[i] }}>
              <i />
              <input value={n} maxLength={14} onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))} />
              {names.length > 2 && (
                <button className="icon-btn" onClick={() => setNames(names.filter((_, j) => j !== i))} aria-label="remove">×</button>
              )}
            </div>
          ))}
          <div className="party-actions">
            {names.length < 4 && (
              <button className="btn btn-ghost" onClick={() => setNames([...names, (lang === "ar" ? "لاعب " : "Player ") + (names.length + 1)])}>
                + {t(lang, "addPlayer")}
              </button>
            )}
            <button className="btn btn-primary" onClick={startParty}>{t(lang, "start")}</button>
          </div>
        </section>
      )}

      <section className="home-foot">
        <button className="link-card" onClick={() => onOpen("stats")}>
          <span>{t(lang, "stats")}</span>
          {best > 0 && <small dir="ltr">{t(lang, "best")}: {fmtInt(best)}</small>}
        </button>
        <button className="link-card" onClick={() => onOpen("sources")}>
          <span>{t(lang, "sources")}</span>
          <small dir="ltr">{SUBJECTS.length}</small>
        </button>
      </section>
    </main>
  );
}
