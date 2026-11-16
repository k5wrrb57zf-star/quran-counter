import { useEffect, useRef } from "react";
import type { Lang } from "../lib/types";
import { t } from "../lib/i18n";

interface Props {
  /** initial position 0..1 – the slider is uncontrolled while dragging for 60 fps updates */
  start: number;
  resetKey: string;
  lang: Lang;
  disabled?: boolean;
  onChange: (p: number) => void;
}

const STEP = 0.0015; // ≈0.75 % size change per tap on +/-

/**
 * Touch-first precision slider.
 *  • Grab anywhere on the bar – it moves relative to your finger (no jumps).
 *  • Move your finger up/down away from the bar for 2×/4× finer control (iOS-style scrubbing).
 *  • +/- buttons nudge, and repeat while held.
 */
export function SizeSlider({ start, resetKey, lang, disabled, onChange }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const fineEl = useRef<HTMLDivElement>(null);
  const pos = useRef(start);
  const drag = useRef<{ id: number; x: number; y: number; p: number; f: number } | null>(null);
  const repeat = useRef<number>(0);
  const cb = useRef(onChange);
  cb.current = onChange;

  const render = () => {
    const p = pos.current;
    if (thumb.current) thumb.current.style.left = `${p * 100}%`;
    if (fill.current) fill.current.style.transform = `scaleX(${p})`;
    track.current?.setAttribute("aria-valuenow", String(Math.round(p * 1000) / 10));
  };

  const set = (p: number) => {
    const c = Math.min(1, Math.max(0, p));
    if (c === pos.current) return;
    pos.current = c;
    render();
    cb.current(c);
  };

  useEffect(() => {
    pos.current = start;
    render();
    cb.current(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => () => clearInterval(repeat.current), []);

  const onDown = (e: React.PointerEvent) => {
    if (disabled || drag.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, p: pos.current, f: 1 };
    thumb.current?.classList.add("is-active");
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const w = track.current!.getBoundingClientRect().width;
    // finer control the further the finger travels vertically from where it started
    const dy = Math.abs(e.clientY - d.y);
    const factor = dy < 70 ? 1 : dy < 150 ? 0.5 : 0.25;
    if (fineEl.current) {
      fineEl.current.dataset.level = String(factor);
    }
    // re-base when the factor changes so the thumb never jumps
    if (d.f !== factor) {
      d.x = e.clientX;
      d.p = pos.current;
      d.f = factor;
    }
    set(d.p + ((e.clientX - d.x) / w) * factor);
  };
  const onUp = (e: React.PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    thumb.current?.classList.remove("is-active");
    if (fineEl.current) fineEl.current.dataset.level = "1";
  };

  const nudge = (dir: number) => set(pos.current + dir * STEP);
  const startRepeat = (dir: number) => (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    nudge(dir);
    clearInterval(repeat.current);
    let n = 0;
    repeat.current = window.setInterval(() => {
      n++;
      if (n > 5) nudge(dir * (n > 30 ? 3 : 1));
    }, 60);
  };
  const stopRepeat = () => clearInterval(repeat.current);

  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const big = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { nudge(big); e.preventDefault(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { nudge(-big); e.preventDefault(); }
  };

  return (
    <div className={"slider" + (disabled ? " is-disabled" : "")} dir="ltr">
      <button
        className="slider-btn"
        aria-label={t(lang, "smaller")}
        onPointerDown={startRepeat(-1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        onPointerCancel={stopRepeat}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      </button>
      <div
        className="slider-hit"
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={t(lang, "dragHint")}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <div className="slider-ends" aria-hidden>
          <span className="slider-end small"><i /></span>
          <span className="slider-end big"><i /></span>
        </div>
        <div className="slider-track">
          <div className="slider-fill" ref={fill} />
          <div className="slider-ticks" />
        </div>
        <div className="slider-thumb" ref={thumb}>
          <span className="grip" />
        </div>
        <div className="slider-fine" ref={fineEl} data-level="1" aria-hidden>
          <span>×½</span>
          <span>×¼</span>
        </div>
      </div>
      <button
        className="slider-btn"
        aria-label={t(lang, "bigger")}
        onPointerDown={startRepeat(1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        onPointerCancel={stopRepeat}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

/** expose for reset button */
export const SLIDER_STEP = STEP;
