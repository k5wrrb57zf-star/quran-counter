import { useMemo, useState } from "react";
import type { Lang, Player } from "../lib/types";
import { CAT_LABEL, CONF_LABEL, RATING_LABEL, nameOf, t } from "../lib/i18n";
import { fmtInt, fmtLen, fmtPct } from "../lib/format";
import { rating } from "../lib/score";
import { SUBJECTS } from "../lib/pairs";
import type { SavedState } from "../lib/storage";
import type { RoundResult } from "./Game";

function Back({ lang, onBack, title }: { lang: Lang; onBack: () => void; title: string }) {
  return (
    <header className="page-head">
      <button className="icon-btn" onClick={onBack} aria-label={t(lang, "home")}>
        <svg viewBox="0 0 24 24" width="22" height="22" className="flip-rtl"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <h1>{title}</h1>
    </header>
  );
}

export function Summary({ lang, results, players, isBest, daily, onHome, onAgain }: {
  lang: Lang; results: RoundResult[]; players?: Player[]; isBest: boolean; daily: boolean;
  onHome: () => void; onAgain: () => void;
}) {
  const total = results.reduce((s, r) => s + r.guesses[0].score, 0);
  const acc = results.length ? results.reduce((s, r) => s + r.guesses[0].accuracy, 0) / results.length : 0;
  const party = players && players.length > 1;
  const ranked = party ? [...players!].sort((a, b) => b.total - a.total) : [];
  return (
    <main className="page summary">
      <div className="summary-hero">
        {party ? (
          <>
            <div className="summary-label">{t(lang, "winner")}</div>
            <div className="summary-big" style={{ color: ranked[0].color }}>{ranked[0].name}</div>
            <div className="party-final">
              {ranked.map((p, i) => (
                <div key={p.name} className="party-row" style={{ ["--pc" as string]: p.color }}>
                  <span className="rank">{i + 1}</span><span className="dot" /><span className="pname">{p.name}</span>
                  <span className="ppts" dir="ltr">{fmtInt(p.total)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="summary-label">{daily ? t(lang, "dailyResult") : t(lang, "totalScore")}</div>
            <div className="summary-big" dir="ltr">{fmtInt(total)}<small> / {fmtInt(results.length * 1000)}</small></div>
            <div className="summary-sub">{t(lang, "avgAccuracy")}: <b dir="ltr">{fmtPct(acc * 100)}</b></div>
            {isBest && <div className="summary-best">{t(lang, "newBest")}</div>}
            {daily && <div className="summary-sub">{t(lang, "comeBack")}</div>}
          </>
        )}
      </div>
      {!party && (
        <ol className="summary-list">
          {results.map((r, i) => {
            const g = r.guesses[0];
            return (
              <li key={i} className={"summary-item rating-" + rating(g.accuracy)}>
                <span className="pair" dir="ltr">
                  <img src={r.round.a.cut} alt="" />
                  <img src={r.round.b.cut} alt="" />
                </span>
                <span className="names">{nameOf(r.round.b, lang)} <small>↔ {nameOf(r.round.a, lang)}</small></span>
                <span className="acc">{RATING_LABEL[rating(g.accuracy)][lang]} · <span dir="ltr">{fmtPct(g.accuracy * 100)}</span></span>
                <span className="pts" dir="ltr">+{fmtInt(g.score)}</span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="summary-actions">
        <button className="btn btn-ghost btn-xl" onClick={onHome}>{t(lang, "home")}</button>
        {!daily && <button className="btn btn-primary btn-xl" onClick={onAgain}>{t(lang, "playAgain")}</button>}
      </div>
    </main>
  );
}

export function Stats({ lang, saved, onBack, onReset }: { lang: Lang; saved: SavedState; onBack: () => void; onReset: () => void }) {
  const avg = saved.rounds ? saved.sumAccuracy / saved.rounds : 0;
  const best = saved.games.reduce((m, g) => Math.max(m, g.score), 0);
  const tiles: Array<[string, string]> = [
    [t(lang, "totalScore"), fmtInt(saved.totalScore)],
    [t(lang, "roundsPlayed"), fmtInt(saved.rounds)],
    [t(lang, "avgAccuracy"), fmtPct(avg * 100)],
    [t(lang, "bestStreak"), fmtInt(saved.bestStreak)],
    [t(lang, "streak"), fmtInt(saved.curStreak)],
    [t(lang, "personalBest"), fmtInt(best)],
  ];
  return (
    <main className="page">
      <Back lang={lang} onBack={onBack} title={t(lang, "stats")} />
      <div className="tiles">
        {tiles.map(([k, v]) => (
          <div className="tile" key={k}><span className="tile-v" dir="ltr">{v}</span><span className="tile-k">{k}</span></div>
        ))}
      </div>
      <h2 className="section-title">{t(lang, "leaderboard")}</h2>
      {saved.games.length === 0 ? (
        <p className="muted">{t(lang, "noGames")}</p>
      ) : (
        <ol className="board">
          {saved.games.map((g, i) => (
            <li key={i}>
              <span className="rank">{i + 1}</span>
              <span className="b-score" dir="ltr">{fmtInt(g.score)}</span>
              <span className="b-meta">{g.mode} · <span dir="ltr">{fmtPct(g.accuracy * 100)}</span></span>
              <span className="b-date" dir="ltr">{g.date}</span>
            </li>
          ))}
        </ol>
      )}
      <button className="btn btn-ghost danger" onClick={() => confirm(t(lang, "confirmReset")) && onReset()}>{t(lang, "resetStats")}</button>
    </main>
  );
}

export function Sources({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return SUBJECTS.filter((x) => !s || x.en.toLowerCase().includes(s) || x.ar.includes(s));
  }, [q]);
  return (
    <main className="page sources">
      <Back lang={lang} onBack={onBack} title={t(lang, "sources")} />
      <p className="muted about">{t(lang, "aboutData")}</p>
      <input className="search" placeholder={t(lang, "searchSubjects")} value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="src-list">
        {list.map((s) => {
          const d = s.dims;
          const parts = [
            d.h != null && `${t(lang, "heightOf")} ${fmtLen(d.h, lang)}`,
            d.l != null && `${t(lang, "lengthOf")} ${fmtLen(d.l, lang)}`,
            d.d != null && `${t(lang, "diameterOf")} ${fmtLen(d.d, lang)}`,
          ].filter(Boolean);
          return (
            <li key={s.id} className="src-item">
              <img src={s.cut} alt="" loading="lazy" />
              <div>
                <div className="src-name">{nameOf(s, lang)} <small>{CAT_LABEL[s.cat][lang]}</small></div>
                <div className="src-dims">{parts.join(" · ")} <span className={"badge badge-" + s.conf}>{CONF_LABEL[s.conf][lang]}</span></div>
                <div className="src-ref" dir="ltr">{s.src}</div>
                <div className="src-credit" dir="ltr">
                  {t(lang, "imageCredit")}: <a href={s.credit.page} target="_blank" rel="noreferrer">{s.credit.file}</a>
                  {s.credit.artist && <> — {s.credit.artist}</>}
                  {s.credit.license && <> · {s.credit.license}</>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
