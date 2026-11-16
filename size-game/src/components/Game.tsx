import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DiffChoice, Guess, Lang, Player, Round, Subject } from "../lib/types";
import { difficultyFor, kFromPos, makeRound, pairKey } from "../lib/pairs";
import { scoreGuess } from "../lib/score";
import { nameOf, question, t } from "../lib/i18n";
import { fmtInt } from "../lib/format";
import { hashString, mulberry32, type Rng } from "../lib/rng";
import { Stage, type Ghost, type StageHandle } from "./Stage";
import { SizeSlider } from "./SizeSlider";
import { Reveal } from "./Reveal";

export interface SessionConfig {
  mode: "classic" | "endless" | "daily" | "party";
  diff: DiffChoice;
  category: string;
  total: number | null;
  seed?: string; // daily
  players?: Player[];
}

export interface RoundResult {
  round: Round;
  guesses: Guess[];
}

interface Props {
  config: SessionConfig;
  lang: Lang;
  recentPairs: string[];
  onRoundDone: (r: RoundResult) => void;
  onFinish: (results: RoundResult[], players?: Player[]) => void;
  onQuit: () => void;
}

function preload(r: Round | undefined) {
  if (!r) return;
  for (const src of [r.a.cut, r.b.cut, r.a.ref, r.b.ref]) {
    const im = new Image();
    im.decoding = "async";
    im.src = src;
  }
}

export function Game({ config, lang, recentPairs, onRoundDone, onFinish, onQuit }: Props) {
  const rng = useMemo<Rng>(
    () => (config.seed ? mulberry32(hashString("miqyas|" + config.seed)) : Math.random),
    [config.seed],
  );
  const avoidPairs = useRef(new Set(config.seed ? [] : recentPairs));
  const recentSubjects = useRef<string[]>([]);

  const gen = useCallback(
    (index: number): Round => {
      const difficulty = config.seed
        ? (["easy", "medium", "medium", "hard", "hard"] as const)[index % 5]
        : difficultyFor(config.diff, index, config.total, rng);
      const r = makeRound({
        difficulty,
        category: config.category,
        rng,
        avoidPairs: avoidPairs.current,
        avoidSubjects: new Set(recentSubjects.current),
      });
      avoidPairs.current.add(pairKey(r.a, r.b));
      recentSubjects.current = [...recentSubjects.current, r.a.id, r.b.id].slice(-8);
      return r;
    },
    [config, rng],
  );

  const [rounds, setRounds] = useState<Round[]>(() => {
    const n = config.total ?? 2;
    const out: Round[] = [];
    for (let i = 0; i < n; i++) out.push(gen(i));
    return out;
  });
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"guess" | "handoff" | "revealed">("guess");
  const [turn, setTurn] = useState(0);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [players, setPlayers] = useState<Player[] | undefined>(config.players);
  const [resetN, setResetN] = useState(0);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [photo, setPhoto] = useState<Subject | null>(null);
  const stage = useRef<StageHandle>(null);
  const posRef = useRef(0);

  const round = rounds[index];
  const party = !!players && players.length > 1;
  const total = config.total;
  const runScore = results.reduce((s, r) => s + r.guesses[0].score, 0) + (phase === "revealed" && !party ? guesses[0]?.score ?? 0 : 0);

  useEffect(() => {
    preload(rounds[index + 1]);
  }, [rounds, index]);

  const onSlide = useCallback(
    (p: number) => {
      posRef.current = p;
      stage.current?.setK(kFromPos(round, p));
    },
    [round],
  );

  const lockIn = async () => {
    const g = scoreGuess(kFromPos(round, posRef.current));
    const all = [...guesses, g];
    setGuesses(all);
    if (party && all.length < players!.length) {
      setTurn(all.length);
      setPhase("handoff");
      return;
    }
    // reveal
    const gh: Ghost[] = all.map((x, i) => ({
      k: x.k,
      color: party ? players![i].color : "var(--accent)",
      label: party ? players![i].name : t(lang, "yourGuess"),
    }));
    setGhosts(gh);
    setPhase("revealed");
    if (party) {
      setPlayers(players!.map((p, i) => ({ ...p, total: p.total + all[i].score })));
    }
    const res = { round, guesses: all };
    onRoundDone(res);
    setResults((r) => [...r, res]);
    requestAnimationFrame(() => stage.current?.animateTo(1, 1100));
  };

  const next = () => {
    const ni = index + 1;
    if (total != null && ni >= total) {
      onFinish(results, players);
      return;
    }
    if (total == null && ni + 1 >= rounds.length) setRounds((r) => [...r, gen(r.length)]);
    setIndex(ni);
    setGuesses([]);
    setGhosts([]);
    setTurn(0);
    setPhase("guess");
  };

  // keyboard: Enter reveals / advances
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (phase === "guess") lockIn();
      else if (phase === "revealed") next();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const isLast = total != null && index + 1 >= total;
  const counter = total != null ? `${index + 1} / ${total}` : `${index + 1}`;

  return (
    <div className={"game phase-" + phase}>
      <header className="game-bar">
        <button className="icon-btn" onClick={() => (total == null && results.length ? onFinish(results, players) : onQuit())} aria-label={t(lang, "home")}>
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <div className="game-progress">
          <span className="label">{t(lang, "round")}</span>
          <span className="value" dir="ltr">{counter}</span>
          {total != null && (
            <div className="progress-bar"><i style={{ width: `${((index + (phase === "revealed" ? 1 : 0)) / total) * 100}%` }} /></div>
          )}
        </div>
        <div className="game-score">
          {party ? (
            <div className="party-chips">
              {players!.map((p, i) => (
                <span key={p.name} className={"chip" + (phase !== "revealed" && i === turn ? " is-turn" : "")} style={{ ["--pc" as string]: p.color }}>
                  <i />{p.name} <b dir="ltr">{fmtInt(p.total)}</b>
                </span>
              ))}
            </div>
          ) : (
            <>
              <span className="label">{t(lang, "score")}</span>
              <span className="value" dir="ltr">{fmtInt(runScore)}</span>
            </>
          )}
        </div>
      </header>

      <div className="game-main">
        <section className="game-stage-wrap">
          <h1 className="game-question" key={round.a.id + round.b.id}>
            {party && phase !== "revealed" && (
              <span className="turn-tag" style={{ ["--pc" as string]: players![turn].color }}>{players![turn].name}</span>
            )}
            {question(lang, round.key, round.a, round.b)}
          </h1>
          <div className="subject-cards" dir="ltr">
            {[round.a, round.b].map((s, i) => (
              <button key={s.id} className={"subject-card " + (i ? "is-b" : "is-a")} onClick={() => setPhoto(s)}>
                <img src={s.ref} alt="" decoding="async" />
                <span dir={lang === "ar" ? "rtl" : "ltr"}>
                  <small>{i ? t(lang, "challenge") : t(lang, "reference")}</small>
                  {nameOf(s, lang)}
                </span>
              </button>
            ))}
          </div>
          <div className="stage-box">
          <div className="diff-tag" data-d={round.difficulty}>{t(lang, round.difficulty)}</div>
          <Stage
            ref={stage}
            round={round}
            lang={lang}
            initialK={kFromPos(round, round.startPos)}
            ghosts={ghosts}
            revealed={phase === "revealed"}
          />
          {phase === "revealed" && !party && <div className="stage-legend"><i />{t(lang, "tapToCompare")}</div>}
          </div>
        </section>

        {phase === "revealed" && (
          <aside className="game-panel">
            <Reveal
              round={round}
              guesses={guesses}
              players={players}
              lang={lang}
              onNext={next}
              nextLabel={isLast ? t(lang, "finish") : t(lang, "next")}
            />
          </aside>
        )}
      </div>

      {phase !== "revealed" && (
        <footer className="game-dock">
          <div className="dock-hint">{t(lang, "dragHint")}</div>
          <div className="dock-row">
            <button className="btn btn-ghost dock-reset" onClick={() => setResetN((n) => n + 1)}>
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>{t(lang, "reset")}</span>
            </button>
            <SizeSlider
              start={round.startPos}
              resetKey={`${index}-${turn}-${resetN}`}
              lang={lang}
              disabled={phase !== "guess"}
              onChange={onSlide}
            />
            <button className="btn btn-primary dock-reveal" onClick={lockIn} disabled={phase !== "guess"}>
              {party && guesses.length < players!.length - 1 ? t(lang, "lockIn") : t(lang, "reveal")}
            </button>
          </div>
        </footer>
      )}

      {photo && (
        <div className="lightbox" role="dialog" onClick={() => setPhoto(null)}>
          <figure>
            <img src={photo.ref} alt={nameOf(photo, lang)} />
            <figcaption>{nameOf(photo, lang)}</figcaption>
          </figure>
        </div>
      )}

      {phase === "handoff" && party && (
        <div className="handoff" role="dialog">
          <div className="handoff-card" style={{ ["--pc" as string]: players![turn].color }}>
            <div className="handoff-label">{t(lang, "passTo")}</div>
            <div className="handoff-name">{players![turn].name}</div>
            <p className="handoff-q">{question(lang, round.key, round.a, round.b)}</p>
            <button className="btn btn-primary btn-xl" onClick={() => setPhase("guess")}>{t(lang, "ready")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
