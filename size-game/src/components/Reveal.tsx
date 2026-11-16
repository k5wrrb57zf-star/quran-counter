import type { Guess, Lang, Player, Round, Subject } from "../lib/types";
import { CONF_LABEL, RATING_LABEL, comparisonSentence, diffSentence, dimLabel, nameOf, t } from "../lib/i18n";
import { fmtInt, fmtLen, fmtPct, fmtRatio } from "../lib/format";
import { rating, signedErrorPct } from "../lib/score";

function Measure({ s, value, round, lang }: { s: Subject; value: number; round: Round; lang: Lang }) {
  const note = lang === "ar" ? s.noteAr : s.note;
  return (
    <div className="measure">
      <div className="measure-thumb">
        <img src={s.ref} alt="" loading="lazy" decoding="async" />
      </div>
      <div className="measure-body">
        <div className="measure-name">{nameOf(s, lang)}</div>
        <div className="measure-value">
          <span className="measure-dim">{dimLabel(lang, s, round.key)}</span>
          <strong><bdi>{fmtLen(value, lang)}</bdi></strong>
        </div>
        <div className="measure-meta">
          <span className={"badge badge-" + s.conf}>{CONF_LABEL[s.conf][lang]}</span>
          {note && <span className="measure-note">{note}</span>}
        </div>
        <div className="measure-src" dir="ltr">{s.src}</div>
      </div>
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
  const sentence = comparisonSentence(lang, key, big, small, fmtRatio(R), sphereMix);
  // player's estimate expressed in the same direction as the true ratio
  const guessRatio = (g: Guess) => (bBigger ? R * g.k : R / g.k);
  const diff = Math.abs(vb - va);
  const party = players && players.length > 1;
  const g0 = guesses[0];

  return (
    <div className="reveal" role="region" aria-live="polite">
      {!party && g0 && (
        <div className={"reveal-head rating-" + rating(g0.accuracy)}>
          <div className="reveal-rating">{RATING_LABEL[rating(g0.accuracy)][lang]}</div>
          <div className="reveal-points">
            <bdi className="num" dir="ltr">+{fmtInt(g0.score)}</bdi> <span className="unit">{t(lang, "points")}</span>
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
                <span className="pacc">{fmtPct(g.accuracy * 100)}</span>
                <span className="ppts">+{fmtInt(g.score)}</span>
              </div>
            ))}
        </div>
      )}

      <p className="reveal-sentence">{sentence}</p>

      {!party && g0 && (
        <div className="reveal-stats">
          <div className="stat">
            <span className="stat-label">{t(lang, "ratio")}</span>
            <span className="stat-value"><bdi dir="ltr">{fmtRatio(R)}×</bdi></span>
          </div>
          <div className="stat">
            <span className="stat-label">{t(lang, "yourRatio")}</span>
            <span className="stat-value"><bdi dir="ltr">{fmtRatio(guessRatio(g0))}×</bdi></span>
          </div>
          <div className="stat">
            <span className="stat-label">{t(lang, "error")}</span>
            <span className="stat-value">
              <bdi dir="ltr">{signedErrorPct(g0.k) > 0 ? "+" : "−"}{fmtPct(Math.abs(signedErrorPct(g0.k)))}</bdi>
              <small>{g0.k >= 1 ? t(lang, "tooBig") : t(lang, "tooSmall")}</small>
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">{t(lang, "accuracy")}</span>
            <span className="stat-value"><bdi dir="ltr">{fmtPct(g0.accuracy * 100)}</bdi></span>
          </div>
        </div>
      )}

      <div className="measures">
        <Measure s={a} value={va} round={round} lang={lang} />
        <Measure s={b} value={vb} round={round} lang={lang} />
      </div>
      <p className="reveal-diff">{diffSentence(lang, key, big, small, fmtLen(diff, lang), sphereMix)}</p>

      <button className="btn btn-primary btn-xl reveal-next" onClick={onNext}>
        {nextLabel}
      </button>
    </div>
  );
}
