import { useMemo, useRef, useState } from "react";
import { AnswerPanel, Btn, Card, Readout, Steps, SubTabs, Toggle, fmt } from "./ui";

/* ====== Model: posisi rahang disimpan dalam satuan 0,05 mm (bilangan bulat) ====== */
const MAX_U = 1800; // 90 mm
type Shape = "balok" | "bola" | "silinder";
interface Obj {
  id: number;
  name: string;
  shape: Shape;
  u: number;
}

const OBJECTS: { name: string; shape: Shape }[] = [
  { name: "Balok kayu (lebar)", shape: "balok" },
  { name: "Kelereng (diameter)", shape: "bola" },
  { name: "Koin logam (diameter)", shape: "silinder" },
  { name: "Pipa PVC (diameter luar)", shape: "silinder" },
  { name: "Bola pingpong (diameter)", shape: "bola" },
  { name: "Balok aluminium (tebal)", shape: "balok" },
  { name: "Baut (diameter kepala)", shape: "silinder" },
];
let idCounter = 1;
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
function newObj(): Obj {
  const o = OBJECTS[randInt(0, OBJECTS.length - 1)];
  return { id: idCounter++, name: o.name, shape: o.shape, u: randInt(100, 1200) };
}

/* ====== Gambar SVG ====== */
function VernierSVG({
  u,
  obj,
  mode,
  help,
  onChange,
}: {
  u: number;
  obj: Obj | null;
  mode: "overview" | "zoom";
  help: boolean;
  onChange?: (u: number) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; u0: number } | null>(null);
  const pos = u / 20; // mm
  const zoom = mode === "zoom";
  const s = zoom ? 24 : 6;
  const VW = 960;
  const vwMm = VW / s;
  const x0 = zoom ? pos - 5 : -4;
  const X = (mm: number) => (mm - x0) * s;
  const H = zoom ? 175 : 245;
  const pid = zoom ? "z" : "o";
  const n = u % 20;

  const mainTicks = [];
  const from = Math.max(0, Math.floor(x0) - 1);
  const to = Math.min(150, Math.ceil(x0 + vwMm) + 1);
  for (let mm = from; mm <= to; mm++) {
    const len = mm % 10 === 0 ? 24 : mm % 5 === 0 ? 17 : 10;
    mainTicks.push(
      <g key={mm}>
        <line x1={X(mm)} x2={X(mm)} y1={100} y2={100 - len} stroke="#0f172a" strokeWidth={zoom ? 1.6 : 1} />
        {mm % 10 === 0 && (
          <text x={X(mm)} y={66} textAnchor="middle" fontSize={zoom ? 22 : 12} fontWeight={600} fill="#0f172a">
            {mm / 10}
          </text>
        )}
        {zoom && mm % 10 !== 0 && mm % 5 === 0 && (
          <text x={X(mm)} y={72} textAnchor="middle" fontSize={13} fill="#475569">
            {mm}
          </text>
        )}
      </g>,
    );
  }

  const verTicks = [];
  for (let i = 0; i <= 20; i++) {
    const x = X(pos + i * 0.95);
    const len = i % 10 === 0 ? 20 : i % 2 === 0 ? 15 : 9;
    verTicks.push(
      <g key={i}>
        <line x1={x} x2={x} y1={100} y2={100 + len} stroke="#0f172a" strokeWidth={zoom ? 1.6 : 1} />
        {zoom && i % 2 === 0 && (
          <text x={x} y={100 + 40} textAnchor="middle" fontSize={17} fontWeight={600} fill="#0f172a">
            {i / 2}
          </text>
        )}
      </g>,
    );
  }

  const W = obj ? obj.u / 20 : 0;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VW} ${H}`}
      className={`w-full select-none rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 ring-1 ring-slate-200 ${
        !zoom && onChange ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      style={{ touchAction: zoom ? "auto" : "none" }}
      onPointerDown={(e) => {
        if (zoom || !onChange) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, u0: u };
      }}
      onPointerMove={(e) => {
        if (!drag.current || !onChange || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const mmPerPx = vwMm / rect.width;
        const du = Math.round((e.clientX - drag.current.x) * mmPerPx * 20);
        onChange(drag.current.u0 + du);
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <defs>
        <linearGradient id={`steel-${pid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="0.5" stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id={`jaw-${pid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#94a3b8" />
          <stop offset="0.5" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id={`obj-${pid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`cyl-${pid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" />
          <stop offset="0.5" stopColor="#64748b" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
        <radialGradient id={`ball-${pid}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="1" stopColor="#0369a1" />
        </radialGradient>
      </defs>

      {/* Batang ukur */}
      <rect x={X(-3)} y={20} width={153 * s} height={80} fill={`url(#steel-${pid})`} stroke="#64748b" />
      {mainTicks}
      {!zoom && (
        <text x={X(-2.5)} y={14} fontSize={11} fill="#64748b">
          skala utama (mm / cm)
        </text>
      )}

      {/* Rahang tetap */}
      <rect x={X(-3)} y={20} width={3 * s} height={zoom ? 160 : 215} fill={`url(#jaw-${pid})`} stroke="#475569" />

      {/* Benda ukur */}
      {obj && !zoom && (
        <g>
          {obj.shape === "balok" && (
            <rect x={X(0)} y={175} width={W * s} height={50} fill={`url(#obj-${pid})`} stroke="#78350f" />
          )}
          {obj.shape === "silinder" && (
            <rect x={X(0)} y={175} width={W * s} height={50} rx={4} fill={`url(#cyl-${pid})`} stroke="#1e293b" />
          )}
          {obj.shape === "bola" && (
            <ellipse
              cx={X(W / 2)}
              cy={200}
              rx={(W / 2) * s}
              ry={Math.min((W / 2) * s, 28)}
              fill={`url(#ball-${pid})`}
              stroke="#075985"
            />
          )}
        </g>
      )}

      {/* Rahang geser + nonius */}
      <g>
        {!zoom && <rect x={X(pos)} y={165} width={3 * s} height={70} fill={`url(#jaw-${pid})`} stroke="#475569" />}
        <rect x={X(pos + 12)} y={6} width={zoom ? 120 : 36} height={14} rx={3} fill="#475569" />
        <rect x={X(pos)} y={100} width={22 * s} height={65} fill="#f1f5f9" stroke="#64748b" />
        {verTicks}
        <line x1={X(pos)} x2={X(pos)} y1={100} y2={zoom ? 168 : 235} stroke="#0f172a" strokeWidth={1.5} />
        {!zoom && (
          <text x={X(pos + 3.5)} y={150} fontSize={11} fill="#64748b">
            nonius
          </text>
        )}
      </g>

      {/* Bantuan: garis berimpit */}
      {help && (
        <g>
          <line
            x1={X(pos + n * 0.95)}
            x2={X(pos + n * 0.95)}
            y1={78}
            y2={130}
            stroke="#f97316"
            strokeWidth={zoom ? 3 : 2}
            strokeDasharray="4 3"
          />
          <line x1={X(Math.floor(pos))} x2={X(Math.floor(pos))} y1={30} y2={100} stroke="#0ea5e9" strokeWidth={zoom ? 3 : 2} opacity={0.7} />
        </g>
      )}
    </svg>
  );
}

/* ====== Materi ====== */
function Materi() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Apa itu jangka sorong?" icon="📏">
        <p className="text-sm leading-relaxed text-slate-700">
          Jangka sorong adalah alat ukur panjang yang dapat mengukur <b>diameter luar</b>, <b>diameter dalam</b> dan{" "}
          <b>kedalaman</b> suatu benda. Ketelitiannya <b>0,05 mm</b> (0,005 cm) untuk jangka sorong nonius 20 skala,
          lebih teliti daripada penggaris (0,5 mm).
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {[
            ["Rahang tetap", "bagian rahang yang menyatu dengan batang ukur"],
            ["Rahang geser", "rahang yang digeser untuk menjepit benda"],
            ["Skala utama", "skala tetap pada batang (mm & cm)"],
            ["Skala nonius", "skala pada rahang geser, 20 bagian = 19 mm"],
            ["Rahang dalam", "mengukur diameter dalam (lubang, pipa)"],
            ["Batang kedalaman", "mengukur kedalaman lubang"],
            ["Pengunci", "mengunci rahang agar hasil tidak berubah"],
          ].map(([a, b]) => (
            <div key={a} className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
              <div className="font-semibold text-sky-700">{a}</div>
              <div className="text-xs text-slate-600">{b}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Cara membaca hasil ukur" icon="🔍">
        <Steps
          items={[
            <>
              Baca <b>skala utama</b>: lihat angka (mm) pada skala utama yang berada <u>tepat di kiri</u> garis nol
              nonius.
            </>,
            <>
              Baca <b>skala nonius</b>: cari garis nonius yang <u>berimpit lurus</u> dengan salah satu garis skala utama.
              Kalikan nomor garisnya dengan <b>0,05 mm</b>.
            </>,
            <>
              Hasil = skala utama + (nomor garis nonius × 0,05 mm).
            </>,
          ]}
        />
        <div className="mt-4 rounded-xl bg-sky-50 p-3 text-sm text-slate-700 ring-1 ring-sky-200">
          <b>Contoh:</b> nol nonius berada setelah garis 23 mm, garis nonius ke-9 berimpit.
          <div className="mt-1 font-mono">23 + 9 × 0,05 = 23 + 0,45 = <b>23,45 mm</b></div>
        </div>
        <h4 className="mt-4 text-sm font-bold text-slate-800">Tips & kesalahan umum</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Periksa <b>kesalahan nol</b>: saat rahang menutup, nol nonius harus berimpit dengan nol skala utama.</li>
          <li>Posisikan mata tegak lurus skala untuk menghindari <b>kesalahan paralaks</b>.</li>
          <li>Jepit benda dengan lembut, tanpa menekan terlalu keras.</li>
          <li>Ulangi pengukuran 3 kali lalu ambil rata-ratanya.</li>
        </ul>
      </Card>
    </div>
  );
}

/* ====== Simulasi & latihan ====== */
function Controls({ u, setU, min }: { u: number; setU: (n: number) => void; min: number }) {
  const set = (v: number) => setU(Math.max(min, Math.min(MAX_U, v)));
  return (
    <div className="space-y-3">
      <input
        type="range"
        min={min}
        max={MAX_U}
        step={1}
        value={u}
        onChange={(e) => set(parseInt(e.target.value))}
        className="w-full accent-sky-600"
        aria-label="Geser rahang"
      />
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => set(u - 20)}>◀◀ −1 mm</Btn>
        <Btn onClick={() => set(u - 1)}>◀ −0,05</Btn>
        <Btn onClick={() => set(u + 1)}>+0,05 ▶</Btn>
        <Btn onClick={() => set(u + 20)}>+1 mm ▶▶</Btn>
        <Btn onClick={() => set(min)}>⟲ Rapatkan</Btn>
      </div>
      <p className="text-xs text-slate-500">
        💡 Kamu juga bisa menyeret (drag) gambar jangka sorong ke kiri/kanan untuk menggeser rahang.
      </p>
    </div>
  );
}

function Simulasi() {
  const [u, setU] = useState(467);
  const [help, setHelp] = useState(true);
  const [showObj, setShowObj] = useState(false);
  const [obj, setObj] = useState<Obj>(() => newObj());
  const current = showObj ? obj : null;
  const min = current ? current.u : 0;
  const uu = Math.max(u, min);

  const main = Math.floor(uu / 20);
  const n = uu % 20;
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Card title="Tampilan keseluruhan" icon="🛠️">
          <VernierSVG u={uu} obj={current} mode="overview" help={help} onChange={(v) => setU(Math.max(min, Math.min(MAX_U, v)))} />
        </Card>
        <Card title="Kaca pembesar (skala nonius)" icon="🔎">
          <VernierSVG u={uu} obj={null} mode="zoom" help={help} />
          <p className="mt-2 text-xs text-slate-500">
            Garis <span className="font-semibold text-sky-600">biru</span> = garis skala utama di kiri nol nonius; garis
            putus-putus <span className="font-semibold text-orange-500">oranye</span> = garis nonius yang berimpit.
          </p>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Kendali" icon="🎛️">
          <Controls u={uu} setU={setU} min={min} />
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            <Toggle checked={help} onChange={setHelp} label="Tampilkan garis bantu" />
            <Toggle checked={showObj} onChange={setShowObj} label="Letakkan benda yang diukur" />
            {showObj && (
              <Btn onClick={() => { const o = newObj(); setObj(o); setU(o.u + 40); }} className="w-full">
                🎲 Ganti benda: {obj.name}
              </Btn>
            )}
          </div>
        </Card>
        <Card title="Hasil pembacaan" icon="📟">
          <div className="grid grid-cols-2 gap-2">
            <Readout label="Skala utama" value={`${main}`} unit="mm" />
            <Readout label="Garis nonius" value={`ke-${n}`} accent="text-orange-600" />
          </div>
          <div className="mt-2 rounded-xl bg-slate-50 p-3 font-mono text-sm text-slate-700 ring-1 ring-slate-200">
            {main} + ({n} × 0,05) = {main} + {fmt(n * 0.05)}
          </div>
          <div className="mt-2">
            <Readout label="Hasil pengukuran" value={fmt(uu / 20)} unit="mm" accent="text-emerald-600" />
            <div className="mt-1 text-xs text-slate-500">= {fmt(uu / 200, 3)} cm</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Latihan({ onAnswer }: { onAnswer: (ok: boolean) => void }) {
  const [obj, setObj] = useState<Obj>(() => newObj());
  const [u, setU] = useState(1500);
  const [help, setHelp] = useState(false);
  const [done, setDone] = useState(0);

  const next = () => {
    setObj(newObj());
    setU(1500);
  };
  const main = Math.floor(obj.u / 20);
  const n = obj.u % 20;
  const clamped = Math.max(u, obj.u);
  const ready = clamped === obj.u;

  const explain = useMemo(
    () => (
      <>
        Nol nonius berada setelah garis <b>{main} mm</b> pada skala utama. Garis nonius yang berimpit adalah garis ke-
        <b>{n}</b>, sehingga skala nonius = {n} × 0,05 = {fmt(n * 0.05)} mm.
        <div className="mt-1 font-mono">
          Hasil = {main} + {fmt(n * 0.05)} = <b>{fmt(obj.u / 20)} mm</b>
        </div>
      </>
    ),
    [main, n, obj.u],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <Card title={`Soal: ukur ${obj.name.toLowerCase()}`} icon="🎯">
          <VernierSVG
            u={clamped}
            obj={obj}
            mode="overview"
            help={help}
            onChange={(v) => setU(Math.max(obj.u, Math.min(MAX_U, v)))}
          />
        </Card>
        <Card title="Kaca pembesar" icon="🔎">
          <VernierSVG u={clamped} obj={null} mode="zoom" help={help} />
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="1. Jepit benda" icon="🤏">
          <p className="mb-3 text-sm text-slate-600">
            Geser rahang hingga <b>pas menjepit</b> benda, lalu baca skalanya.
          </p>
          <Controls u={clamped} setU={setU} min={obj.u} />
          <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {ready ? "✅ Benda terjepit pas" : "↔️ Rahang masih renggang, rapatkan hingga menyentuh benda"}
          </div>
        </Card>
        <Card title="2. Tulis hasil pengukuran" icon="✍️">
          <AnswerPanel
            key={obj.id}
            unit="mm"
            truth={obj.u / 20}
            tol={0.004}
            ready={ready}
            notReadyMsg="Rapatkan rahang geser sampai benar-benar menjepit benda, baru jawab."
            explain={explain}
            onNext={next}
            onResult={(ok) => {
              onAnswer(ok);
              if (ok) setDone((d) => d + 1);
            }}
          />
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <Toggle checked={help} onChange={setHelp} label="Garis bantu" />
            <span className="text-xs text-slate-500">Soal benar: {done}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function Vernier({ onAnswer }: { onAnswer: (ok: boolean) => void }) {
  const [tab, setTab] = useState<"materi" | "sim" | "latihan">("materi");
  return (
    <div className="space-y-4">
      <SubTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "materi", label: "Materi", icon: "📖" },
          { id: "sim", label: "Simulasi", icon: "🧪" },
          { id: "latihan", label: "Latihan", icon: "🎯" },
        ]}
      />
      {tab === "materi" && <Materi />}
      {tab === "sim" && <Simulasi />}
      {tab === "latihan" && <Latihan onAnswer={onAnswer} />}
    </div>
  );
}
