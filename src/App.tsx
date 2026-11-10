import { useEffect, useState } from "react";
import Vernier from "./components/Vernier";
import Micrometer from "./components/Micrometer";
import Avometer from "./components/Avometer";
import Opening from "./components/Opening";
import bengkel from "./assets/bengkel.jpg";
import mekanik from "./assets/mekanik.png";
import { cn } from "./utils/cn";

type Page = "home" | "vernier" | "micro" | "avo";

const PAGES: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Beranda", icon: "🏠" },
  { id: "vernier", label: "Jangka Sorong", icon: "📏" },
  { id: "micro", label: "Mikrometer Sekrup", icon: "🔩" },
  { id: "avo", label: "Avometer", icon: "🧭" },
];

function Home({ go, replay }: { go: (p: Page) => void; replay: () => void }) {
  const cards = [
    {
      id: "vernier" as Page,
      icon: "📏",
      title: "Jangka Sorong",
      sub: "Ketelitian 0,05 mm",
      desc: "Geser rahang, jepit benda, dan baca skala utama + skala nonius dengan kaca pembesar.",
      grad: "from-navy-900 to-navy-700",
    },
    {
      id: "micro" as Page,
      icon: "🔩",
      title: "Mikrometer Sekrup",
      sub: "Ketelitian 0,01 mm",
      desc: "Putar bidal untuk mengukur kawat, bola, dan pelat tipis. Baca selubung dan skala putar.",
      grad: "from-navy-800 to-brand-red",
    },
    {
      id: "avo" as Page,
      icon: "🧭",
      title: "Avometer",
      sub: "Volt · Ampere · Ohm",
      desc: "Rangkai dan ukur tegangan, arus, hambatan pada papan percobaan, serta latihan membaca skala.",
      grad: "from-slate-700 to-navy-900",
    },
  ];
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-navy-950 text-white shadow-2xl">
        <img src={bengkel} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ animation: "op-slow-zoom 24s linear both" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/10" />
        <div className="relative grid items-end gap-4 px-6 pt-8 sm:px-10 sm:pt-12 md:grid-cols-[1.25fr_1fr]">
          <div className="pb-8 sm:pb-12 lm-stagger">
            <span className="inline-block rounded-lg bg-brand-red px-3 py-1 font-display text-xs font-extrabold tracking-wider">
              LABORATORIUM VIRTUAL TEKNIK OTOMOTIF
            </span>
            <h2
              className="mt-4 font-display text-5xl font-black leading-[.95] sm:text-7xl"
              style={{ textShadow: "1px 1px 0 #e4282d, 2px 2px 0 #e4282d, 3px 3px 0 #b81c21, 4px 4px 0 #8f1217, 5px 5px 0 #8f1217, 0 14px 26px rgba(0,0,0,.5)" }}
            >
              LAB
              <br />
              MAYA
            </h2>
            <p className="mt-6 max-w-xl text-slate-200">
              Berlatih menggunakan <b>jangka sorong</b>, <b>mikrometer sekrup</b>, dan <b>avometer</b> kapan saja tanpa takut alat rusak.
              Pelajari materinya, coba simulasinya, lalu uji kemampuanmu lewat latihan soal acak.
            </p>
            <p className="mt-3 font-display text-sm font-bold text-slate-300">Belajar • Mencoba • Kompeten</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => go("vernier")}
                className="lm-btn-sheen rounded-xl border-b-4 border-[#8f1217] bg-brand-red px-6 py-3 font-display text-sm font-extrabold text-white shadow-lg transition hover:brightness-110 active:translate-y-0.5 active:border-b-2"
              >
                ▶ MULAI PEMBELAJARAN
              </button>
              <button
                onClick={replay}
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Putar ulang opening
              </button>
            </div>
          </div>
          <div className="relative hidden h-full min-h-[360px] md:block">
            <img
              src={mekanik}
              alt="Mekanik Automotive Service"
              className="absolute bottom-0 right-0 max-h-[470px] w-auto drop-shadow-[0_24px_30px_rgba(0,0,0,.5)]"
              style={{ animation: "op-char-right 1.1s cubic-bezier(.16,.9,.3,1) both" }}
            />
          </div>
        </div>
      </div>

      <div className="lm-stagger grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => go(c.id)}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl"
          >
            <div className={cn("flex items-center gap-3 bg-gradient-to-r p-4 text-white", c.grad)}>
              <span className="text-4xl transition group-hover:scale-110">{c.icon}</span>
              <div>
                <div className="font-display text-lg font-extrabold">{c.title}</div>
                <div className="text-xs font-medium text-white/85">{c.sub}</div>
              </div>
            </div>
            <div className="border-b-4 border-brand-red p-4 text-sm leading-relaxed text-slate-600">
              {c.desc}
              <div className="mt-3 font-semibold text-brand-red transition group-hover:translate-x-1">Buka lab →</div>
            </div>
          </button>
        ))}
      </div>

      <div className="lm-stagger grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-base font-bold text-navy-900">🎓 Tujuan pembelajaran</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700 marker:text-brand-red">
            <li>Menyebutkan bagian-bagian dan fungsi tiap alat ukur.</li>
            <li>Menentukan ketelitian dan cara membaca skala utama, nonius, serta skala putar.</li>
            <li>Mengukur panjang, diameter, dan ketebalan benda dengan jangka sorong dan mikrometer.</li>
            <li>Memilih fungsi & batas ukur avometer, memasang probe, serta menghitung hasil pembacaan.</li>
            <li>Menerapkan prosedur keselamatan saat mengukur besaran listrik.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-base font-bold text-navy-900">🧭 Cara menggunakan lab ini</h3>
          <ol className="space-y-2 text-sm text-slate-700">
            <li><b>1. Materi</b> – baca bagian alat dan cara membaca hasil ukur.</li>
            <li><b>2. Simulasi</b> – geser/putar alat, lihat hasil bacaan langsung dengan garis bantu.</li>
            <li><b>3. Latihan</b> – ukur benda acak, tulis hasilnya, dan dapatkan pembahasan.</li>
            <li className="rounded-lg bg-amber-50 p-2 text-amber-800 ring-1 ring-amber-200">
              💡 Kamu bisa menyeret gambar alat dengan mouse/jari, atau memakai tombol untuk penyetelan halus.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function useStageScale() {
  const [s, setS] = useState(1);
  useEffect(() => {
    const f = () => setS(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return s;
}

export default function App() {
  const [intro, setIntro] = useState(true);
  const [page, setPage] = useState<Page>("home");
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const onAnswer = (ok: boolean) => setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
  const scale = useStageScale();

  if (intro) {
    return (
      <Opening
        onDone={() => {
          setPage("home");
          setIntro(false);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-navy-950">
      <div className="lm-stage bg-gradient-to-b from-slate-100 to-slate-200 text-slate-800" style={{ transform: `translate(-50%,-50%) scale(${scale})` }}>
        <header className="z-30 shrink-0 border-b-4 border-brand-red bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white shadow-lg">
          <div className="flex h-[76px] items-center gap-4 px-8">
            <button onClick={() => setPage("home")} className="flex items-center gap-3">
              <span className="h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br from-brand-red to-brand-red-dark shadow ring-2 ring-white/30">
                <img src={mekanik} alt="" className="h-full w-full object-cover object-top" />
              </span>
              <span className="text-left leading-tight">
                <span className="block font-display text-xl font-black tracking-wide">LAB MAYA</span>
                <span className="block text-xs font-medium text-slate-300">Laboratorium Virtual Teknik Otomotif</span>
              </span>
            </button>
            <nav className="ml-6 flex gap-1.5">
              {PAGES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPage(p.id)}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-4 py-2.5 text-base font-semibold transition active:scale-95",
                    page === p.id ? "bg-brand-red text-white shadow" : "text-slate-200 hover:bg-white/10",
                  )}
                >
                  <span className="mr-1.5">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setIntro(true)}
                className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                ▶ Opening
              </button>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-base ring-1 ring-white/20">
                <span>🏆</span>
                <span className="font-semibold">
                  Skor: {score.ok}/{score.total}
                </span>
                {score.total > 0 && (
                  <button onClick={() => setScore({ ok: 0, total: 0 })} className="text-xs text-slate-300 underline">
                    reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="lm-scroll min-h-0 flex-1 overflow-y-auto px-8 py-4">
          <div key={page} className="lm-page">
            {page === "home" && <Home go={setPage} replay={() => setIntro(true)} />}
            {page === "vernier" && <Vernier onAnswer={onAnswer} />}
            {page === "micro" && <Micrometer onAnswer={onAnswer} />}
            {page === "avo" && <Avometer onAnswer={onAnswer} />}
          </div>
        </main>
      </div>
    </div>
  );
}
