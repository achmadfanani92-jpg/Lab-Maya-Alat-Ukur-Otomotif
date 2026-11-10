import { useMemo, useRef, useState } from "react";
import { AnswerPanel, Btn, Card, Readout, Steps, SubTabs, Toggle, fmt } from "./ui";

/* Posisi poros disimpan dalam satuan 0,01 mm. 1 putaran bidal = 50 satuan = 0,5 mm */
const MAX_U = 2500;
interface Obj {
  id: number;
  name: string;
  u: number;
  color: string;
}

const OBJECTS = [
  { name: "Kawat tembaga (diameter)", range: [30, 300], color: "#d97706" },
  { name: "Kawat nikrom (diameter)", range: [20, 150], color: "#94a3b8" },
  { name: "Bola baja (diameter)", range: [300, 800], color: "#64748b" },
  { name: "Kelereng kaca (diameter)", range: [500, 1600], color: "#38bdf8" },
  { name: "Pelat aluminium (tebal)", range: [100, 600], color: "#cbd5e1" },
  { name: "Batang kuningan (diameter)", range: [400, 1500], color: "#eab308" },
];
let idCounter = 1;
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
function newObj(): Obj {
  const o = OBJECTS[randInt(0, OBJECTS.length - 1)];
  return { id: idCounter++, name: o.name, u: randInt(o.range[0], o.range[1]), color: o.color };
}

/* ====== Gambar SVG ====== */
function MicSVG({
  u,
  obj,
  zoom,
  help,
  onChange,
}: {
  u: number;
  obj: Obj | null;
  zoom: boolean;
  help: boolean;
  onChange?: (u: number) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; u0: number } | null>(null);
  const S = 12; // px per mm
  const xA = 110;
  const xz = 462;
  const d = u / 100;
  const e = xz + d * S; // tepi bidal
  const n = u % 50;
  const sleeveI = Math.floor(u / 50); // jumlah 0,5 mm
  const rot = (n / 50) * Math.PI * 2;
  const tipX = xA + d * S;
  const viewBox = zoom ? `${e - 190} 178 390 144` : "0 60 1000 270";
  const vbW = zoom ? 390 : 1000;

  // Skala selubung
  const sleeve = [];
  for (let i = 0; i <= 50; i++) {
    const m = i * 0.5;
    const x = xz + m * S;
    if (i % 2 === 0) {
      const five = m % 5 === 0;
      sleeve.push(
        <g key={i}>
          <line x1={x} x2={x} y1={250} y2={250 - (five ? 22 : 13)} stroke="#0f172a" strokeWidth={1.3} />
          {five && (
            <text x={x} y={250 - 27} textAnchor="middle" fontSize={12} fontWeight={700} fill="#0f172a">
              {m}
            </text>
          )}
        </g>,
      );
    } else {
      sleeve.push(<line key={i} x1={x} x2={x} y1={250} y2={262} stroke="#0f172a" strokeWidth={1.3} />);
    }
  }

  // Skala bidal (silinder berputar)
  const thimble = [];
  for (let i = 0; i < 50; i++) {
    const a = (i / 50) * Math.PI * 2 - rot;
    const c = Math.cos(a);
    if (c < 0.1) continue;
    const y = 250 + 42 * Math.sin(a);
    const major = i % 5 === 0;
    thimble.push(
      <g key={i}>
        <line x1={e + 3} x2={e + 3 + (major ? 17 : 10)} y1={y} y2={y} stroke="#0f172a" strokeWidth={1.2} />
        {major && Math.abs(Math.sin(a)) < 0.92 && (
          <text x={e + 25} y={y + 4} fontSize={11} fontWeight={700} fill="#0f172a">
            {i}
          </text>
        )}
      </g>,
    );
  }

  const D = obj ? obj.u / 100 : 0;
  const dpx = D * S;

  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      className={`w-full ${zoom ? "max-h-[330px]" : "max-h-[300px]"} select-none rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 ring-1 ring-slate-200 ${
        !zoom && onChange ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      style={{ touchAction: zoom ? "auto" : "none" }}
      onPointerDown={(ev) => {
        if (zoom || !onChange) return;
        ev.currentTarget.setPointerCapture(ev.pointerId);
        drag.current = { x: ev.clientX, u0: u };
      }}
      onPointerMove={(ev) => {
        if (!drag.current || !onChange || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const svgPerPx = vbW / rect.width;
        const dmm = ((ev.clientX - drag.current.x) * svgPerPx) / S;
        onChange(drag.current.u0 + Math.round(dmm * 100));
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <defs>
        <linearGradient id="m-thimble" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#94a3b8" />
          <stop offset="0.35" stopColor="#f1f5f9" />
          <stop offset="0.65" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="m-sleeve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cbd5e1" />
          <stop offset="0.5" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="m-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" />
          <stop offset="0.5" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="m-rat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="0.4" stopColor="#64748b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Rangka (frame) */}
      <path
        d="M 62 250 L 62 140 Q 62 100 102 100 L 385 100 Q 430 100 430 140 L 430 250"
        fill="none"
        stroke="#0f172a"
        strokeWidth={32}
        strokeLinejoin="round"
      />
      <path
        d="M 62 250 L 62 140 Q 62 100 102 100 L 385 100 Q 430 100 430 140 L 430 250"
        fill="none"
        stroke="#1e40af"
        strokeWidth={26}
        strokeLinejoin="round"
      />
      <text x={250} y={104} textAnchor="middle" fontSize={12} fontWeight={700} fill="#dbeafe" letterSpacing={1}>
        MIKROMETER SEKRUP 0–25 mm · 0,01 mm
      </text>
      {!zoom && (
        <>
          <text x={78} y={330} fontSize={12} fill="#475569">landasan (anvil)</text>
          <text x={tipX} y={322} fontSize={12} fill="#475569" textAnchor="middle">poros (spindle)</text>
          <text x={560} y={200} fontSize={12} fill="#475569" textAnchor="middle">selubung (skala utama)</text>
          <text x={e + 100} y={182} fontSize={12} fill="#475569" textAnchor="middle">bidal (skala putar)</text>
          <text x={e + 195} y={322} fontSize={12} fill="#475569" textAnchor="middle">ratchet</text>
        </>
      )}

      {/* Landasan */}
      <rect x={42} y={236} width={xA - 42} height={28} rx={3} fill="url(#m-steel)" stroke="#334155" />

      {/* Benda */}
      {obj && !zoom && (
        <g>
          {dpx <= 100 ? (
            <circle cx={xA + dpx / 2} cy={250} r={dpx / 2} fill={obj.color} stroke="#0f172a" strokeWidth={1} />
          ) : (
            <rect x={xA} y={205} width={dpx} height={90} rx={6} fill={obj.color} stroke="#0f172a" />
          )}
        </g>
      )}

      {/* Poros */}
      <rect x={tipX} y={241} width={410 - tipX + 2} height={18} fill="url(#m-steel)" stroke="#334155" />

      {/* Hub + selubung */}
      <rect x={405} y={205} width={48} height={90} rx={4} fill="#1e3a8a" stroke="#0f172a" />
      <rect x={450} y={212} width={xz + 25 * S + 16 - 450} height={76} fill="url(#m-sleeve)" stroke="#64748b" />
      <line x1={450} x2={xz + 25 * S + 16} y1={250} y2={250} stroke="#0f172a" strokeWidth={1.6} />
      {sleeve}

      {/* Bantuan sleeve */}
      {help && (
        <g>
          <line x1={xz + sleeveI * 0.5 * S} x2={xz + sleeveI * 0.5 * S} y1={206} y2={294} stroke="#0ea5e9" strokeWidth={3} opacity={0.8} />
        </g>
      )}

      {/* Bidal */}
      <g>
        <polygon
          points={`${e},205 ${e + 26},190 ${e + 175},190 ${e + 175},310 ${e + 26},310 ${e},295`}
          fill="url(#m-thimble)"
          stroke="#334155"
        />
        {thimble}
        {help && (
          <>
            <line x1={e - 6} x2={e + 44} y1={250} y2={250} stroke="#f97316" strokeWidth={2.2} strokeDasharray="4 3" />
            <polygon points={`${e + 46},250 ${e + 56},244 ${e + 56},256`} fill="#f97316" />
          </>
        )}
        {/* ratchet */}
        <rect x={e + 175} y={203} width={44} height={94} rx={8} fill="url(#m-rat)" stroke="#020617" />
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={e + 181 + i * 4.5} x2={e + 181 + i * 4.5} y1={208} y2={292} stroke="#94a3b8" strokeWidth={0.8} opacity={0.6} />
        ))}
      </g>
    </svg>
  );
}

/* ====== Materi ====== */
function Materi() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Apa itu mikrometer sekrup?" icon="🔩">
        <p className="text-sm leading-relaxed text-slate-700">
          Mikrometer sekrup digunakan untuk mengukur benda yang sangat kecil/tipis seperti <b>diameter kawat</b>,{" "}
          <b>tebal pelat</b> atau diameter bola kecil. Ketelitiannya <b>0,01 mm</b> (0,001 cm), lebih teliti daripada
          jangka sorong. Satu kali putaran bidal menggeser poros sejauh <b>0,5 mm</b>, dan bidal memiliki{" "}
          <b>50 skala</b>, sehingga 1 skala = 0,5 ÷ 50 = 0,01 mm.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {[
            ["Rangka (frame)", "badan berbentuk huruf C"],
            ["Landasan (anvil)", "permukaan ukur yang diam"],
            ["Poros (spindle)", "permukaan ukur yang bergerak"],
            ["Selubung (sleeve)", "skala utama: mm di atas, 0,5 mm di bawah garis"],
            ["Bidal (thimble)", "selubung putar, 50 skala (0,01 mm)"],
            ["Ratchet", "pemutar bergerigi; berbunyi 'klik' bila benda terjepit pas"],
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
              Putar <b>ratchet</b> sampai berbunyi “klik” agar benda terjepit dengan tekanan yang sama.
            </>,
            <>
              Baca <b>skala utama</b> pada selubung: angka mm (garis di atas) + 0,5 mm bila garis di bawah garis tengah
              sudah terlihat (tidak tertutup bidal).
            </>,
            <>
              Baca <b>skala putar</b> pada bidal: nomor garis yang <u>berimpit dengan garis tengah</u> selubung × 0,01 mm.
            </>,
            <>Hasil = skala utama + skala putar.</>,
          ]}
        />
        <div className="mt-4 rounded-xl bg-sky-50 p-3 text-sm text-slate-700 ring-1 ring-sky-200">
          <b>Contoh:</b> skala utama terbaca 5,5 mm (garis 5 mm dan garis 0,5 mm tambahan terlihat), garis bidal ke-28
          berimpit dengan garis tengah.
          <div className="mt-1 font-mono">5,5 + 28 × 0,01 = 5,5 + 0,28 = <b>5,78 mm</b></div>
        </div>
        <h4 className="mt-4 text-sm font-bold text-slate-800">Tips & kesalahan umum</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Periksa <b>kesalahan nol</b> saat poros menyentuh landasan (tanpa benda).</li>
          <li>Jangan memutar bidal langsung dengan keras — gunakan ratchet.</li>
          <li>Jika garis 0,5 mm sudah terlihat, ingat menambahkan 0,5 mm.</li>
          <li>Bersihkan permukaan ukur sebelum dipakai.</li>
        </ul>
      </Card>
    </div>
  );
}

/* ====== Kontrol, simulasi & latihan ====== */
function Controls({ u, setU, min }: { u: number; setU: (n: number) => void; min: number }) {
  const set = (v: number) => setU(Math.max(min, Math.min(MAX_U, v)));
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>🔄 Putar bidal (kasar)</span>
          <span>buka lebih lebar →</span>
        </div>
        <input
          type="range"
          min={min}
          max={MAX_U}
          value={u}
          onChange={(e) => set(parseInt(e.target.value))}
          className="w-full accent-sky-600"
          aria-label="Putar bidal"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => set(u - 50)}>−0,5</Btn>
        <Btn onClick={() => set(u - 5)}>−0,05</Btn>
        <Btn onClick={() => set(u - 1)}>◀ −0,01</Btn>
        <Btn onClick={() => set(u + 1)}>+0,01 ▶</Btn>
        <Btn onClick={() => set(u + 5)}>+0,05</Btn>
        <Btn onClick={() => set(u + 50)}>+0,5</Btn>
      </div>
      <Btn className="w-full" onClick={() => set(min)}>⟲ Tutup poros sampai menyentuh</Btn>
      <p className="text-xs text-slate-500">💡 Seret gambar ke kanan/kiri untuk membuka/menutup poros.</p>
    </div>
  );
}

function Simulasi() {
  const [u, setU] = useState(578);
  const [help, setHelp] = useState(true);
  const [showObj, setShowObj] = useState(false);
  const [obj, setObj] = useState<Obj>(() => newObj());
  const current = showObj ? obj : null;
  const min = current ? current.u : 0;
  const uu = Math.max(u, min);
  const sleeve = Math.floor(uu / 50) * 0.5;
  const n = uu % 50;
  const clicked = !!current && uu === current.u;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Card title="Tampilan keseluruhan" icon="🛠️">
          <MicSVG u={uu} obj={current} zoom={false} help={help} onChange={(v) => setU(Math.max(min, Math.min(MAX_U, v)))} />
          {clicked && <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">🔔 Klik! Benda terjepit pas.</div>}
        </Card>
        <Card title="Kaca pembesar (tempat membaca skala)" icon="🔎">
          <MicSVG u={uu} obj={null} zoom help={help} />
          <p className="mt-2 text-xs text-slate-500">
            Garis <span className="font-semibold text-sky-600">biru</span> = garis skala utama terakhir yang terlihat;
            garis <span className="font-semibold text-orange-500">oranye</span> = garis tengah selubung tempat membaca skala putar.
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
              <Btn onClick={() => { const o = newObj(); setObj(o); setU(o.u + 100); }} className="w-full">
                🎲 Ganti benda: {obj.name}
              </Btn>
            )}
          </div>
        </Card>
        <Card title="Hasil pembacaan" icon="📟">
          <div className="grid grid-cols-2 gap-2">
            <Readout label="Skala utama" value={fmt(sleeve, 1)} unit="mm" />
            <Readout label="Skala putar" value={`${n}`} accent="text-orange-600" />
          </div>
          <div className="mt-2 rounded-xl bg-slate-50 p-3 font-mono text-sm text-slate-700 ring-1 ring-slate-200">
            {fmt(sleeve, 1)} + ({n} × 0,01) = {fmt(sleeve, 2)} + {fmt(n * 0.01)}
          </div>
          <div className="mt-2">
            <Readout label="Hasil pengukuran" value={fmt(uu / 100)} unit="mm" accent="text-emerald-600" />
            <div className="mt-1 text-xs text-slate-500">= {fmt(uu / 1000, 3)} cm</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Latihan({ onAnswer }: { onAnswer: (ok: boolean) => void }) {
  const [obj, setObj] = useState<Obj>(() => newObj());
  const [u, setU] = useState(2000);
  const [help, setHelp] = useState(false);
  const [done, setDone] = useState(0);
  const clamped = Math.max(u, obj.u);
  const ready = clamped === obj.u;

  const sleeve = Math.floor(obj.u / 50) * 0.5;
  const n = obj.u % 50;
  const explain = useMemo(
    () => (
      <>
        Skala utama terbaca <b>{fmt(sleeve, 1)} mm</b>. Garis bidal yang berimpit dengan garis tengah adalah garis ke-
        <b>{n}</b>, sehingga skala putar = {n} × 0,01 = {fmt(n * 0.01)} mm.
        <div className="mt-1 font-mono">
          Hasil = {fmt(sleeve, 1)} + {fmt(n * 0.01)} = <b>{fmt(obj.u / 100)} mm</b>
        </div>
      </>
    ),
    [sleeve, n, obj.u],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <Card title={`Soal: ukur ${obj.name.toLowerCase()}`} icon="🎯">
          <MicSVG u={clamped} obj={obj} zoom={false} help={help} onChange={(v) => setU(Math.max(obj.u, Math.min(MAX_U, v)))} />
        </Card>
        <Card title="Kaca pembesar" icon="🔎">
          <MicSVG u={clamped} obj={null} zoom help={help} />
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="1. Jepit benda" icon="🤏">
          <p className="mb-3 text-sm text-slate-600">
            Putar bidal hingga poros <b>menyentuh benda</b> (bunyi “klik”), lalu baca skalanya.
          </p>
          <Controls u={clamped} setU={setU} min={obj.u} />
          <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {ready ? "🔔 Klik! Benda terjepit pas" : "↔️ Poros masih renggang, putar terus sampai berbunyi klik"}
          </div>
        </Card>
        <Card title="2. Tulis hasil pengukuran" icon="✍️">
          <AnswerPanel
            key={obj.id}
            unit="mm"
            truth={obj.u / 100}
            tol={0.004}
            ready={ready}
            notReadyMsg="Tutup poros sampai menjepit benda (klik) sebelum menjawab."
            explain={explain}
            onNext={() => {
              setObj(newObj());
              setU(2000);
            }}
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

export default function Micrometer({ onAnswer }: { onAnswer: (ok: boolean) => void }) {
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
