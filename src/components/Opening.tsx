import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import bengkel from "../assets/bengkel.jpg";
import mekanik from "../assets/mekanik.png";
import { TechMusic, speak, stopSpeech } from "./openingAudio";

/* ──────────────────────────────────────────────────────────────
   OPENING LAB MAYA – 16:9 · 1920×1080 · biru navy / merah / abu-abu
   Adegan mengikuti file ADEGAN_LAB_MAYA.pptx
   ────────────────────────────────────────────────────────────── */

const W = 1920;
const H = 1080;
const NAVY = "#0b1f4b";
const NAVY_DEEP = "#060f2b";
const RED = "#e4282d";
const STEEL = "#c9ced8";

type SceneId = 0 | 1 | 2 | 3 | 4; // 0 = layar pembuka (tap untuk memutar)

/** Teks dubbing per adegan (sesuai PPT). */
const SCENES: Record<1 | 2 | 3 | 4, string[]> = {
  1: [
    "Halo, Sobat Otomotif!",
    "Selamat datang di LAB MAYA, Laboratorium Virtual Teknik Otomotif.",
    "Di sini, kita akan belajar dan menjelajahi berbagai pengetahuan serta keterampilan dasar dalam dunia otomotif.",
  ],
  2: [
    "Pernahkah kalian bertanya, bagaimana seorang mekanik mengetahui ukuran suatu komponen mesin dengan tepat?",
    "Bagaimana cara memastikan sebuah komponen masih layak digunakan atau justru sudah mengalami keausan?",
    "Untuk menjawab pertanyaan tersebut, seorang mekanik membutuhkan alat ukur yang tepat dan akurat.",
  ],
  3: [
    "Dalam dunia otomotif, ketelitian pengukuran merupakan salah satu keterampilan dasar yang wajib dikuasai oleh setiap mekanik.",
    "Pada pembelajaran kali ini, kita akan mengenal berbagai macam alat ukur otomotif, mulai dari jangka sorong, mikrometer, hingga avometer.",
    "Kita juga akan mempelajari fungsi, bagian-bagian, serta cara menggunakan alat ukur dengan benar.",
  ],
  4: [
    "Jadi, siapkan semangat belajar kalian!",
    "Mari kita masuk ke laboratorium virtual dan mulai menjelajahi dunia pengukuran otomotif.",
    "Pelajari setiap alat, pahami cara penggunaannya, dan tingkatkan keterampilan kalian menjadi mekanik yang kompeten.",
    "LAB MAYA! Belajar, Mencoba, dan Menjadi Mekanik yang Kompeten!",
    "Selamat belajar!",
  ],
};

/**
 * Ingin memakai rekaman dubbing asli? Taruh file audio (mis. di folder /public/audio)
 * lalu isi di sini, kuncinya "adegan-baris", contoh: { "1-0": "/audio/a1-0.mp3" }.
 * Bila kosong, narasi memakai suara Indonesia bawaan browser.
 */
const NARASI_AUDIO: Record<string, string> = {};

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/* ───────── CSS animasi opening ───────── */
const CSS = `
.op-root, .op-root * { box-sizing: border-box; }
.op-root { font-family: "Poppins", system-ui, sans-serif; color: #fff; }
.op-display { font-family: "Montserrat", "Poppins", sans-serif; }

@keyframes op-kb1 { from { transform: scale(1) } to { transform: scale(1.14) } }
@keyframes op-pan2 {
  from { transform-origin: 50% 50%; transform: scale(1.04) }
  to   { transform-origin: 86% 56%; transform: scale(1.62) }
}
@keyframes op-drift3 { from { transform: scale(1.12) translateX(0) } to { transform: scale(1.12) translateX(-40px) } }
@keyframes op-slow-zoom { from { transform: scale(1) } to { transform: scale(1.08) } }
@keyframes op-char-right { from { opacity: 0; transform: translateX(1000px) } 25% { opacity: 1 } to { opacity: 1; transform: none } }
@keyframes op-char-left  { from { opacity: 0; transform: translateX(-900px) } 25% { opacity: 1 } to { opacity: 1; transform: none } }
@keyframes op-char-up    { from { opacity: 0; transform: translateY(160px) scale(.96) } to { opacity: 1; transform: none } }
@keyframes op-walk { from { transform: translateX(-820px) } to { transform: none } }
@keyframes op-bob  { 0%,100% { transform: translateY(0) rotate(0) } 25% { transform: translateY(-16px) rotate(-1.4deg) } 75% { transform: translateY(-16px) rotate(1.4deg) } }
@keyframes op-nod  { 0%,100% { transform: translateY(0) rotate(0) } 50% { transform: translateY(-6px) rotate(-.7deg) } }
@keyframes op-title-in {
  from { opacity: 0; transform: perspective(1400px) rotateY(-28deg) rotateX(18deg) translateX(-120px) scale(.9) }
  to   { opacity: 1; transform: perspective(1400px) rotateY(-8deg) rotateX(3deg) }
}
@keyframes op-title-float { 0%,100% { transform: perspective(1400px) rotateY(-8deg) rotateX(3deg) translateY(0) } 50% { transform: perspective(1400px) rotateY(-5deg) rotateX(1deg) translateY(-10px) } }
@keyframes op-fade-up { from { opacity: 0; transform: translateY(26px) } to { opacity: 1; transform: none } }
@keyframes op-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes op-pop { 0% { opacity: 0; transform: scale(.3) } 65% { opacity: 1; transform: scale(1.1) } 100% { opacity: 1; transform: scale(1) } }
@keyframes op-wave { 0%,100% { transform: rotate(0) } 20% { transform: rotate(24deg) } 40% { transform: rotate(-12deg) } 60% { transform: rotate(24deg) } 80% { transform: rotate(-8deg) } }
@keyframes op-spin { to { transform: rotate(360deg) } }
@keyframes op-spin-rev { to { transform: rotate(-360deg) } }
@keyframes op-wipe { from { transform: translateX(-135%) skewX(-18deg) } to { transform: translateX(135%) skewX(-18deg) } }
@keyframes op-pulse { 0% { box-shadow: 0 0 0 0 rgba(228,40,45,.65), 0 14px 40px rgba(228,40,45,.4) } 70% { box-shadow: 0 0 0 38px rgba(228,40,45,0), 0 14px 40px rgba(228,40,45,.4) } 100% { box-shadow: 0 0 0 0 rgba(228,40,45,0), 0 14px 40px rgba(228,40,45,.4) } }
@keyframes op-sheen { from { transform: translateX(-130%) skewX(-20deg) } to { transform: translateX(330%) skewX(-20deg) } }
@keyframes op-ring { 0% { transform: scale(.6); opacity: .8 } 100% { transform: scale(1.35); opacity: 0 } }
@keyframes op-piston { 0%,100% { transform: translateY(0) } 50% { transform: translateY(46px) } }
@keyframes op-rod { 0%,100% { transform: rotate(-14deg) } 50% { transform: rotate(14deg) } }
@keyframes op-jaw { 0%,12% { transform: translateX(0) } 50%,62% { transform: translateX(78px) } 100% { transform: translateX(0) } }
@keyframes op-spindle { 0%,12% { transform: translateX(0) } 50%,62% { transform: translateX(-22px) } 100% { transform: translateX(0) } }
@keyframes op-needle { 0% { transform: rotate(-52deg) } 35% { transform: rotate(38deg) } 60% { transform: rotate(8deg) } 100% { transform: rotate(46deg) } }
@keyframes op-screen-on { 0% { transform: scaleY(.015) scaleX(.2); opacity: 0; filter: brightness(4) } 35% { transform: scaleY(.015) scaleX(1); opacity: 1; filter: brightness(4) } 100% { transform: none; opacity: 1; filter: none } }
@keyframes op-scan { from { transform: translateY(-100%) } to { transform: translateY(100%) } }
@keyframes op-q { 0%,100% { transform: translateY(0) rotate(-6deg) } 50% { transform: translateY(-14px) rotate(6deg) } }
@keyframes op-sub { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
@keyframes op-arrow { 0%,100% { transform: translateX(0) } 50% { transform: translateX(26px) } }

.op-pop { animation: op-pop .55s cubic-bezier(.2,.9,.3,1.2) both; }
.op-fade-up { animation: op-fade-up .7s cubic-bezier(.2,.8,.2,1) both; }
.op-btn { border: 0; cursor: pointer; font-family: "Montserrat", sans-serif; }
.op-btn:focus-visible, .op-ctrl:focus-visible { outline: 4px solid #fff; outline-offset: 4px; }
.op-ctrl { cursor: pointer; border: 1px solid rgba(255,255,255,.28); background: rgba(6,15,43,.62); color: #fff; backdrop-filter: blur(8px); font: 600 13px "Poppins", sans-serif; padding: 8px 14px; border-radius: 999px; transition: background .2s, transform .15s; }
.op-ctrl:hover { background: rgba(228,40,45,.85); }
.op-ctrl:active { transform: scale(.95); }

@media (prefers-reduced-motion: reduce) {
  .op-root *, .op-root *::before, .op-root *::after { animation-duration: .01ms !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;

/* ───────── Elemen dasar ───────── */
function Abs({ style, children, className }: { style?: CSSProperties; children?: ReactNode; className?: string }) {
  return (
    <div className={className} style={{ position: "absolute", ...style }}>
      {children}
    </div>
  );
}

function Bengkel({ animation, dim = 0, blur = 0, origin }: { animation?: string; dim?: number; blur?: number; origin?: string }) {
  return (
    <Abs style={{ inset: 0, overflow: "hidden", background: NAVY_DEEP }}>
      <img
        src={bengkel}
        alt=""
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          animation,
          transformOrigin: origin ?? "50% 50%",
          filter: blur ? `blur(${blur}px)` : undefined,
        }}
      />
      {dim > 0 && <Abs style={{ inset: 0, background: `rgba(6,15,43,${dim})` }} />}
    </Abs>
  );
}

function Mekanik({ height, style, animation }: { height: number; style?: CSSProperties; animation?: string }) {
  return (
    <Abs style={style}>
      <div style={{ animation, transformOrigin: "50% 100%" }}>
        <img
          src={mekanik}
          alt="Mekanik Automotive Service"
          draggable={false}
          style={{ height, width: "auto", display: "block", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.45))" }}
        />
      </div>
    </Abs>
  );
}

function Gear({ size, stroke = "rgba(255,255,255,.12)", speed = 40, reverse }: { size: number; stroke?: string; speed?: number; reverse?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      style={{ animation: `${reverse ? "op-spin-rev" : "op-spin"} ${speed}s linear infinite` }}
    >
      <circle r="62" fill="none" stroke={stroke} strokeWidth="6" />
      <circle r="24" fill="none" stroke={stroke} strokeWidth="6" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x="-9" y="-92" width="18" height="30" rx="3" fill={stroke} transform={`rotate(${i * 30})`} />
      ))}
    </svg>
  );
}

function Wordmark({ size, stack }: { size: number; stack?: boolean }) {
  // Teks 3D: ekstrusi merah gelap berlapis + cahaya
  const depth = Math.max(4, Math.round(size / 18));
  const shadows = Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${i < depth / 2 ? "#e4282d" : "#8f1217"}`).join(",");
  return (
    <span
      className="op-display"
      style={{
        fontWeight: 900,
        fontSize: size,
        lineHeight: 0.92,
        letterSpacing: "-0.02em",
        color: "#fff",
        textShadow: `${shadows}, 0 ${depth * 2}px ${depth * 4}px rgba(0,0,0,.55)`,
      }}
    >
      {stack ? (
        <>
          LAB
          <br />
          MAYA
        </>
      ) : (
        "LAB MAYA"
      )}
    </span>
  );
}

function CornerBadge({ delay }: { delay: number }) {
  return (
    <Abs
      className="op-pop"
      style={{
        left: 56,
        top: 40,
        zIndex: 30,
        animationDelay: `${delay}s`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 26px 12px 14px",
        borderRadius: 22,
        background: "linear-gradient(135deg, rgba(11,31,75,.92), rgba(18,41,95,.85))",
        border: "1px solid rgba(255,255,255,.18)",
        boxShadow: "0 12px 30px rgba(0,0,0,.35)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${RED}, #8f1217)`, display: "grid", placeItems: "center" }}>
        <Gear size={44} stroke="#fff" speed={14} />
      </div>
      <div>
        <div className="op-display" style={{ fontWeight: 900, fontSize: 40, lineHeight: 1 }}>LAB MAYA</div>
        <div style={{ fontSize: 15, color: STEEL, marginTop: 4, fontWeight: 500 }}>Laboratorium Virtual Teknik Otomotif</div>
      </div>
    </Abs>
  );
}

function Bubble({ children, style, tail = "left", delay = 0 }: { children: ReactNode; style?: CSSProperties; tail?: "left" | "right" | "bottom"; delay?: number }) {
  const tailStyle: CSSProperties =
    tail === "bottom"
      ? { left: 40, bottom: -22, borderWidth: "26px 18px 0 18px", borderColor: "#fff transparent transparent transparent" }
      : tail === "left"
        ? { left: -22, bottom: 26, borderWidth: "18px 26px 18px 0", borderColor: "transparent #fff transparent transparent" }
        : { right: -22, bottom: 26, borderWidth: "18px 0 18px 26px", borderColor: "transparent transparent transparent #fff" };
  return (
    <Abs className="op-pop" style={{ animationDelay: `${delay}s`, zIndex: 20, ...style }}>
      <div
        style={{
          position: "relative",
          background: "#fff",
          color: NAVY,
          borderRadius: 34,
          padding: "20px 34px",
          fontFamily: '"Montserrat", sans-serif',
          fontWeight: 800,
          boxShadow: "0 18px 40px rgba(0,0,0,.35)",
        }}
      >
        {children}
        <span style={{ position: "absolute", width: 0, height: 0, borderStyle: "solid", ...tailStyle }} />
      </div>
    </Abs>
  );
}

/* ───────── Ikon alat ukur (SVG animasi) ───────── */
export function CaliperSvg() {
  return (
    <svg viewBox="0 0 260 150" width="100%" style={{ overflow: "visible" }}>
      <rect x="10" y="62" width="240" height="26" rx="4" fill={STEEL} stroke="#8b93a3" strokeWidth="2" />
      {Array.from({ length: 19 }).map((_, i) => (
        <line key={i} x1={30 + i * 11} x2={30 + i * 11} y1="62" y2={i % 5 === 0 ? 76 : 70} stroke={NAVY} strokeWidth="1.5" />
      ))}
      <rect x="10" y="14" width="16" height="116" rx="3" fill="#8e99ae" stroke="#5b667d" strokeWidth="2" />
      <g style={{ animation: "op-jaw 3.6s ease-in-out infinite" }}>
        <rect x="64" y="14" width="16" height="116" rx="3" fill="#8e99ae" stroke="#5b667d" strokeWidth="2" />
        <rect x="64" y="50" width="76" height="50" rx="8" fill="#1a3a7c" stroke={NAVY} strokeWidth="2" />
        <circle cx="116" cy="75" r="11" fill={RED} stroke="#8f1217" strokeWidth="2" />
        <rect x="70" y="58" width="30" height="10" rx="2" fill="#dce4f5" opacity=".85" />
      </g>
    </svg>
  );
}

export function MicrometerSvg() {
  return (
    <svg viewBox="0 0 260 150" width="100%" style={{ overflow: "visible" }}>
      <path d="M60 76 H44 Q22 76 22 54 V38 Q22 18 42 18 H176 Q196 18 196 38 V62" fill="none" stroke="#1a3a7c" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="56" y="67" width="14" height="18" rx="2" fill="#8e99ae" />
      <rect x="150" y="62" width="62" height="28" rx="3" fill="#dce4f5" stroke="#8b93a3" strokeWidth="2" />
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={i} x1={158 + i * 5.2} x2={158 + i * 5.2} y1="62" y2={i % 2 === 0 ? 76 : 70} stroke={NAVY} strokeWidth="1.5" />
      ))}
      <g style={{ animation: "op-spindle 3.6s ease-in-out infinite" }}>
        <rect x="82" y="71" width="76" height="10" fill={STEEL} stroke="#8b93a3" strokeWidth="1.5" />
        <rect x="198" y="54" width="52" height="44" rx="8" fill="#12295f" stroke={NAVY} strokeWidth="2" />
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={i} x1={206 + i * 6.5} x2={206 + i * 6.5} y1="58" y2="94" stroke="#6a86c8" strokeWidth="1.5" />
        ))}
        <rect x="198" y="54" width="52" height="8" rx="3" fill={RED} />
      </g>
    </svg>
  );
}

export function AvometerSvg() {
  const ticks = Array.from({ length: 11 }).map((_, i) => {
    const a = ((-50 + i * 10) * Math.PI) / 180;
    const r1 = i % 5 === 0 ? 40 : 45;
    return <line key={i} x1={130 + Math.sin(a) * r1} y1={92 - Math.cos(a) * r1} x2={130 + Math.sin(a) * 52} y2={92 - Math.cos(a) * 52} stroke={NAVY} strokeWidth={i % 5 === 0 ? 2.4 : 1.4} />;
  });
  return (
    <svg viewBox="0 0 260 150" width="100%" style={{ overflow: "visible" }}>
      <rect x="46" y="2" width="168" height="146" rx="16" fill="#12295f" stroke="#8e99ae" strokeWidth="3" />
      <rect x="60" y="14" width="140" height="82" rx="10" fill="#f3f5f9" />
      {ticks}
      <path d="M 87 56 A 52 52 0 0 1 173 56" fill="none" stroke={RED} strokeWidth="3" opacity=".0" />
      <g style={{ transformOrigin: "130px 92px", animation: "op-needle 3s ease-in-out infinite alternate" }}>
        <line x1="130" y1="92" x2="130" y2="38" stroke={RED} strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="130" cy="92" r="6" fill={NAVY} />
      <circle cx="130" cy="118" r="17" fill={STEEL} stroke="#8b93a3" strokeWidth="2" />
      <line x1="130" y1="118" x2="130" y2="104" stroke={RED} strokeWidth="3" strokeLinecap="round" />
      {[78, 130, 182].map((x, i) => (
        <circle key={x} cx={x} cy="138" r="5.5" fill={i === 1 ? "#0b1f4b" : RED} stroke="#fff" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function PistonSvg() {
  return (
    <svg viewBox="0 0 240 280" width="100%" style={{ overflow: "visible" }}>
      <rect x="40" y="10" width="160" height="170" rx="16" fill="none" stroke="#7fa0ec" strokeWidth="5" opacity=".8" />
      <g style={{ animation: "op-piston 1.8s ease-in-out infinite" }}>
        <rect x="52" y="22" width="136" height="74" rx="10" fill={STEEL} stroke="#fff" strokeWidth="3" />
        {[36, 50, 64].map((y) => (
          <line key={y} x1="52" x2="188" y1={y} y2={y} stroke="#6b7690" strokeWidth="4" />
        ))}
        <circle cx="120" cy="80" r="9" fill={NAVY} />
        <g style={{ transformOrigin: "120px 80px", animation: "op-rod 1.8s ease-in-out infinite" }}>
          <rect x="110" y="80" width="20" height="120" rx="10" fill="#9fb0d6" stroke="#fff" strokeWidth="2.5" />
        </g>
      </g>
      <circle cx="120" cy="238" r="30" fill="none" stroke={RED} strokeWidth="9" />
      <circle cx="120" cy="238" r="9" fill={RED} />
    </svg>
  );
}

/* ───────── Adegan ───────── */
function Scene1({ line }: { line: number }) {
  const shrunk = line >= 2;
  return (
    <Abs style={{ inset: 0 }}>
      <Bengkel animation="op-kb1 20s linear both" origin="62% 58%" />
      <Abs style={{ inset: 0, background: "linear-gradient(90deg, rgba(6,15,43,.9) 0%, rgba(6,15,43,.6) 38%, rgba(6,15,43,0) 68%)" }} />
      <Abs style={{ left: -180, top: 560, opacity: 0.9 }}>
        <Gear size={640} stroke="rgba(228,40,45,.22)" speed={60} />
      </Abs>

      {/* Mekanik masuk dari kanan */}
      <Mekanik
        height={930}
        style={{ right: 70, bottom: -40, animation: "op-char-right 1.7s cubic-bezier(.16,.9,.3,1) .5s both" }}
        animation="op-nod 4.2s ease-in-out 2.4s infinite"
      />
      {line >= 0 && (
        <Bubble tail="right" style={{ right: 780, top: 190 }} delay={0.1}>
          <span style={{ fontSize: 54, display: "inline-block", transformOrigin: "70% 80%", animation: "op-wave 1.6s ease-in-out .5s 2" }}>👋</span>
          <span style={{ fontSize: 50, marginLeft: 14 }}>Halo!</span>
        </Bubble>
      )}

      {/* Judul 3D */}
      <Abs
        style={{
          left: 120,
          top: 130,
          transformOrigin: "0 0",
          transition: "transform 1.3s cubic-bezier(.7,0,.2,1), opacity .9s ease .2s",
          transform: shrunk ? "translate(-70px,-120px) scale(.16)" : "none",
          opacity: shrunk ? 0 : 1,
        }}
      >
        <div style={{ animation: "op-title-in 1.2s cubic-bezier(.2,.9,.2,1) 1s both" }}>
          <div style={{ animation: "op-title-float 6s ease-in-out 2.4s infinite", transformOrigin: "0 50%" }}>
            <div
              className="op-display"
              style={{ display: "inline-block", background: RED, borderRadius: 14, padding: "10px 24px", fontWeight: 800, fontSize: 30, letterSpacing: ".04em", boxShadow: "0 10px 24px rgba(228,40,45,.45)" }}
            >
              LABORATORIUM VIRTUAL
            </div>
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column" }}>
              <Wordmark size={200} stack />
            </div>
            <div className="op-display" style={{ marginTop: 22, fontWeight: 800, fontSize: 46, letterSpacing: ".01em" }}>
              TEKNIK OTOMOTIF
            </div>
            <div style={{ marginTop: 28, height: 6, width: 520, borderRadius: 6, background: `linear-gradient(90deg, ${RED}, ${STEEL})` }} />
            <div className="op-fade-up" style={{ marginTop: 26, fontSize: 38, fontWeight: 600, color: STEEL, animationDelay: "2s" }}>
              Belajar&nbsp;•&nbsp;Mencoba&nbsp;•&nbsp;Kompeten
            </div>
          </div>
        </div>
      </Abs>
    </Abs>
  );
}

function Scene2({ line }: { line: number }) {
  return (
    <Abs style={{ inset: 0 }}>
      <Bengkel animation="op-pan2 6s cubic-bezier(.45,.05,.3,1) both" dim={0.22} />
      <Abs style={{ inset: 0, background: "linear-gradient(90deg, rgba(6,15,43,.85) 0%, rgba(6,15,43,.35) 45%, rgba(6,15,43,0) 70%)" }} />

      {/* Judul pertanyaan */}
      <Abs className="op-fade-up" style={{ left: 70, top: 215, width: 640, animationDelay: ".6s" }}>
        <div className="op-display" style={{ fontWeight: 900, fontSize: 60, lineHeight: 1.08, textShadow: "0 6px 24px rgba(0,0,0,.5)" }}>
          BAGAIMANA MEKANIK <span style={{ color: RED }}>MENGUKUR</span> KOMPONEN?
        </div>
        <div style={{ marginTop: 22, fontSize: 28, color: STEEL, fontWeight: 500, lineHeight: 1.4 }}>
          Ketepatan pengukuran menentukan kualitas pekerjaan mekanik.
        </div>
      </Abs>

      {/* Mekanik berjalan mendekati mobil */}
      <Abs style={{ left: 600, bottom: -40, animation: "op-walk 3.4s cubic-bezier(.3,.6,.3,1) .3s both" }}>
        <div style={{ animation: "op-bob .48s ease-in-out .3s 7" }}>
          <img src={mekanik} alt="" draggable={false} style={{ height: 880, display: "block", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.45))", transformOrigin: "50% 100%", animation: "op-nod 4.2s ease-in-out 3.7s infinite" }} />
        </div>
      </Abs>

      {/* Gelembung pertanyaan di dekat kepala */}
      <Bubble tail="bottom" style={{ left: 1010, top: 70 }} delay={3.5}>
        <span style={{ fontSize: 44 }}>Berapa ukurannya?</span>
      </Bubble>
      {[
        { l: 520, t: 150, s: 110, d: 3.9 },
        { l: 880, t: 40, s: 80, d: 4.3 },
        { l: 1380, t: 110, s: 90, d: 4.6 },
      ].map((q, i) => (
        <Abs key={i} className="op-pop" style={{ left: q.l, top: q.t, animationDelay: `${q.d}s`, zIndex: 18 }}>
          <div className="op-display" style={{ fontSize: q.s, fontWeight: 900, color: RED, textShadow: "0 6px 20px rgba(0,0,0,.6)", animation: `op-q ${2.4 + i * 0.4}s ease-in-out infinite` }}>
            ?
          </div>
        </Abs>
      ))}

      {/* Hologram komponen → alat ukur */}
      {line >= 1 && (
        <Abs className="op-pop" style={{ left: 1390, top: 330, width: 460, height: 460, zIndex: 15 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,99,201,.5), rgba(11,31,75,.8))", border: "3px solid rgba(127,160,236,.7)", boxShadow: "0 0 60px rgba(59,99,201,.65), inset 0 0 50px rgba(127,160,236,.35)" }} />
          {[0, 1].map((i) => (
            <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid rgba(228,40,45,.7)", animation: `op-ring 2.6s ease-out ${i * 1.3}s infinite` }} />
          ))}
          <Abs style={{ inset: 0, display: "grid", placeItems: "center" }}>
            <div style={{ width: 300, transition: "transform 1s ease, opacity .7s ease", transform: line >= 2 ? "scale(1.9)" : "none", opacity: line >= 2 ? 0 : 1 }}>
              <PistonSvg />
            </div>
          </Abs>
          {line >= 2 && (
            <Abs className="op-pop" style={{ inset: 0, display: "grid", placeItems: "center" }}>
              <div style={{ width: 340 }}>
                <CaliperSvg />
              </div>
            </Abs>
          )}
          <Abs style={{ left: 0, right: 0, bottom: -64, textAlign: "center" }}>
            <span className="op-display" style={{ background: RED, padding: "8px 22px", borderRadius: 12, fontWeight: 800, fontSize: 26 }}>
              {line >= 2 ? "ALAT UKUR" : "KOMPONEN MESIN"}
            </span>
          </Abs>
        </Abs>
      )}
    </Abs>
  );
}

function Scene3({ line }: { line: number }) {
  const [shown, setShown] = useState(0);
  const [hl, setHl] = useState(-1);

  useEffect(() => {
    if (line < 1) return;
    const t = [window.setTimeout(() => setShown(1), 300), window.setTimeout(() => setShown(2), 2800), window.setTimeout(() => setShown(3), 5300)];
    return () => t.forEach(window.clearTimeout);
  }, [line >= 1]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (line < 2) {
      setHl(-1);
      return;
    }
    setHl(0);
    const a = window.setTimeout(() => setHl(1), 2400);
    const b = window.setTimeout(() => setHl(2), 4800);
    const c = window.setTimeout(() => setHl(-1), 7200);
    return () => [a, b, c].forEach(window.clearTimeout);
  }, [line >= 2]); // eslint-disable-line react-hooks/exhaustive-deps

  const alat = [
    { nama: "JANGKA SORONG", fungsi: "Mengukur diameter dan kedalaman.", chip: "Ketelitian 0,05 mm", svg: <CaliperSvg /> },
    { nama: "MIKROMETER", fungsi: "Mengukur dimensi dengan ketelitian tinggi.", chip: "Ketelitian 0,01 mm", svg: <MicrometerSvg /> },
    { nama: "AVOMETER", fungsi: "Mengukur arus, tegangan, dan hambatan.", chip: "Ampere · Volt · Ohm", svg: <AvometerSvg /> },
  ];

  return (
    <Abs style={{ inset: 0 }}>
      <Bengkel animation="op-drift3 12s ease-out both" dim={0.66} blur={5} />
      <Abs style={{ inset: 0, background: "linear-gradient(120deg, rgba(11,31,75,.55), rgba(6,15,43,.2))" }} />

      <Mekanik height={900} style={{ left: 10, bottom: -40, animation: "op-char-left 1.1s cubic-bezier(.16,.9,.3,1) .3s both" }} animation="op-nod 4.2s ease-in-out 1.6s infinite" />

      {line >= 0 && (
        <Abs className="op-fade-up" style={{ left: 930, top: 62, width: 900, textAlign: "right", animationDelay: ".3s" }}>
          <div className="op-display" style={{ fontWeight: 900, fontSize: 56, lineHeight: 1.06 }}>
            MENGENAL <span style={{ color: RED }}>ALAT UKUR</span> OTOMOTIF
          </div>
        </Abs>
      )}

      {/* Panah ke meja kerja */}
      <Abs style={{ left: 800, top: 520, animation: "op-arrow 1.4s ease-in-out infinite", fontSize: 70, color: RED, fontWeight: 900, zIndex: 12 }} className="op-display">
        ➜
      </Abs>

      {/* Meja kerja + alat */}
      <Abs style={{ left: 900, top: 215, width: 960 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 36 }}>
          {alat.map((a, i) => {
            const visible = shown > i;
            const active = hl === i;
            return (
              <div
                key={a.nama}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? (active ? "translateY(-14px) scale(1.1)" : hl >= 0 ? "scale(.95)" : "none") : "translateY(60px) scale(.7)",
                  transition: "transform .7s cubic-bezier(.2,.9,.3,1.15), opacity .5s ease, box-shadow .5s",
                  background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(220,228,245,.92))",
                  color: NAVY,
                  borderRadius: 26,
                  padding: "26px 22px 28px",
                  borderBottom: `8px solid ${RED}`,
                  boxShadow: active ? "0 30px 60px rgba(0,0,0,.55), 0 0 0 4px rgba(228,40,45,.8)" : "0 20px 40px rgba(0,0,0,.45)",
                  zIndex: active ? 5 : 1,
                  position: "relative",
                }}
              >
                <div style={{ height: 175, display: "grid", placeItems: "center" }}>{visible && a.svg}</div>
                <div className="op-display" style={{ marginTop: 22, fontWeight: 900, fontSize: 30, lineHeight: 1.1 }}>{a.nama}</div>
                <div style={{ marginTop: 10, fontSize: 22, lineHeight: 1.35, fontWeight: 500, color: "#34405a", minHeight: 90 }}>{a.fungsi}</div>
                <div style={{ marginTop: 10, display: "inline-block", background: NAVY, color: "#fff", borderRadius: 999, padding: "6px 16px", fontSize: 18, fontWeight: 600 }}>{a.chip}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 26, height: 22, borderRadius: 8, background: "linear-gradient(180deg,#e7b772,#c48b45)", boxShadow: "0 26px 40px rgba(0,0,0,.5)" }} />
        <div style={{ height: 70, margin: "0 28px", background: "linear-gradient(180deg,#1a2540,#0b1226)", borderRadius: "0 0 14px 14px" }} />
      </Abs>
    </Abs>
  );
}

function Scene4({ line, onStart }: { line: number; onStart: () => void }) {
  return (
    <Abs style={{ inset: 0 }}>
      <Bengkel animation="op-slow-zoom 20s linear both" dim={0.42} blur={2} />
      <Abs style={{ inset: 0, background: "radial-gradient(ellipse at 40% 40%, rgba(26,58,124,.4), rgba(6,15,43,.55))" }} />

      {/* Layar digital besar */}
      <Abs
        style={{
          left: 110,
          top: 110,
          width: 1190,
          height: 530,
          borderRadius: 30,
          overflow: "hidden",
          background: "linear-gradient(135deg, #0b1f4b, #12295f 60%, #1a3a7c)",
          border: "8px solid #1b2a52",
          boxShadow: "0 0 0 3px rgba(127,160,236,.6), 0 0 90px rgba(59,99,201,.7), 0 40px 80px rgba(0,0,0,.6)",
          transformOrigin: "50% 50%",
          animation: "op-screen-on 1.1s cubic-bezier(.2,.8,.2,1) .5s both",
        }}
      >
        <Abs style={{ inset: 0, opacity: 0.18, backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)", backgroundSize: "54px 54px" }} />
        <Abs style={{ left: 0, right: 0, height: 140, background: "linear-gradient(180deg, transparent, rgba(127,160,236,.22), transparent)", animation: "op-scan 4s linear infinite" }} />
        <Abs style={{ right: -60, top: -60, opacity: 1 }}>
          <Gear size={420} stroke="rgba(228,40,45,.28)" speed={50} />
        </Abs>
        <Abs style={{ left: 70, top: 62, width: 760 }}>
          <div className="op-display" style={{ fontWeight: 800, fontSize: 28, color: STEEL, letterSpacing: ".06em" }}>LAB MAYA</div>
          <div className="op-display" style={{ marginTop: 10, fontWeight: 900, fontSize: 92, lineHeight: 1.02, textShadow: "0 6px 24px rgba(0,0,0,.5)" }}>
            ALAT UKUR<br />
            <span style={{ color: RED }}>OTOMOTIF</span>
          </div>
          <div style={{ marginTop: 26, height: 6, width: 360, borderRadius: 6, background: `linear-gradient(90deg, ${RED}, ${STEEL})` }} />
          <div style={{ marginTop: 22, fontSize: 28, color: STEEL, fontWeight: 500 }}>Laboratorium Virtual Teknik Otomotif</div>
        </Abs>
        <Abs style={{ left: 70, bottom: 18, display: "flex", gap: 22 }}>
          {[<CaliperSvg key="c" />, <MicrometerSvg key="m" />, <AvometerSvg key="a" />].map((el, i) => (
            <div key={i} className="op-pop" style={{ width: 128, animationDelay: `${1.5 + i * 0.25}s`, filter: "drop-shadow(0 6px 10px rgba(0,0,0,.4))" }}>
              {el}
            </div>
          ))}
        </Abs>
      </Abs>

      {/* Mekanik di tengah bengkel */}
      <Mekanik height={880} style={{ left: 1000, bottom: -40, animation: "op-char-up 1.1s cubic-bezier(.16,.9,.3,1) .2s both" }} animation="op-nod 4.2s ease-in-out 1.5s infinite" />
      <Bubble tail="left" style={{ left: 1010, top: 450 }} delay={1.2}>
        <span style={{ fontSize: 62, display: "inline-block", animation: "op-wave 1.6s ease-in-out 1.6s 2" }}>👍</span>
      </Bubble>

      {/* Ajakan & tombol */}
      <Abs className="op-fade-up" style={{ left: 120, top: 676, animationDelay: "1.8s" }}>
        <div className="op-display" style={{ fontWeight: 900, fontSize: 44, textShadow: "0 4px 16px rgba(0,0,0,.6)" }}>SIAP UNTUK BELAJAR?</div>
      </Abs>
      {line >= 2 && (
        <Abs className="op-pop" style={{ left: 120, top: 750, zIndex: 25 }}>
          <button
            id="op-start"
            className="op-btn lm-start"
            onClick={onStart}
            style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "28px 58px",
              borderRadius: 26,
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: ".02em",
              color: "#fff",
              background: `linear-gradient(135deg, #f0383d, ${RED} 45%, #b81c21)`,
              animation: "op-pulse 1.8s ease-out infinite",
              borderBottom: "8px solid #8f1217",
            }}
          >
            <span style={{ fontSize: 40 }}>▶</span>
            <span>MULAI PEMBELAJARAN</span>
            <span style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "22%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)", animation: "op-sheen 2.6s ease-in-out infinite" }} />
          </button>
        </Abs>
      )}
    </Abs>
  );
}

function Splash({ onPlay, onSkip }: { onPlay: () => void; onSkip: () => void }) {
  return (
    <Abs style={{ inset: 0 }}>
      <Bengkel animation="op-slow-zoom 30s linear both" dim={0.55} blur={3} />
      <Abs style={{ inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(26,58,124,.35), rgba(6,15,43,.85))" }} />
      <Abs style={{ left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div className="op-fade-up" style={{ transform: "perspective(1400px) rotateX(4deg)" }}>
          <div className="op-display" style={{ display: "inline-block", background: RED, borderRadius: 14, padding: "10px 26px", fontWeight: 800, fontSize: 30, letterSpacing: ".06em" }}>
            LABORATORIUM VIRTUAL TEKNIK OTOMOTIF
          </div>
          <div style={{ marginTop: 30 }}>
            <Wordmark size={250} />
          </div>
        </div>
        <div className="op-fade-up" style={{ marginTop: 40, fontSize: 40, fontWeight: 600, color: STEEL, animationDelay: ".4s" }}>
          Belajar&nbsp;•&nbsp;Mencoba&nbsp;•&nbsp;Kompeten
        </div>
        <div className="op-pop" style={{ marginTop: 80, animationDelay: ".8s", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <button
            className="op-btn"
            onClick={onPlay}
            autoFocus
            style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 20, padding: "26px 60px", borderRadius: 26, fontSize: 40, fontWeight: 900, color: "#fff", background: `linear-gradient(135deg, #f0383d, ${RED} 45%, #b81c21)`, borderBottom: "8px solid #8f1217", animation: "op-pulse 1.8s ease-out infinite" }}
          >
            <span>▶</span>
            <span>PUTAR OPENING</span>
            <span style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "22%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)", animation: "op-sheen 2.6s ease-in-out infinite" }} />
          </button>
          <button className="op-btn" onClick={onSkip} style={{ background: "transparent", color: STEEL, fontSize: 26, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 6 }}>
            Lewati, langsung ke lab
          </button>
          <div style={{ fontSize: 22, color: "#8e99ae" }}>🔊 Aktifkan suara perangkat untuk pengalaman terbaik</div>
        </div>
      </Abs>
    </Abs>
  );
}

/* ───────── Pengendali utama ───────── */
function useStageScale() {
  const [s, setS] = useState(1);
  useEffect(() => {
    const f = () => setS(Math.min(window.innerWidth / W, window.innerHeight / H));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return s;
}

export default function Opening({ onDone }: { onDone: () => void }) {
  const scale = useStageScale();
  const [scene, setScene] = useState<SceneId>(0);
  const [line, setLine] = useState(-1);
  const [voiceOn, setVoiceOn] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const voiceRef = useRef(true);
  const music = useRef<TechMusic | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    // pemanasan daftar suara
    if (typeof speechSynthesis !== "undefined") speechSynthesis.getVoices();
    return () => {
      stopSpeech();
      music.current?.stop(0.3);
    };
  }, []);

  // Alur narasi per adegan
  useEffect(() => {
    if (scene === 0) return;
    let cancelled = false;
    setLine(-1);
    const lines = SCENES[scene as 1 | 2 | 3 | 4];
    (async () => {
      await sleep(scene === 1 ? 2800 : 1400);
      for (let i = 0; i < lines.length; i++) {
        if (cancelled) return;
        setLine(i);
        music.current?.duck(voiceRef.current);
        await speak(lines[i], { audioSrc: NARASI_AUDIO[`${scene}-${i}`], voiceOn: () => voiceRef.current });
        if (cancelled) return;
        await sleep(400);
      }
      music.current?.duck(false);
      if (scene < 4) {
        await sleep(700);
        if (!cancelled) setScene((scene + 1) as SceneId);
      }
    })();
    return () => {
      cancelled = true;
      stopSpeech();
    };
  }, [scene]);

  const startMusic = () => {
    if (!music.current) music.current = new TechMusic();
    music.current.start();
  };

  const play = () => {
    if (voiceRef.current) startMusic();
    setScene(1);
  };

  const finish = (withZoom: boolean) => {
    if (finished.current) return;
    finished.current = true;
    stopSpeech();
    music.current?.stop(withZoom ? 1.2 : 0.4);
    music.current = null;
    if (withZoom) {
      setLeaving(true);
      window.setTimeout(onDone, 950);
    } else {
      onDone();
    }
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    voiceRef.current = next;
    if (next) {
      if (scene !== 0) startMusic();
    } else {
      stopSpeech();
      music.current?.stop(0.3);
      music.current = null;
    }
  };

  const corner = scene >= 2 || (scene === 1 && line >= 2);

  return (
    <div className="op-root" style={{ position: "fixed", inset: 0, zIndex: 100, background: NAVY_DEEP, overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* Panggung 1920×1080 diskalakan agar selalu 16:9 */}
      <div style={{ position: "absolute", left: "50%", top: "50%", width: W, height: H, transform: `translate(-50%,-50%) scale(${scale})`, overflow: "hidden", background: NAVY }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "540px 807px",
            transition: "transform .95s cubic-bezier(.7,0,.9,.4), opacity .95s ease-in",
            transform: leaving ? "scale(11)" : "none",
            opacity: leaving ? 0 : 1,
          }}
        >
          {scene === 0 && <Splash onPlay={play} onSkip={() => finish(false)} />}
          {scene !== 0 && (
            <div key={scene} className="op-fade-up" style={{ position: "absolute", inset: 0, animationDuration: ".5s", animationName: "op-fade" }}>
              {scene === 1 && <Scene1 line={line} />}
              {scene === 2 && <Scene2 line={line} />}
              {scene === 3 && <Scene3 line={line} />}
              {scene === 4 && <Scene4 line={line} onStart={() => finish(true)} />}
            </div>
          )}
          {corner && <CornerBadge delay={scene === 1 ? 0.9 : 0} />}

          {/* Transisi slide: dua pita miring merah & navy */}
          {scene !== 0 && (
            <div key={`w${scene}`} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 40 }}>
              <div style={{ position: "absolute", top: -50, bottom: -50, left: "-20%", width: "140%", background: RED, animation: "op-wipe .95s cubic-bezier(.7,0,.3,1) both" }} />
              <div style={{ position: "absolute", top: -50, bottom: -50, left: "-20%", width: "140%", background: NAVY, animation: "op-wipe .95s cubic-bezier(.7,0,.3,1) .12s both" }} />
            </div>
          )}

          {/* Subtitle */}
          {scene !== 0 && line >= 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", zIndex: 30, pointerEvents: "none" }}>
              <div
                key={`${scene}-${line}`}
                className="op-display"
                style={{
                  maxWidth: 1500,
                  textAlign: "center",
                  padding: "18px 40px",
                  borderRadius: 22,
                  background: "rgba(6,15,43,.78)",
                  border: "1px solid rgba(255,255,255,.14)",
                  backdropFilter: "blur(8px)",
                  fontWeight: 700,
                  fontSize: 36,
                  lineHeight: 1.35,
                  boxShadow: "0 16px 40px rgba(0,0,0,.4)",
                  animation: "op-sub .45s ease both",
                }}
              >
                {SCENES[scene as 1 | 2 | 3 | 4][line]}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kontrol (di luar panggung agar tetap terbaca di layar kecil) */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 120, display: "flex", gap: 8 }}>
        <button className="op-ctrl" onClick={toggleVoice} aria-pressed={voiceOn}>
          {voiceOn ? "🔊 Suara aktif" : "🔇 Suara mati"}
        </button>
        {scene !== 0 && (
          <button className="op-ctrl" onClick={() => finish(false)}>
            Lewati ⏭
          </button>
        )}
      </div>
      {scene !== 0 && (
        <div style={{ position: "fixed", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, zIndex: 120, pointerEvents: "none" }}>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} style={{ width: i === scene ? 34 : 14, height: 6, borderRadius: 6, background: i <= scene ? RED : "rgba(255,255,255,.3)", transition: "all .4s" }} />
          ))}
        </div>
      )}
    </div>
  );
}
