/* ====== Logika Avometer: selektor, skala, dan simulasi rangkaian ====== */

export type Func = "OFF" | "DCV" | "ACV" | "DCA" | "OHM";
export interface Sel {
  func: Func;
  range: number; // batas ukur (V, mA) atau pengali (Ω)
  label: string;
}

export const SELECTORS: Sel[] = [
  { func: "OFF", range: 0, label: "OFF" },
  ...[2.5, 10, 50, 250, 1000].map((r) => ({ func: "DCV" as Func, range: r, label: String(r) })),
  ...[10, 50, 250, 1000].map((r) => ({ func: "ACV" as Func, range: r, label: String(r) })),
  ...[2.5, 25, 250].map((r) => ({ func: "DCA" as Func, range: r, label: String(r) })),
  { func: "OHM", range: 1, label: "×1" },
  { func: "OHM", range: 10, label: "×10" },
  { func: "OHM", range: 1000, label: "×1k" },
];

export const FUNC_NAME: Record<Func, string> = {
  OFF: "OFF (mati)",
  DCV: "DC V (tegangan searah)",
  ACV: "AC V (tegangan bolak-balik)",
  DCA: "DC mA (arus searah)",
  OHM: "Ω (hambatan)",
};

export const unitOf = (f: Func) => (f === "DCV" || f === "ACV" ? "V" : f === "DCA" ? "mA" : f === "OHM" ? "Ω" : "");

export type ScaleKey = "S250" | "S50" | "S10" | "OHM";
export function scaleOf(sel: Sel): { key: ScaleKey; fs: number } | null {
  if (sel.func === "OFF") return null;
  if (sel.func === "OHM") return { key: "OHM", fs: 0 };
  const r = sel.range;
  if (sel.func === "DCA") return { key: "S250", fs: 250 };
  if (r === 2.5 || r === 250) return { key: "S250", fs: 250 };
  if (r === 50) return { key: "S50", fs: 50 };
  return { key: "S10", fs: 10 }; // 10 dan 1000
}

export const RC = 20; // nilai tengah skala Ω
export const ohmF = (rs: number) => (Number.isFinite(rs) ? RC / (RC + rs) : 0);
export const OHM_TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100, 150, 200, 300, 500, 1000];
export const OHM_LABELS = [0, 2, 5, 10, 15, 20, 30, 50, 100, 200];

/* ====== Solver rangkaian (Modified Nodal Analysis) ====== */
export type El =
  | { t: "R"; a: number; b: number; r: number }
  | { t: "V"; a: number; b: number; e: number; kind: "dc" | "ac" };

export function solve(n: number, els: El[]): { v: number[]; iv: number[] } {
  const vs = els.filter((e): e is Extract<El, { t: "V" }> => e.t === "V");
  const N = n - 1 + vs.length;
  const A = Array.from({ length: N }, () => new Array(N).fill(0));
  const z = new Array(N).fill(0);
  for (let k = 0; k < n - 1; k++) A[k][k] += 1e-9;
  for (const e of els) {
    if (e.t === "R") {
      const g = 1 / e.r;
      if (e.a) A[e.a - 1][e.a - 1] += g;
      if (e.b) A[e.b - 1][e.b - 1] += g;
      if (e.a && e.b) {
        A[e.a - 1][e.b - 1] -= g;
        A[e.b - 1][e.a - 1] -= g;
      }
    }
  }
  vs.forEach((e, j) => {
    const s = n - 1 + j;
    if (e.a) {
      A[e.a - 1][s] += 1;
      A[s][e.a - 1] += 1;
    }
    if (e.b) {
      A[e.b - 1][s] -= 1;
      A[s][e.b - 1] -= 1;
    }
    z[s] = e.e;
  });
  // Eliminasi Gauss
  for (let c = 0; c < N; c++) {
    let p = c;
    for (let r = c + 1; r < N; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    [z[c], z[p]] = [z[p], z[c]];
    const d = A[c][c] || 1e-18;
    for (let r = c + 1; r < N; r++) {
      const f = A[r][c] / d;
      if (!f) continue;
      for (let k = c; k < N; k++) A[r][k] -= f * A[c][k];
      z[r] -= f * z[c];
    }
  }
  const x = new Array(N).fill(0);
  for (let r = N - 1; r >= 0; r--) {
    let s = z[r];
    for (let k = r + 1; k < N; k++) s -= A[r][k] * x[k];
    x[r] = s / (A[r][r] || 1e-18);
  }
  return { v: [0, ...x.slice(0, n - 1)], iv: x.slice(n - 1) };
}

/* ====== Rangkaian percobaan ====== */
export type ExpType = "dcv" | "acv" | "ohm" | "dca";
export interface Experiment {
  type: ExpType;
  title: string;
  n: number; // jumlah node (termasuk ground = 0)
  els: El[];
  hasSource: boolean;
  params: { E?: number; R1?: number; R2?: number; R3?: number; Vac?: number };
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const R_SET = [100, 150, 220, 330, 470, 680, 1000];
const R_OHM = [10, 22, 47, 100, 220, 330, 470, 680, 1000, 2200, 4700, 10000, 22000];

export const EXP_INFO: Record<ExpType, { title: string; desc: string }> = {
  dcv: { title: "Tegangan DC", desc: "Ukur tegangan baterai dan tegangan pada tiap resistor (dipasang PARALEL dengan komponen)." },
  acv: { title: "Tegangan AC", desc: "Ukur tegangan bolak-balik dari trafo / stopkontak. Polaritas probe tidak berpengaruh." },
  ohm: { title: "Hambatan (Ω)", desc: "Ukur hambatan resistor. Kalibrasi nol dulu, dan pastikan rangkaian tidak bertegangan." },
  dca: { title: "Arus DC", desc: "Ukur arus dengan memasang avometer SERI pada celah rangkaian (A–B)." },
};

export function makeExperiment(type: ExpType): Experiment {
  if (type === "dcv") {
    const E = pick([3, 4.5, 6, 9, 12]);
    const R1 = pick(R_SET);
    let R2 = pick(R_SET);
    if (R2 === R1) R2 = pick(R_SET.filter((x) => x !== R1));
    return {
      type,
      title: EXP_INFO[type].title,
      n: 3,
      // node 0 = C (−), 1 = A (+), 2 = B
      els: [
        { t: "V", a: 1, b: 0, e: E, kind: "dc" },
        { t: "R", a: 1, b: 2, r: R1 },
        { t: "R", a: 2, b: 0, r: R2 },
      ],
      hasSource: true,
      params: { E, R1, R2 },
    };
  }
  if (type === "acv") {
    const Vac = pick([6, 9, 12, 24, 110, 220]);
    return {
      type,
      title: EXP_INFO[type].title,
      n: 2,
      els: [
        { t: "V", a: 1, b: 0, e: Vac, kind: "ac" },
        { t: "R", a: 1, b: 0, r: 500 },
      ],
      hasSource: true,
      params: { Vac },
    };
  }
  if (type === "ohm") {
    return {
      type,
      title: EXP_INFO[type].title,
      n: 4,
      els: [
        { t: "R", a: 0, b: 1, r: pick(R_OHM) },
        { t: "R", a: 1, b: 2, r: pick(R_OHM) },
        { t: "R", a: 2, b: 3, r: pick(R_OHM) },
      ],
      hasSource: false,
      params: {},
    };
  }
  // dca: node 0 = D(−), 1 = C(+), 2 = A, 3 = B (celah A–B terbuka)
  const E = pick([3, 6, 9, 12]);
  const R1 = pick([100, 150, 220, 330]);
  const R2 = pick([100, 150, 220, 330]);
  return {
    type,
    title: EXP_INFO[type].title,
    n: 4,
    els: [
      { t: "V", a: 1, b: 0, e: E, kind: "dc" },
      { t: "R", a: 1, b: 2, r: R1 },
      { t: "R", a: 3, b: 0, r: R2 },
    ],
    hasSource: true,
    params: { E, R1, R2 },
  };
}

export interface Measurement {
  f: number; // posisi jarum 0..1 (di skala), boleh sedikit di luar
  value: number | null; // nilai sebenarnya (satuan alat), null jika tak bermakna
  notes: { kind: "warn" | "info" | "danger"; text: string }[];
  fuse: boolean;
  ready: boolean; // probe terpasang & alat pada fungsi yang tepat
  scaleReading: number | null; // penunjukan pada skala yang dipakai
}

/** k = faktor kalibrasi nol-ohm (1 = tepat) */
export function measure(exp: Experiment, red: number | null, black: number | null, sel: Sel, k: number): Measurement {
  const out: Measurement = { f: 0, value: null, notes: [], fuse: false, ready: false, scaleReading: null };
  const sc = scaleOf(sel);
  if (sel.func === "OFF" || !sc) {
    out.notes.push({ kind: "info", text: "Selektor pada posisi OFF. Putar ke fungsi dan batas ukur yang sesuai." });
    return out;
  }
  const isAC = exp.type === "acv";
  const clampF = (f: number) => Math.max(-0.07, Math.min(1.1, f));

  if (sel.func === "OHM") {
    if (red === null || black === null) {
      out.notes.push({ kind: "info", text: "Pasang kedua probe. Hubungkan probe ke titik yang sama untuk kalibrasi nol (0 Ω ADJ)." });
      out.f = 0;
      return out;
    }
    if (exp.hasSource) {
      out.notes.push({
        kind: "danger",
        text: "Rangkaian ini bertegangan! Jangan mengukur hambatan pada rangkaian yang dialiri sumber — alat bisa rusak. Pilih percobaan “Hambatan”.",
      });
      return out;
    }
    let req = 0;
    if (red !== black) {
      const r = solve(exp.n + 0, [...exp.els, { t: "V", a: red, b: black, e: 1, kind: "dc" }]);
      const i = Math.abs(r.iv[r.iv.length - 1]);
      req = i < 1e-8 ? Infinity : 1 / i;
    }
    const mult = sel.range;
    const f = clampF(Number.isFinite(req) ? (k * RC) / (RC + req / mult) : 0);
    out.f = f;
    out.value = req;
    out.ready = true;
    out.scaleReading = f > 0.0001 ? RC * (1 / f - 1) : Infinity;
    if (Math.abs(k - 1) > 0.02)
      out.notes.push({
        kind: "warn",
        text: "Kalibrasi nol belum tepat! Hubungkan kedua probe (titik yang sama), lalu putar 0 Ω ADJ hingga jarum tepat di 0 Ω.",
      });
    if (red === black) out.notes.push({ kind: "info", text: "Kedua probe pada titik yang sama (hubung singkat): jarum harus menunjuk 0 Ω." });
    if (!Number.isFinite(req)) out.notes.push({ kind: "info", text: "Tak ada hubungan antara kedua probe: hambatan tak hingga (∞)." });
    else if (red !== black && f < 0.12) out.notes.push({ kind: "info", text: "Jarum terlalu ke kiri. Gunakan pengali lebih besar agar jarum mendekati tengah skala (lebih teliti)." });
    else if (red !== black && f > 0.9) out.notes.push({ kind: "info", text: "Jarum terlalu ke kanan. Gunakan pengali lebih kecil agar lebih teliti." });
    return out;
  }

  // Fungsi V / mA
  if (red === null || black === null) {
    out.notes.push({ kind: "info", text: "Pilih titik ukur: klik terminal pada papan percobaan untuk memasang probe merah (+) dan hitam (−)." });
    return out;
  }
  const fn = sel.func;
  const wrongType =
    (fn === "DCV" && isAC) ||
    (fn === "DCA" && isAC) ||
    (fn === "ACV" && !isAC);
  if (wrongType) {
    out.notes.push({
      kind: "warn",
      text: isAC
        ? "Sumber adalah arus BOLAK-BALIK (AC). Gunakan fungsi AC V."
        : "Sumber adalah arus SEARAH (DC). Gunakan fungsi DC V atau DC mA, bukan AC V.",
    });
    out.ready = true;
    out.value = 0;
    out.f = 0;
    out.scaleReading = 0;
    return out;
  }

  const kind = fn === "ACV" ? "ac" : "dc";
  const els: El[] = exp.els.map((e) => (e.t === "V" && e.kind !== kind ? { ...e, e: 0 } : e));
  let value = 0;
  if (red !== black) {
    if (fn === "DCA") {
      const r = solve(exp.n, [...els, { t: "R", a: red, b: black, r: 1 }]);
      const I = (r.v[red] - r.v[black]) / 1;
      value = I * 1000;
      if (Math.abs(I) > 0.5) out.fuse = true;
    } else {
      const r = solve(exp.n, els);
      value = r.v[red] - r.v[black];
      if (fn === "ACV") value = Math.abs(value);
    }
  }
  out.value = value;
  out.ready = true;
  out.f = clampF(value / sel.range);
  out.scaleReading = out.f * sc.fs;

  if (out.fuse) {
    out.notes.push({
      kind: "danger",
      text: "💥 Arus terlalu besar! Ampermeter dipasang PARALEL pada sumber (hubung singkat) — sekering putus. Ampermeter harus dipasang SERI.",
    });
    return out;
  }
  if (red === black) out.notes.push({ kind: "info", text: "Kedua probe pada titik yang sama: tidak ada beda potensial." });
  if (value < -0.02 * sel.range && fn !== "ACV")
    out.notes.push({ kind: "warn", text: "Jarum bergerak ke kiri: polaritas terbalik. Tukar probe — merah ke titik berpotensial lebih tinggi (+)." });
  if (value > sel.range)
    out.notes.push({ kind: "danger", text: "Jarum melewati batas ukur! Segera putar ke batas ukur yang lebih besar." });
  else if (value > 0 && value < 0.15 * sel.range && SELECTORS.some((s) => s.func === fn && s.range < sel.range))
    out.notes.push({ kind: "info", text: "Jarum simpangannya kecil. Gunakan batas ukur lebih kecil agar pembacaan lebih teliti." });
  if (fn === "DCA" && exp.type === "dca" && Math.abs(value) < 1e-6 && red !== black)
    out.notes.push({ kind: "info", text: "Tidak ada arus mengalir. Pasang ampermeter SERI pada celah rangkaian (A dan B)." });
  return out;
}

/** Hasil jawaban benar & toleransi untuk percobaan */
export function tolerance(sel: Sel, value: number) {
  if (sel.func === "OHM") return Math.max(Math.abs(value) * 0.12, 0.3 * sel.range);
  return sel.range * 0.025;
}
