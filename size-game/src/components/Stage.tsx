import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { Lang, Round, Subject } from "../lib/types";
import { nameOf } from "../lib/i18n";

export interface Ghost {
  k: number;
  color: string;
  label: string;
}

export interface StageHandle {
  /** set challenge scale factor (1 = true size) – called on every slider move */
  setK: (k: number) => void;
  /** animate challenge from current k to `to` */
  animateTo: (to: number, ms?: number) => Promise<void>;
}

interface Props {
  round: Round;
  lang: Lang;
  initialK: number;
  ghosts?: Ghost[];
  revealed?: boolean;
}

interface Box { x: number; y: number; w: number; h: number }

/**
 * Lays out the reference (left, fixed) and the challenge (right, resizable) on a common
 * ground line in real-world proportion. A virtual camera zooms out smoothly when the
 * challenge outgrows the frame, so the true proportions are always preserved.
 */
function layout(W: number, H: number, a: Subject, b: Subject, k: number, extraK: number[]) {
  const pad = Math.max(14, W * 0.035);
  const top = Math.max(28, H * 0.08);
  const ground = H - Math.max(46, H * 0.12);
  const usableH = ground - top;
  const gap = Math.max(18, W * 0.04);
  const split = W * 0.44; // reference's right edge
  const kMax = Math.max(k, ...extraK);
  const bw = b.w * kMax, bh = b.h * kMax;
  // metres -> px
  let z = Math.min((usableH * 0.82) / a.h, (split - pad) / a.w); // the reference's "home" size
  z = Math.min(z, usableH / Math.max(a.h, bh), (W - split - gap - pad) / bw);
  const A: Box = { w: a.w * z, h: a.h * z, x: 0, y: 0 };
  A.x = split - A.w;
  A.y = ground - A.h;
  const boxB = (kk: number): Box => {
    const w = b.w * kk * z, h = b.h * kk * z;
    return { w, h, x: split + gap, y: ground - h };
  };
  return { A, B: boxB(k), boxB, ground, z };
}

const MIN_VISIBLE = 9;

function SubjectImg({ s, imgRef, className }: { s: Subject; imgRef: React.Ref<HTMLImageElement>; className: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      ref={imgRef}
      className={className + (failed ? " is-fallback" : "")}
      src={failed ? s.ref : s.cut}
      width={s.cw}
      height={s.ch}
      alt=""
      draggable={false}
      decoding="async"
      onError={() => setFailed(true)}
      style={{ width: s.cw, height: s.ch }}
    />
  );
}

export const Stage = forwardRef<StageHandle, Props>(function Stage({ round, lang, initialK, ghosts = [], revealed }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const imgA = useRef<HTMLImageElement>(null);
  const imgB = useRef<HTMLImageElement>(null);
  const labelA = useRef<HTMLDivElement>(null);
  const labelB = useRef<HTMLDivElement>(null);
  const pinA = useRef<HTMLDivElement>(null);
  const pinB = useRef<HTMLDivElement>(null);
  const ghostEls = useRef<(HTMLDivElement | null)[]>([]);
  const kRef = useRef(initialK);
  const size = useRef({ W: 0, H: 0 });
  const raf = useRef(0);
  const anim = useRef(0);

  const paint = useCallback(() => {
    raf.current = 0;
    const { W, H } = size.current;
    if (!W || !H) return;
    const { a, b } = round;
    const gk = ghosts.map((g) => g.k);
    const L = layout(W, H, a, b, kRef.current, gk);
    const place = (img: HTMLImageElement | null, s: Subject, box: Box) => {
      if (!img) return;
      img.style.transform = `translate3d(${box.x}px, ${box.y}px, 0) scale(${box.w / s.cw}, ${box.h / s.ch})`;
    };
    place(imgA.current, a, L.A);
    place(imgB.current, b, L.B);
    const lab = (el: HTMLDivElement | null, box: Box, align: "end" | "start") => {
      if (!el) return;
      const cx = align === "end" ? box.x + box.w : box.x;
      el.style.transform = `translate3d(${cx}px, ${L.ground + 10}px, 0) translateX(${align === "end" ? "-100%" : "0"})`;
    };
    lab(labelA.current, L.A, "end");
    lab(labelB.current, L.B, "start");
    const pin = (el: HTMLDivElement | null, box: Box) => {
      if (!el) return;
      const tiny = Math.max(box.w, box.h) < MIN_VISIBLE;
      el.style.opacity = tiny ? "1" : "0";
      el.style.transform = `translate3d(${box.x + box.w / 2}px, ${box.y + box.h / 2}px, 0)`;
    };
    pin(pinA.current, L.A);
    pin(pinB.current, L.B);
    ghosts.forEach((g, i) => {
      const el = ghostEls.current[i];
      if (!el) return;
      const bx = L.boxB(g.k);
      el.style.transform = `translate3d(${bx.x}px, ${bx.y}px, 0)`;
      el.style.width = `${bx.w}px`;
      el.style.height = `${bx.h}px`;
    });
  }, [round, ghosts]);

  const schedule = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(paint);
  }, [paint]);

  useImperativeHandle(ref, () => ({
    setK(k: number) {
      cancelAnimationFrame(anim.current);
      kRef.current = k;
      schedule();
    },
    animateTo(to: number, ms = 900) {
      cancelAnimationFrame(anim.current);
      const from = kRef.current;
      const l0 = Math.log(from), l1 = Math.log(to);
      const t0 = performance.now();
      return new Promise<void>((resolve) => {
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / ms);
          const e = 1 - Math.pow(1 - p, 3);
          kRef.current = Math.exp(l0 + (l1 - l0) * e);
          paint();
          if (p < 1) anim.current = requestAnimationFrame(step);
          else resolve();
        };
        anim.current = requestAnimationFrame(step);
      });
    },
  }), [paint, schedule]);

  useLayoutEffect(() => {
    kRef.current = initialK;
    const el = root.current!;
    const measure = () => {
      size.current = { W: el.clientWidth, H: el.clientHeight };
      paint();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf.current);
      cancelAnimationFrame(anim.current);
      raf.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useEffect(() => {
    paint();
  }, [ghosts, paint]);

  return (
    <div className={"stage" + (revealed ? " is-revealed" : "")} ref={root} dir="ltr">
      <div className="stage-ground" />
      <SubjectImg key={"a" + round.a.id} s={round.a} imgRef={imgA} className="stage-img stage-img-a" />
      {ghosts.map((g, i) => (
        <div
          key={i}
          className="stage-ghost"
          ref={(el) => (ghostEls.current[i] = el)}
          style={{ ["--ghost" as string]: g.color }}
        >
          <span>{g.label}</span>
        </div>
      ))}
      <SubjectImg key={"b" + round.b.id} s={round.b} imgRef={imgB} className="stage-img stage-img-b" />
      <div className="stage-pin" ref={pinA}><i /></div>
      <div className="stage-pin" ref={pinB}><i /></div>
      <div className="stage-label stage-label-a" ref={labelA} dir={lang === "ar" ? "rtl" : "ltr"}>
        {nameOf(round.a, lang)}
      </div>
      <div className="stage-label stage-label-b" ref={labelB} dir={lang === "ar" ? "rtl" : "ltr"}>
        {nameOf(round.b, lang)}
      </div>
    </div>
  );
});
