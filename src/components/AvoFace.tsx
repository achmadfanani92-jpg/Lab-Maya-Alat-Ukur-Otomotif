import type { ReactNode } from "react";
import { OHM_LABELS, OHM_TICKS, SELECTORS, scaleOf, ohmF, type Func, type ScaleKey } from "./avoLogic";

const CX = 230;
const CY = 345;
const AMAX = 42;
const rad = (d: number) => (d * Math.PI) / 180;
const polar = (r: number, deg: number): [number, number] => [CX + r * Math.sin(rad(deg)), CY - r * Math.cos(rad(deg))];
const angOf = (f: number) => -AMAX + 2 * AMAX * f;
const arc = (r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
};

const GROUP_COLOR: Record<Func, string> = {
  OFF: "#e5e7eb",
  DCV: "#38bdf8",
  ACV: "#f87171",
  DCA: "#4ade80",
  OHM: "#fbbf24",
};
const GROUP_NAME: Record<Func, string> = { OFF: "", DCV: "DC V", ACV: "AC V", DCA: "DC mA", OHM: "Ω" };

function LinearScale({ fs, r, active, label }: { fs: number; r: number; active: boolean; label: string }) {
  const col = active ? "#1d4ed8" : "#111827";
  const items: ReactNode[] = [];
  for (let i = 0; i <= 50; i++) {
    const ang = angOf(i / 50);
    const len = i % 10 === 0 ? 13 : i % 5 === 0 ? 9 : 5.5;
    const [x1, y1] = polar(r, ang);
    const [x2, y2] = polar(r - len, ang);
    items.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={i % 10 === 0 ? 1.8 : 1} />);
    if (i % 10 === 0) {
      const [tx, ty] = polar(r - 25, ang);
      items.push(
        <text key={`t${i}`} x={tx} y={ty + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={col}>
          {Number(((fs * i) / 50).toFixed(1))}
        </text>,
      );
    }
  }
  const [lx, ly] = polar(r + 2, AMAX + 5.5);
  return (
    <g>
      {active && <path d={arc(r - 15, -AMAX - 2, AMAX + 2)} stroke="#3b82f6" strokeOpacity={0.14} strokeWidth={34} fill="none" />}
      <path d={arc(r, -AMAX, AMAX)} stroke={col} strokeWidth={1.8} fill="none" />
      {items}
      <text x={lx} y={ly} fontSize={9} fill={col} textAnchor="start" fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

function OhmScale({ r, active }: { r: number; active: boolean }) {
  const col = active ? "#b91c1c" : "#991b1b";
  const items: ReactNode[] = [];
  OHM_TICKS.forEach((v) => {
    const ang = angOf(ohmF(v));
    const major = OHM_LABELS.includes(v);
    const [x1, y1] = polar(r, ang);
    const [x2, y2] = polar(r - (major ? 13 : 7), ang);
    items.push(<line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={major ? 1.8 : 1} />);
    if (major) {
      const [tx, ty] = polar(r - 25, ang);
      items.push(
        <text key={`t${v}`} x={tx} y={ty + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={col}>
          {v}
        </text>,
      );
    }
  });
  const [ix, iy] = polar(r - 25, -AMAX - 0.5);
  return (
    <g>
      {active && <path d={arc(r - 15, -AMAX - 2, AMAX + 2)} stroke="#ef4444" strokeOpacity={0.14} strokeWidth={34} fill="none" />}
      <path d={arc(r, -AMAX, AMAX)} stroke={col} strokeWidth={1.8} fill="none" />
      {items}
      <text x={ix - 4} y={iy + 5} fontSize={20} fontWeight={700} fill={col} textAnchor="middle">
        ∞
      </text>
      <text x={polar(r + 2, AMAX + 5.5)[0]} y={polar(r + 2, AMAX + 5.5)[1]} fontSize={11} fill={col} fontWeight={700}>
        Ω
      </text>
    </g>
  );
}

export default function AvoFace({
  selIdx,
  f,
  adj,
  highlight,
  onSelect,
  redLabel,
  blackLabel,
  blown,
}: {
  selIdx: number;
  f: number;
  adj: number;
  highlight: boolean;
  onSelect?: (i: number) => void;
  redLabel?: string;
  blackLabel?: string;
  blown?: boolean;
}) {
  const sel = SELECTORS[selIdx];
  const sc = scaleOf(sel);
  const key: ScaleKey | null = sc ? sc.key : null;
  const hl = (k: ScaleKey) => highlight && key === k;
  const needleDeg = angOf(f);
  const knobAng = (i: number) => -112.5 + 15 * i;
  const KX = 230;
  const KY = 462;
  const kp = (r: number, deg: number): [number, number] => [KX + r * Math.sin(rad(deg)), KY - r * Math.cos(rad(deg))];

  const groups: { func: Func; from: number; to: number }[] = [
    { func: "DCV", from: 1, to: 5 },
    { func: "ACV", from: 6, to: 9 },
    { func: "DCA", from: 10, to: 12 },
    { func: "OHM", from: 13, to: 15 },
  ];

  return (
    <svg viewBox="0 0 460 612" className="mx-auto w-full max-w-[460px] select-none drop-shadow-xl">
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#374151" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="dialbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffbea" />
          <stop offset="1" stopColor="#f3ead0" />
        </linearGradient>
        <radialGradient id="cap" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#6b7280" />
          <stop offset="1" stopColor="#111827" />
        </radialGradient>
        <clipPath id="win">
          <rect x={14} y={18} width={432} height={286} rx={12} />
        </clipPath>
      </defs>

      <rect x={2} y={2} width={456} height={608} rx={30} fill="url(#body)" stroke="#030712" strokeWidth={2} />
      <rect x={8} y={10} width={444} height={300} rx={18} fill="#030712" />

      {/* Jendela dial */}
      <g clipPath="url(#win)">
        <rect x={14} y={18} width={432} height={286} fill="url(#dialbg)" />
        <OhmScale r={270} active={hl("OHM")} />
        <LinearScale fs={250} r={228} active={hl("S250")} label="250" />
        <LinearScale fs={50} r={190} active={hl("S50")} label="50" />
        <LinearScale fs={10} r={152} active={hl("S10")} label="10" />
        <text x={CX} y={268} textAnchor="middle" fontSize={11} fontWeight={800} fill="#334155" letterSpacing={2}>
          AVOMETER
        </text>
        <text x={CX} y={282} textAnchor="middle" fontSize={8} fill="#64748b">
          Ω · DC/AC V · DC mA
        </text>
        {/* Jarum */}
        <g
          style={{
            transform: `rotate(${needleDeg}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: "transform 1s cubic-bezier(0.3,1.5,0.5,1)",
          }}
        >
          <line x1={CX + 3} y1={CY + 10} x2={CX + 3} y2={CY - 283} stroke="#000" strokeOpacity={0.15} strokeWidth={2.5} />
          <line x1={CX} y1={CY + 12} x2={CX} y2={CY - 285} stroke="#dc2626" strokeWidth={2} strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r={12} fill="#1f2937" />
        <path d="M 14 18 L 250 18 L 120 304 L 14 304 Z" fill="#fff" opacity={0.12} />
      </g>

      {/* Sekrup nol mekanik */}
      <circle cx={CX} cy={322} r={4} fill="#9ca3af" opacity={0.0} />

      {/* Knob 0 Ω ADJ */}
      <g>
        <circle cx={50} cy={350} r={22} fill="url(#cap)" stroke="#000" />
        <g transform={`rotate(${(adj - 50) * 3.2} 50 350)`}>
          <line x1={50} y1={350} x2={50} y2={332} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
        </g>
        <text x={50} y={390} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fbbf24">
          0 Ω ADJ
        </text>
      </g>

      {/* Selektor */}
      <circle cx={KX} cy={KY} r={70} fill="#0b1220" />
      {groups.map((g) => {
        const a0 = knobAng(g.from) - 6;
        const a1 = knobAng(g.to) + 6;
        const [x0, y0] = kp(112, a0);
        const [x1, y1] = kp(112, a1);
        const mid = kp(130, (a0 + a1) / 2);
        return (
          <g key={g.func}>
            <path d={`M ${x0} ${y0} A 112 112 0 0 1 ${x1} ${y1}`} stroke={GROUP_COLOR[g.func]} strokeWidth={3} fill="none" />
            <text x={mid[0]} y={mid[1] + 4} textAnchor="middle" fontSize={12} fontWeight={800} fill={GROUP_COLOR[g.func]}>
              {GROUP_NAME[g.func]}
            </text>
          </g>
        );
      })}
      {SELECTORS.map((s, i) => {
        const [x, y] = kp(93, knobAng(i));
        const active = i === selIdx;
        const c = GROUP_COLOR[s.func];
        return (
          <g key={i} onClick={() => onSelect?.(i)} style={{ cursor: onSelect ? "pointer" : "default" }}>
            <circle cx={x} cy={y} r={13.5} fill={active ? c : "transparent"} opacity={active ? 0.95 : 1} />
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize={s.label.length > 3 ? 9 : 10.5} fontWeight={700} fill={active ? "#0b1220" : c}>
              {s.label}
            </text>
          </g>
        );
      })}
      <g style={{ transform: `rotate(${knobAng(selIdx)}deg)`, transformOrigin: `${KX}px ${KY}px`, transition: "transform .35s cubic-bezier(.3,1.4,.5,1)" }}>
        <circle cx={KX} cy={KY} r={50} fill="url(#cap)" stroke="#000" strokeWidth={1.5} />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = i * 15;
          const [x1, y1] = kp(46, a);
          const [x2, y2] = kp(50, a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9ca3af" strokeWidth={1.5} />;
        })}
        <path d={`M ${KX} ${KY - 48} L ${KX - 8} ${KY - 24} L ${KX + 8} ${KY - 24} Z`} fill="#f9fafb" />
        <circle cx={KX} cy={KY} r={14} fill="#1f2937" stroke="#4b5563" />
      </g>

      {/* Jack probe */}
      <g>
        <circle cx={140} cy={566} r={17} fill="#7f1d1d" stroke="#000" />
        <circle cx={140} cy={566} r={9} fill="#dc2626" />
        <text x={140} y={598} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fca5a5">
          + (merah)
        </text>
        <text x={140} y={540} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fca5a5">
          {redLabel ?? ""}
        </text>
        <circle cx={320} cy={566} r={17} fill="#000" stroke="#4b5563" />
        <circle cx={320} cy={566} r={9} fill="#374151" />
        <text x={320} y={598} textAnchor="middle" fontSize={11} fontWeight={700} fill="#d1d5db">
          COM (hitam)
        </text>
        <text x={320} y={540} textAnchor="middle" fontSize={11} fontWeight={700} fill="#d1d5db">
          {blackLabel ?? ""}
        </text>
      </g>

      {blown && (
        <g>
          <rect x={14} y={18} width={432} height={286} rx={12} fill="#7f1d1d" opacity={0.75} />
          <text x={CX} y={150} textAnchor="middle" fontSize={26} fontWeight={800} fill="#fff">
            SEKERING PUTUS
          </text>
        </g>
      )}
    </svg>
  );
}
