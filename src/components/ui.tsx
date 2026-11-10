import { useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

export function Card({
  children,
  className,
  title,
  icon,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5", className)}>
      {title && (
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
          {icon && <span className="text-lg">{icon}</span>}
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

export function Btn({
  children,
  onClick,
  variant = "ghost",
  className,
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "success";
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const styles = {
    primary: "bg-sky-600 text-white hover:bg-sky-700 shadow-sm",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  }[variant];
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SubTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; icon: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-200/70 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
            value === t.id ? "bg-white text-sky-700 shadow" : "text-slate-600 hover:text-slate-900",
          )}
        >
          <span className="mr-1">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-700">
      <span
        className={cn("relative h-5 w-9 rounded-full transition", checked ? "bg-sky-600" : "bg-slate-300")}
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
      {label}
    </label>
  );
}

export function Readout({
  label,
  value,
  unit,
  accent = "text-sky-700",
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={cn("font-mono text-xl font-bold", accent)}>
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

type Result = null | "ok" | "bad" | "notready";

/**
 * Panel jawaban: siswa mengetik hasil pembacaan, lalu diperiksa.
 * Gunakan prop `key` agar panel di-reset setiap soal/konfigurasi baru.
 */
export function AnswerPanel({
  unit,
  truth,
  tol,
  decimals = 2,
  ready = true,
  notReadyMsg,
  explain,
  onNext,
  nextLabel = "Soal berikutnya",
  onResult,
}: {
  unit: string;
  truth: number;
  tol: number;
  decimals?: number;
  ready?: boolean;
  notReadyMsg?: string;
  explain: ReactNode;
  onNext?: () => void;
  nextLabel?: string;
  onResult?: (ok: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [res, setRes] = useState<Result>(null);
  const [attempts, setAttempts] = useState(0);
  const [show, setShow] = useState(false);

  const check = () => {
    const v = parseFloat(text.replace(",", "."));
    if (Number.isNaN(v)) return;
    if (!ready) {
      setRes("notready");
      return;
    }
    const ok = Math.abs(v - truth) <= tol;
    setRes(ok ? "ok" : "bad");
    setAttempts((a) => a + 1);
    if (ok) setShow(true);
    onResult?.(ok);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setRes(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && check()}
          inputMode="decimal"
          placeholder="Hasil pengukuran"
          className="w-44 rounded-lg border border-slate-300 px-3 py-2 font-mono text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        />
        <span className="font-semibold text-slate-600">{unit}</span>
        <Btn variant="primary" onClick={check} disabled={!text.trim()}>
          Periksa jawaban
        </Btn>
        {onNext && (
          <Btn onClick={onNext}>{nextLabel} →</Btn>
        )}
      </div>

      {res === "ok" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          🎉 <b>Benar!</b> Pembacaan kamu tepat ({truth.toFixed(decimals)} {unit}).
        </div>
      )}
      {res === "bad" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          ❌ <b>Belum tepat.</b> Periksa kembali skala utama dan skala nonius/putarnya, lalu coba lagi
          {attempts >= 2 ? ". Kamu juga bisa melihat pembahasan di bawah." : "."}
        </div>
      )}
      {res === "notready" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ {notReadyMsg ?? "Atur alat terlebih dahulu sebelum menjawab."}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="text-sm font-semibold text-sky-700 underline-offset-2 hover:underline"
      >
        {show ? "Sembunyikan pembahasan" : "Lihat pembahasan / jawaban"}
      </button>
      {show && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-relaxed text-slate-700">
          {explain}
        </div>
      )}
    </div>
  );
}

export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
            {i + 1}
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  );
}

export const fmt = (n: number, d = 2) => n.toFixed(d).replace(".", ",");
