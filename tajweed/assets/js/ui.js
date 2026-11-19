// أدوات الواجهة العامة
import { snippets, TUHFA, JAZARIYYA, LESSONS } from './data.js';
import { I } from './icons.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
export const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

// ---------- النص القرآني ----------
export function quranWords(key) {
  const s = snippets()[key];
  if (!s) {
    const [, phrase, hl] = key.split('|');
    return { ok: false, words: phrase.split(/\s+/), h: [], hl, ref: key.split('|')[0] };
  }
  return { ok: true, words: s.t.split(' '), h: s.h, s };
}
export function quranHTML(key, { ref = true, play = false, cls = 'q-inline' } = {}) {
  const r = quranWords(key);
  const words = r.words.map((w, i) => (r.h.includes(i) ? `<mark>${esc(w)}</mark>` : esc(w))).join(' ');
  const refTxt = r.ok ? `${r.s.n}: ${AR(r.s.a)}` : `${esc(r.ref)}`;
  const title = r.ok ? `سورة ${r.s.n}، الآية ${r.s.a}` : 'شاهد لم يُتحقق منه بعد';
  return `<span class="${cls}${r.ok ? '' : ' q-unverified'}" title="${title}"><span class="orn">﴿</span>${words}<span class="orn">﴾</span></span>${ref ? ` <span class="q-ref">[${refTxt}]</span>` : ''}${play && r.ok ? playBtn(r.s) : ''}`;
}
export function refPlayHTML(key) {
  const r = quranWords(key);
  if (!r.ok) return `<span class="q-ref">[${esc(r.ref)}]</span>`;
  return `<span class="q-ref">[${r.s.n}: ${AR(r.s.a)}]</span>${playBtn(r.s)}`;
}
export function playBtn(s) {
  return `<button class="play" data-play="${s.s}:${s.a}:${s.g}" aria-label="استمع إلى الآية ${s.a} من سورة ${s.n}">${I.play}</button>`;
}
// تحويل {{2:255|...}} داخل النصوص إلى نص قرآني موثق
export function rich(html) {
  return String(html ?? '').replace(/\{\{(\d{1,3}:\d{1,3}\|[^{}]+?)\}\}/g, (_, k) => quranHTML(k));
}

// ---------- المتون ----------
export function verseHTML(matn, n, { link = false, note = true } = {}) {
  const M = matn === 'tuhfa' ? TUHFA : JAZARIYYA;
  const v = M.verses.find((x) => x.n === n);
  if (!v) return '';
  return `<div class="verse" id="${matn}-${n}"><span class="h1">${esc(v.a)}</span><span class="vn">${AR(n)}</span><span class="h2">${esc(v.b)}</span></div>${note && v.note ? `<div class="verse-note">${esc(v.note)}</div>` : ''}`;
}

// ---------- الصوت ----------
const audio = typeof Audio !== 'undefined' ? new Audio() : null;
let playingBtn = null;
const pad = (n) => String(n).padStart(3, '0');
function setBtn(btn, on) {
  if (!btn) return;
  btn.classList.toggle('on', on);
  btn.innerHTML = on ? I.pause : I.play;
}
export function initAudio() {
  if (!audio) return;
  audio.addEventListener('ended', () => { setBtn(playingBtn, false); playingBtn = null; });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-play]');
    if (!btn) return;
    e.preventDefault();
    if (playingBtn === btn && !audio.paused) { audio.pause(); setBtn(btn, false); playingBtn = null; return; }
    setBtn(playingBtn, false);
    const [s, a, g] = btn.dataset.play.split(':');
    const sources = [
      `https://everyayah.com/data/Husary_128kbps/${pad(s)}${pad(a)}.mp3`,
      `https://cdn.islamic.network/quran/audio/128/ar.husary/${g}.mp3`,
    ];
    let k = 0;
    const tryNext = () => {
      if (k >= sources.length) { toast('تعذّر تشغيل التلاوة الآن، تحقق من الاتصال بالإنترنت.'); setBtn(btn, false); playingBtn = null; return; }
      audio.src = sources[k++];
      audio.play().then(() => { playingBtn = btn; setBtn(btn, true); }).catch(tryNext);
    };
    audio.onerror = () => { if (playingBtn === btn || k > 0) tryNext(); };
    tryNext();
  });
}
export function stopAudio() { if (audio && !audio.paused) audio.pause(); setBtn(playingBtn, false); playingBtn = null; }

// ---------- رسائل ونوافذ ----------
export function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}
export function modal(html, onMount) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(back);
  back.querySelector('button, a, input')?.focus();
  onMount?.(back.firstElementChild, close);
  return close;
}

export const levelName = (l) => ['', 'تأسيسي', 'متوسط', 'متقدم'][l] || '';
export function lessonLink(id) {
  const L = LESSONS[id];
  return L ? `<a href="#/lesson/${id}">${esc(L.title)}</a>` : esc(id);
}
export function ring(p, label) {
  return `<div class="ring" style="--p:${Math.round(p)}"><span>${label ?? AR(Math.round(p)) + '٪'}</span></div>`;
}
export function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
// تطبيع النص العربي للبحث
export function norm(s) {
  return String(s || '')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/<[^>]+>/g, ' ').toLowerCase();
}
