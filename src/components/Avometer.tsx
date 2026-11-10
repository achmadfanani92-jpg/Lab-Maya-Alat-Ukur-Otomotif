import { useEffect, useMemo, useState } from "react";
import AvoFace from "./AvoFace";
import {
  EXP_INFO,
  FUNC_NAME,
  OHM_TICKS,
  SELECTORS,
  makeExperiment,
  measure,
  ohmF,
  scaleOf,
  tolerance,
  unitOf,
  type ExpType,
  type Experiment,
} from "./avoLogic";
import { AnswerPanel, Btn, Card, Steps, SubTabs, Toggle } from "./ui";
import { cn } from "../utils/cn";

const TERM_NAMES: Record<ExpType, Record<number, string>> = {
  dcv: { 1: "A", 2: "B", 0: "C" },
  acv: { 1: "L", 0: "N" },
  ohm: { 0: "a", 1: "b", 2: "c", 3: "d" },
  dca: { 1: "C", 2: "A", 3: "B", 0: "D" },
};

const fmtN = (v: number, d = 2) => {
  if (!Number.isFinite(v)) return "∞";
  const s = Number(v.toFixed(d)).toString();
  return s.replace(".", ",");
};

/* ====== Papan percobaan ====== */
function Term({
  x,
  y,
  id,
  name,
  red,
  black,
  onPick,
  dy = -20,
}: {
  x: number;
  y: number;
  id: number;
  name: string;
  red: number | null;
  black: number | null;
  onPick: (id: number) => void;
  dy?: number;
}) {
  return (
    <g onClick={() => onPick(id)} className="cursor-pointer">
      <circle cx={x} cy={y} r={20} fill="transparent" />
      {black === id && <circle cx={x} cy={y} r={15} fill="none" stroke="#0f172a" strokeWidth={4} />}
      {red === id && <circle cx={x} cy={y} r={11} fill="none" stroke="#ef4444" strokeWidth={4} />}
      <circle cx={x} cy={y} r={6.5} fill="#f59e0b" stroke="#92400e" strokeWidth={2} />
      <text x={x} y={y + dy} textAnchor="middle" fontSize={15} fontWeight={800} fill="#1e293b">
        {name}
      </text>
    </g>
  );
}

function Resistor({ x1, x2, y, label, sub }: { x1: number; x2: number; y: number; label: string; sub?: string }) {
  const w = x2 - x1 - 24;
  const pts: [number, number][] = [
    [x1, y],
    [x1 + 12, y],
  ];
  for (let i = 0; i < 6; i++) pts.push([x1 + 12 + (w / 6) * (i + 0.5), y + (i % 2 ? 9 : -9)]);
  pts.push([x2 - 12, y], [x2, y]);
  return (
    <g>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#334155" strokeWidth={3} strokeLinejoin="round" />
      <text x={(x1 + x2) / 2} y={y - 18} textAnchor="middle" fontSize={13} fontWeight={700} fill="#334155">
        {label}
      </text>
      {sub && (
        <text x={(x1 + x2) / 2} y={y + 30} textAnchor="middle" fontSize={12} fill="#64748b">
          {sub}
        </text>
      )}
    </g>
  );
}

function Wire({ d }: { d: string }) {
  return <path d={d} fill="none" stroke="#475569" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />;
}

function Battery({ x, y1, y2, label }: { x: number; y1: number; y2: number; label: string }) {
  const mid = (y1 + y2) / 2;
  return (
    <g>
      <Wire d={`M ${x} ${y2} L ${x} ${mid + 10}`} />
      <Wire d={`M ${x} ${mid - 10} L ${x} ${y1}`} />
      <line x1={x - 20} x2={x + 20} y1={mid - 10} y2={mid - 10} stroke="#334155" strokeWidth={4} />
      <line x1={x - 11} x2={x + 11} y1={mid + 10} y2={mid + 10} stroke="#334155" strokeWidth={7} />
      <text x={x - 28} y={mid - 14} textAnchor="end" fontSize={16} fontWeight={800} fill="#dc2626">+</text>
      <text x={x - 28} y={mid + 18} textAnchor="end" fontSize={18} fontWeight={800} fill="#0f172a">−</text>
      <text x={x + 28} y={mid + 5} fontSize={13} fontWeight={700} fill="#334155">{label}</text>
    </g>
  );
}

function Board({
  exp,
  red,
  black,
  onPick,
  reveal,
}: {
  exp: Experiment;
  red: number | null;
  black: number | null;
  onPick: (id: number) => void;
  reveal: boolean;
}) {
  const p = exp.params;
  const nm = TERM_NAMES[exp.type];
  const T = (x: number, y: number, id: number, dy?: number) => (
    <Term x={x} y={y} id={id} name={nm[id]} red={red} black={black} onPick={onPick} dy={dy} />
  );
  return (
    <svg viewBox="0 0 540 290" className="mx-auto max-h-[400px] w-full rounded-xl bg-emerald-50 ring-1 ring-emerald-200">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#a7f3d0" strokeWidth={0.6} />
        </pattern>
      </defs>
      <rect width={540} height={290} fill="url(#grid)" />

      {exp.type === "dcv" && (
        <g>
          <Wire d="M 60 80 L 150 80 M 250 80 L 350 80 M 450 80 L 500 80 L 500 240 L 60 240" />
          <Battery x={60} y1={80} y2={240} label={`E = ${fmtN(p.E!, 1)} V`} />
          <Resistor x1={150} x2={250} y={80} label="R₁" sub={`${p.R1} Ω`} />
          <Resistor x1={350} x2={450} y={80} label="R₂" sub={`${p.R2} Ω`} />
          <Wire d="M 250 80 L 350 80" />
          {T(110, 80, 1)}
          {T(300, 80, 2)}
          {T(280, 240, 0, 26)}
        </g>
      )}

      {exp.type === "acv" && (
        <g>
          <Wire d="M 80 126 L 80 80 L 400 80 L 400 130 M 400 190 L 400 240 L 80 240 L 80 194" />
          <circle cx={80} cy={160} r={34} fill="#fff" stroke="#334155" strokeWidth={3} />
          <text x={80} y={172} textAnchor="middle" fontSize={34} fontWeight={700} fill="#334155">~</text>
          <text x={80} y={212} textAnchor="middle" fontSize={0} />
          <text x={125} y={165} fontSize={13} fontWeight={700} fill="#334155">
            {(p.Vac ?? 0) >= 100 ? "Stopkontak PLN" : "Trafo"}
          </text>
          <text x={125} y={182} fontSize={13} fontWeight={700} fill="#b45309">{p.Vac} V AC</text>
          <circle cx={400} cy={160} r={30} fill="#fef08a" stroke="#334155" strokeWidth={3} />
          <path d="M 380 140 L 420 180 M 420 140 L 380 180" stroke="#334155" strokeWidth={3} />
          <text x={445} y={165} fontSize={13} fontWeight={700} fill="#334155">Lampu</text>
          {T(220, 80, 1)}
          {T(220, 240, 0, 28)}
        </g>
      )}

      {exp.type === "ohm" && (
        <g>
          <Resistor x1={80} x2={200} y={150} label="R₁" sub={reveal ? `${(exp.els[0] as { r: number }).r} Ω` : "?"} />
          <Resistor x1={200} x2={320} y={150} label="R₂" sub={reveal ? `${(exp.els[1] as { r: number }).r} Ω` : "?"} />
          <Resistor x1={320} x2={440} y={150} label="R₃" sub={reveal ? `${(exp.els[2] as { r: number }).r} Ω` : "?"} />
          <text x={270} y={260} textAnchor="middle" fontSize={12} fill="#64748b">
            Rangkaian tanpa sumber tegangan (aman untuk diukur hambatannya)
          </text>
          {T(80, 150, 0, -34)}
          {T(200, 150, 1, -34)}
          {T(320, 150, 2, -34)}
          {T(440, 150, 3, -34)}
        </g>
      )}

      {exp.type === "dca" && (
        <g>
          <Wire d="M 60 80 L 150 80 M 240 80 L 275 80 M 345 80 L 380 80 M 470 80 L 505 80 L 505 240 L 60 240" />
          <Battery x={60} y1={80} y2={240} label={`E = ${p.E} V`} />
          <Resistor x1={150} x2={240} y={80} label="R₁" sub={`${p.R1} Ω`} />
          <Resistor x1={380} x2={470} y={80} label="R₂ (lampu)" sub={`${p.R2} Ω`} />
          <path d="M 275 80 L 345 80" stroke="#f43f5e" strokeWidth={3} strokeDasharray="5 5" />
          <text x={310} y={118} textAnchor="middle" fontSize={11} fontWeight={700} fill="#e11d48">celah (terbuka)</text>
          {T(110, 80, 1)}
          {T(275, 80, 2)}
          {T(345, 80, 3)}
          {T(280, 240, 0, 26)}
        </g>
      )}
    </svg>
  );
}

/* ====== Materi ====== */
function Materi() {
  const rows = [
    ["DC V", "2,5", "0–250", "pembacaan × 2,5 ÷ 250"],
    ["DC V", "10", "0–10", "dibaca langsung"],
    ["DC V", "50", "0–50", "dibaca langsung"],
    ["DC V", "250", "0–250", "dibaca langsung"],
    ["DC V", "1000", "0–10", "pembacaan × 100"],
    ["AC V", "10 / 50 / 250 / 1000", "0–10 / 0–50 / 0–250 / 0–10", "sama seperti DC V"],
    ["DC mA", "2,5 / 25 / 250", "0–250", "× 0,01 / × 0,1 / × 1"],
    ["Ω", "×1 / ×10 / ×1k", "skala Ω (merah)", "pembacaan × pengali"],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Apa itu avometer?" icon="🧭">
        <p className="text-sm leading-relaxed text-slate-700">
          Avometer (multimeter analog) adalah alat ukur serbaguna yang bisa mengukur <b>Ampere</b> (arus), <b>Volt</b>{" "}
          (tegangan) dan <b>Ohm</b> (hambatan). Nilai ditunjukkan oleh <b>jarum</b> pada beberapa skala.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {[
            ["Skala (dial)", "tempat jarum menunjuk; ada skala Ω, V/mA"],
            ["Selektor", "memilih fungsi (V, mA, Ω) dan batas ukur"],
            ["0 Ω ADJ", "mengatur nol saat kalibrasi ohmmeter"],
            ["Probe merah (+)", "dipasang ke titik berpotensial lebih tinggi"],
            ["Probe hitam (COM)", "dipasang ke titik berpotensial lebih rendah"],
            ["Sekering", "melindungi alat dari arus berlebih"],
          ].map(([a, b]) => (
            <div key={a} className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
              <div className="font-semibold text-sky-700">{a}</div>
              <div className="text-xs text-slate-600">{b}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-sky-50 p-3 text-sm text-slate-700 ring-1 ring-sky-200">
          <b>Rumus pembacaan:</b>
          <div className="mt-1 font-mono text-base">Nilai = (jarum ÷ skala maksimum) × batas ukur</div>
          <div className="mt-1 text-xs">
            Contoh: selektor DC V 10 V, jarum menunjuk 7,4 pada skala 0–10 → 7,4 ÷ 10 × 10 = 7,4 V. Selektor DC V 50 V,
            jarum menunjuk 30 pada skala 0–50 → 30 V. Selektor 2,5 V, jarum 180 pada skala 0–250 → 180 ÷ 250 × 2,5 = 1,8 V.
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card title="Langkah mengukur dengan aman" icon="🛡️">
          <Steps
            items={[
              <>Pilih <b>fungsi</b> sesuai besaran: tegangan DC/AC, arus, atau hambatan.</>,
              <>Mulai dari <b>batas ukur terbesar</b> bila nilai belum diketahui, lalu turunkan agar jarum menyimpang di sekitar ⅔ skala.</>,
              <><b>Voltmeter dipasang paralel</b> dengan komponen; <b>ampermeter dipasang seri</b> pada rangkaian.</>,
              <>Perhatikan <b>polaritas DC</b>: probe merah ke kutub (+), hitam ke kutub (−). Jarum ke kiri berarti terbalik.</>,
              <>Ohmmeter: <b>kalibrasi nol</b> (hubungkan kedua probe, putar 0 Ω ADJ sampai jarum di 0 Ω) setiap ganti pengali, dan ukur komponen <b>tanpa tegangan</b>.</>,
              <>Setelah selesai, kembalikan selektor ke <b>OFF</b>.</>,
            ]}
          />
        </Card>
        <Card title="Pemilihan skala" icon="📊">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-1 pr-2">Fungsi</th>
                  <th className="py-1 pr-2">Batas ukur</th>
                  <th className="py-1 pr-2">Skala dibaca</th>
                  <th className="py-1">Cara menghitung</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 text-slate-700">
                    {r.map((c, j) => (
                      <td key={j} className={cn("py-1 pr-2", j === 0 && "font-semibold text-sky-700")}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ====== Eksperimen ====== */
function randAdj() {
  return Math.random() < 0.5 ? 8 + Math.random() * 22 : 70 + Math.random() * 22;
}

function Eksperimen({ onAnswer }: { onAnswer: (ok: boolean) => void }) {
  const [type, setType] = useState<ExpType>("dcv");
  const [seed, setSeed] = useState(1);
  const exp = useMemo(() => makeExperiment(type), [type, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selIdx, setSelIdx] = useState(0);
  const [red, setRed] = useState<number | null>(null);
  const [black, setBlack] = useState<number | null>(null);
  const [active, setActive] = useState<"red" | "black">("red");
  const [adj, setAdj] = useState(randAdj);
  const [help, setHelp] = useState(true);
  const [truth, setTruth] = useState(false);
  const [blown, setBlown] = useState(false);

  const sel = SELECTORS[selIdx];
  const k = 0.75 + (adj / 100) * 0.5;
  const m = useMemo(() => measure(exp, red, black, sel, k), [exp, red, black, sel, k]);

  useEffect(() => {
    if (m.fuse) setBlown(true);
  }, [m.fuse]);

  const changeType = (t: ExpType) => {
    setType(t);
    setSeed((s) => s + 1);
    setRed(null);
    setBlack(null);
    setActive("red");
  };
  const regenerate = () => {
    setSeed((s) => s + 1);
    setRed(null);
    setBlack(null);
    setActive("red");
  };
  const pickTerm = (id: number) => {
    if (active === "red") {
      setRed(id);
      setActive("black");
    } else {
      setBlack(id);
      setActive("red");
    }
  };
  const changeSel = (i: number) => {
    setSelIdx(i);
    if (SELECTORS[i].func === "OHM" && (SELECTORS[selIdx].func !== "OHM" || SELECTORS[selIdx].range !== SELECTORS[i].range))
      setAdj(randAdj());
  };

  const f = blown ? 0 : m.f;
  const sc = scaleOf(sel);
  const names = TERM_NAMES[type];
  const unit = unitOf(sel.func);

  // Jawaban yang benar = pembacaan jarum
  let truthVal: number | null = null;
  let tol = 0;
  let validReading = false;
  if (!blown && m.ready && sc && m.value !== null && m.scaleReading !== null) {
    if (sel.func === "OHM") {
      if (Number.isFinite(m.scaleReading) && m.f > 0.01) {
        truthVal = m.scaleReading * sel.range;
        tol = Math.max(truthVal * 0.1, 0.3 * sel.range);
        validReading = true;
      }
    } else if (m.f >= -0.02 && m.f <= 1.0) {
      truthVal = (m.f * sel.range);
      tol = tolerance(sel, truthVal);
      validReading = true;
    }
  }
  const needleAt = m.scaleReading !== null && sc ? m.scaleReading : null;

  return (
    <div className="grid gap-4 xl:grid-cols-[460px_1fr_420px]">
      {/* Kolom alat */}
      <div className="space-y-4">
        <Card title="Avometer" icon="🧭">
          <AvoFace
            selIdx={selIdx}
            f={f}
            adj={adj}
            highlight={help}
            onSelect={changeSel}
            redLabel={red !== null ? `→ ${names[red]}` : "tidak terpasang"}
            blackLabel={black !== null ? `→ ${names[black]}` : "tidak terpasang"}
            blown={blown}
          />
          <div className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-center font-mono text-sm text-emerald-300">
            {sel.func === "OFF" ? "OFF" : `${FUNC_NAME[sel.func]} · ${sel.func === "OHM" ? "pengali " + sel.label : "batas ukur " + sel.label + " " + unit}`}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Btn onClick={() => changeSel((selIdx + SELECTORS.length - 1) % SELECTORS.length)}>↺ Putar kiri</Btn>
            <Btn onClick={() => changeSel((selIdx + 1) % SELECTORS.length)}>Putar kanan ↻</Btn>
            <Btn onClick={() => changeSel(0)}>OFF</Btn>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">Klik angka pada selektor untuk memilih fungsi & batas ukur.</p>
          {sel.func === "OHM" && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
              <div className="mb-1 text-sm font-bold text-amber-800">⚙️ Kalibrasi nol ohm (0 Ω ADJ)</div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.25}
                value={adj}
                onChange={(e) => setAdj(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
              <p className="text-xs text-amber-700">
                Hubungkan kedua probe pada <b>titik yang sama</b> (klik terminal yang sama untuk merah & hitam), lalu geser sampai jarum tepat di 0 Ω (kanan).
              </p>
            </div>
          )}
          {blown && (
            <Btn variant="danger" className="mt-3 w-full" onClick={() => setBlown(false)}>
              🔧 Ganti sekering
            </Btn>
          )}
        </Card>
      </div>

      {/* Kolom papan percobaan */}
      <div className="space-y-4">
        <Card title="Papan percobaan" icon="🔌">
          <div className="mb-3 flex flex-wrap gap-2">
            {(Object.keys(EXP_INFO) as ExpType[]).map((t) => (
              <button
                key={t}
                onClick={() => changeType(t)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition",
                  type === t ? "bg-sky-600 text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                )}
              >
                {EXP_INFO[t].title}
              </button>
            ))}
          </div>
          <p className="mb-3 text-sm text-slate-600">{EXP_INFO[type].desc}</p>
          <Board exp={exp} red={red} black={black} onPick={pickTerm} reveal={truth} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Pasang probe:</span>
            <button
              onClick={() => setActive("red")}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-bold ring-2 transition", active === "red" ? "bg-red-500 text-white ring-red-300" : "bg-red-50 text-red-700 ring-transparent")}
            >
              🔴 Merah (+): {red !== null ? names[red] : "–"}
            </button>
            <button
              onClick={() => setActive("black")}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-bold ring-2 transition", active === "black" ? "bg-slate-800 text-white ring-slate-400" : "bg-slate-100 text-slate-800 ring-transparent")}
            >
              ⚫ Hitam (−): {black !== null ? names[black] : "–"}
            </button>
            <Btn onClick={() => { setRed(null); setBlack(null); setActive("red"); }}>Lepas probe</Btn>
            <Btn onClick={regenerate}>🎲 Acak rangkaian</Btn>
          </div>
          <p className="mt-2 text-xs text-slate-500">Klik titik kuning (terminal) pada papan untuk memasang probe yang sedang aktif.</p>
        </Card>

        {m.notes.length > 0 && !blown && (
          <div className="space-y-2">
            {m.notes.map((n, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl border p-3 text-sm",
                  n.kind === "danger" && "border-rose-200 bg-rose-50 text-rose-800",
                  n.kind === "warn" && "border-amber-200 bg-amber-50 text-amber-800",
                  n.kind === "info" && "border-sky-200 bg-sky-50 text-sky-800",
                )}
              >
                {n.kind === "danger" ? "⛔ " : n.kind === "warn" ? "⚠️ " : "💡 "}
                {n.text}
              </div>
            ))}
          </div>
        )}
        {blown && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            ⛔ Sekering avometer putus karena ampermeter dipasang paralel pada sumber (hubung singkat). Tekan{" "}
            <b>Ganti sekering</b>, lalu pasang ampermeter secara <b>seri</b> pada celah rangkaian.
          </div>
        )}

      </div>

      {/* Kolom pencatatan hasil */}
      <div className="space-y-4">
        <Card title="Catat hasil pengukuran" icon="✍️">
          {validReading && truthVal !== null ? (
            <>
              <p className="mb-3 text-sm text-slate-600">
                Baca jarum pada skala yang sesuai, hitung nilainya dengan rumus, lalu tulis hasilnya.
              </p>
              <AnswerPanel
                key={[seed, type, red, black, selIdx, m.f.toFixed(3)].join("-")}
                unit={unit}
                truth={truthVal}
                tol={tol}
                decimals={sel.func === "OHM" ? 0 : 2}
                explain={
                  sel.func === "OHM" ? (
                    <>
                      Jarum menunjuk <b>{fmtN(m.scaleReading ?? 0, 1)}</b> pada skala Ω (merah). Hasil = pembacaan × pengali ={" "}
                      {fmtN(m.scaleReading ?? 0, 1)} × {sel.range} = <b>{fmtN(truthVal, 1)} Ω</b>.
                    </>
                  ) : (
                    <>
                      Gunakan skala <b>0–{sc?.fs}</b>. Jarum menunjuk <b>{fmtN(needleAt ?? 0, 1)}</b>. Nilai = {fmtN(needleAt ?? 0, 1)} ÷ {sc?.fs} ×{" "}
                      {sel.label} = <b>{fmtN(truthVal, 2)} {unit}</b>.
                    </>
                  )
                }
                onResult={onAnswer}
              />
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Atur selektor, pasang probe dengan benar dan pastikan jarum menunjuk di dalam skala untuk mulai mencatat hasil.
            </p>
          )}
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            <Toggle checked={help} onChange={setHelp} label="Sorot skala yang harus dibaca" />
            <Toggle checked={truth} onChange={setTruth} label="Tampilkan nilai sebenarnya (kunci)" />
            {truth && (
              <div className="rounded-xl bg-slate-50 p-3 font-mono text-sm text-slate-700 ring-1 ring-slate-200">
                {m.value === null
                  ? "–"
                  : sel.func === "OHM"
                    ? `Hambatan sebenarnya: ${fmtN(m.value, 1)} Ω`
                    : `Nilai sebenarnya: ${fmtN(m.value, 3)} ${unit}`}
                {type === "ohm" && (
                  <div className="mt-1 text-xs text-slate-500">
                    R₁={(exp.els[0] as { r: number }).r} Ω · R₂={(exp.els[1] as { r: number }).r} Ω · R₃={(exp.els[2] as { r: number }).r} Ω
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ====== Latihan baca skala ====== */
const OHM_Q = OHM_TICKS.filter((v) => v >= 1 && v <= 500);
interface Q {
  id: number;
  idx: number;
  reading: number; // pembacaan pada skala
  truth: number;
}
let qid = 1;
function newQ(): Q {
  const idx = 1 + Math.floor(Math.random() * (SELECTORS.length - 1));
  const sel = SELECTORS[idx];
  if (sel.func === "OHM") {
    const rs = OHM_Q[Math.floor(Math.random() * OHM_Q.length)];
    return { id: qid++, idx, reading: rs, truth: rs * sel.range };
  }
  const sc = scaleOf(sel)!;
  const minor = sc.fs / 50;
  const kk = 4 + Math.floor(Math.random() * 44);
  const reading = Number((kk * minor).toFixed(2));
  return { id: qid++, idx, reading, truth: Number(((reading * sel.range) / sc.fs).toFixed(4)) };
}

function Latihan({ onAnswer }: { onAnswer: (ok: boolean) => void }) {
  const [q, setQ] = useState<Q>(newQ);
  const [help, setHelp] = useState(false);
  const [done, setDone] = useState(0);
  const sel = SELECTORS[q.idx];
  const sc = scaleOf(sel)!;
  const f = sel.func === "OHM" ? ohmF(q.reading) : q.reading / sc.fs;
  const unit = unitOf(sel.func);
  const what = sel.func === "DCV" || sel.func === "ACV" ? "tegangan" : sel.func === "DCA" ? "arus" : "hambatan";

  return (
    <div className="grid gap-4 xl:grid-cols-[480px_1fr]">
      <Card title="Avometer" icon="🧭">
        <AvoFace selIdx={q.idx} f={f} adj={50} highlight={help} />
        <div className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-center font-mono text-sm text-emerald-300">
          {FUNC_NAME[sel.func]} · {sel.func === "OHM" ? "pengali " + sel.label : "batas ukur " + sel.label + " " + unit}
        </div>
      </Card>
      <div className="space-y-4">
        <Card title="Soal membaca skala" icon="🎯">
          <p className="text-sm leading-relaxed text-slate-700">
            Avometer digunakan dengan selektor pada <b>{FUNC_NAME[sel.func]}</b>
            {sel.func === "OHM" ? (
              <>
                {" "}
                dengan pengali <b>{sel.label}</b> (sudah dikalibrasi).
              </>
            ) : (
              <>
                {" "}
                dengan batas ukur <b>{sel.label} {unit}</b>.
              </>
            )}{" "}
            Jarum menunjuk seperti pada gambar. Berapakah <b>{what}</b> yang terukur?
          </p>
          <div className="mt-4">
            <AnswerPanel
              key={q.id}
              unit={unit}
              truth={q.truth}
              tol={sel.func === "OHM" ? q.truth * 0.03 : Math.max(sel.range * 0.003, 0.0005)}
              decimals={sel.func === "OHM" ? 0 : 2}
              explain={
                sel.func === "OHM" ? (
                  <>
                    Baca pada skala Ω (merah, dari kanan ke kiri nilainya membesar): jarum menunjuk <b>{q.reading}</b>. Hasil = {q.reading} × {sel.range} ={" "}
                    <b>{fmtN(q.truth, 1)} Ω</b>.
                  </>
                ) : (
                  <>
                    Dengan batas ukur {sel.label} {unit}, skala yang dibaca adalah <b>0–{sc.fs}</b>. Jarum menunjuk <b>{fmtN(q.reading, 1)}</b>. Nilai ={" "}
                    {fmtN(q.reading, 1)} ÷ {sc.fs} × {sel.label} = <b>{fmtN(q.truth, 3)} {unit}</b>.
                  </>
                )
              }
              onNext={() => setQ(newQ())}
              onResult={(ok) => {
                onAnswer(ok);
                if (ok) setDone((d) => d + 1);
              }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <Toggle checked={help} onChange={setHelp} label="Sorot skala yang harus dibaca" />
            <span className="text-xs text-slate-500">Soal benar: {done}</span>
          </div>
        </Card>
        <Card title="Ingat!" icon="📌">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Nilai = (penunjukan jarum ÷ skala maksimum) × batas ukur.</li>
            <li>Skala Ω dibaca dari kanan (0 Ω) ke kiri (∞), lalu dikalikan pengali.</li>
            <li>Pandang jarum tegak lurus agar tidak terjadi kesalahan paralaks.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default function Avometer({ onAnswer }: { onAnswer: (ok: boolean) => void }) {
  const [tab, setTab] = useState<"materi" | "sim" | "latihan">("materi");
  return (
    <div className="space-y-4">
      <SubTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "materi", label: "Materi", icon: "📖" },
          { id: "sim", label: "Eksperimen", icon: "🧪" },
          { id: "latihan", label: "Latihan baca skala", icon: "🎯" },
        ]}
      />
      {tab === "materi" && <Materi />}
      {tab === "sim" && <Eksperimen onAnswer={onAnswer} />}
      {tab === "latihan" && <Latihan onAnswer={onAnswer} />}
    </div>
  );
}
