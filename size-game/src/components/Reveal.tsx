import type { Guess, Lang, Player, Round, Subject } from "../lib/types";
import { CONF_LABEL, RATING_LABEL, comparisonSentence, diffSentence, dimLabel, nameOf, t } from "../lib/i18n";
import { fmtInt, fmtLen, fmtPct, fmtRatio } from "../lib/format";
import { rating, signedErrorPct } from "../lib/score";

function Row({ s, value, round, lang }: { s: Subject; value: number; round: Round; lang: Lang }) {
  const note = lang === "ar" ? s.noteAr : s.note;
  const flag = s.conf === "estimate" || s.conf === "typical";
  return (
    <div className="row">
      <img className="row-thumb" src={s.cut} alt="" />
      <div className="row-main">
        <div className="row-name">{nameOf(s, lang)}</div>
        <div className="row-meta">
          {dimLabel(lang, s, round.key)}
          {note ? ` · ${note}` : ""}
          {flag && <span className={"badge badge-" + s.conf}>{CONF_LABEL[s.conf][lang]}</span>}
        </div>
        <div className="row-src" dir="ltr">{s.src}</div>
      </div>
      <div className="row-value"><bdi>{fmtLen(value, lang)}</bdi></div>
    </div>
  );
}

interface Props {
  round: Round;
  guesses: Guess[];
  players?: Player[];
  lang: Lang;
  onNext: () => void;
  nextLabel: string;
}

export function Reveal({ round, guesses, players, lang, onNext, nextLabel }: Props) {
  const { a, b, va, vb, key } = round;
  const bBigger = vb >= va;
  const big = bBigger ? b : a, small = bBigger ? a : b;
  const R = Math.max(va, vb) / Math.min(va, vb);
  const sphereMix = key !== "d" && (a.dims.d != null || b.dims.d != null);
  const party = players && players.length > 1;
  const g0 = guesses[0];
  const err = g0 ? signedErrorPct(g0.k) : 0;

  return (
    <div className="reveal" role="region" aria-live="polite">
      {!party && g0 && (
        <div className={"match rating-" + rating(g0.accuracy)}>
          <div className="match-top">
            <span className="match-label">{t(lang, "match")}</span>
            <span className="match-pts"><bdi dir="ltr">+{fmtInt(g0.score)}</bdi> {t(lang, "points")}</span>
          </div>
          <div className="match-value"><bdi dir="ltr">{fmtPct(g0.accuracy * 100)}</bdi></div>
          <div className="match-bar"><i style={{ width: `${g0.accuracy * 100}%` }} /></div>
          <div className="match-sub">
            {RATING_LABEL[rating(g0.accuracy)][lang]}
            {Math.abs(err) >= 1 && (
              <> · {t(lang, "yourGuess")} {g0.k >= 1 ? t(lang, "biggerBy") : t(lang, "smallerBy")} <bdi dir="ltr">{fmtPct(Math.abs(err))}</bdi></>
            )}
          </div>
        </div>
      )}

      {party && (
        <div className="reveal-party">
          {guesses
            .map((g, i) => ({ g, p: players![i] }))
            .sort((x, y) => y.g.score - x.g.score)
            .map(({ g, p }) => (
              <div className="party-row" key={p.name} style={{ ["--pc" as string]: p.color }}>
                <span className="dot" />
                <span className="pname">{p.name}</span>
                <span className="pacc"><bdi dir="ltr">{fmtPct(g.accuracy * 100)}</bdi></span>
                <span className="ppts"><bdi dir="ltr">+{fmtInt(g.score)}</bdi></span>
              </div>
            ))}
        </div>
      )}

      <p className="reveal-sentence">{comparisonSentence(lang, key, big, small, fmtRatio(R), sphereMix)}</p>

      <div className="rows">
        <Row s={a} value={va} round={round} lang={lang} />
        <Row s={b} value={vb} round={round} lang={lang} />
      </div>
      <p className="reveal-diff">{diffSentence(lang, key, big, small, fmtLen(Math.abs(vb - va), lang), sphereMix)}</p>

      <button className="btn btn-primary btn-xl reveal-next" onClick={onNext}>
        {nextLabel}
      </button>
    </div>
  );
}
