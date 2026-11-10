/**
 * Audio opening LAB MAYA
 *  - Musik latar: instrumental teknologi ringan (disintesis langsung di browser, tanpa file audio)
 *  - Narasi: Web Speech API (suara Indonesia). Untuk dubbing asli, isi NARASI_AUDIO di Opening.tsx.
 */

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Progresi Am – F – C – G (nada MIDI)
const CHORDS: { bass: number; pad: number[]; arp: number[] }[] = [
  { bass: 45, pad: [57, 60, 64], arp: [69, 72, 76, 72] },
  { bass: 41, pad: [57, 60, 65], arp: [69, 72, 77, 72] },
  { bass: 48, pad: [55, 60, 64], arp: [67, 72, 76, 72] },
  { bass: 43, pad: [55, 59, 62], arp: [67, 71, 74, 71] },
];

export class TechMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private bpm = 104;
  private noise: AudioBuffer | null = null;

  start() {
    if (this.ctx) {
      void this.ctx.resume();
      this.fadeTo(0.5, 0.6);
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2600;
    master.connect(lp).connect(ctx.destination);
    this.master = master;

    const len = ctx.sampleRate * 0.1;
    const nb = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = nb;

    this.nextTime = ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 60);
    this.fadeTo(0.5, 1.5);
  }

  private fadeTo(v: number, sec: number) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(v, t + sec);
  }

  duck(on: boolean) {
    this.fadeTo(on ? 0.28 : 0.5, 0.4);
  }

  private tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private tick(t: number, vol: number) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(hp).connect(g).connect(this.master!);
    s.start(t);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    const stepDur = 60 / this.bpm / 2; // not ke-8
    while (this.nextTime < ctx.currentTime + 0.25) {
      const bar = Math.floor(this.step / 8) % CHORDS.length;
      const pos = this.step % 8;
      const c = CHORDS[bar];
      const t = this.nextTime;
      if (pos === 0) {
        this.tone(NOTE(c.bass), t, stepDur * 7.5, "sine", 0.22);
        c.pad.forEach((n) => this.tone(NOTE(n), t, stepDur * 8, "triangle", 0.05));
      }
      if (pos % 2 === 0) this.tone(NOTE(c.arp[(pos / 2) | 0]), t, stepDur * 1.6, "triangle", 0.09);
      if (pos % 2 === 1) this.tone(NOTE(c.arp[(pos >> 1) % 4] + 12), t, stepDur * 0.9, "sine", 0.035);
      if (pos % 2 === 1) this.tick(t, 0.03);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  stop(fade = 1) {
    if (!this.ctx) return;
    this.fadeTo(0, fade);
    const ctx = this.ctx;
    const timer = this.timer;
    window.setTimeout(() => {
      if (timer) window.clearInterval(timer);
      void ctx.close();
    }, fade * 1000 + 100);
    this.ctx = null;
    this.master = null;
    this.timer = null;
  }
}

/* ───────── Narasi ───────── */
let cachedVoice: SpeechSynthesisVoice | null | undefined;
let maleFound = false;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null;
  if (cachedVoice) return cachedVoice;
  const list = speechSynthesis.getVoices().filter((v) => /^id([-_]|$)/i.test(v.lang));
  if (!list.length) return null;
  const male = list.find((v) => /ardi|rizki|andika|male|pria|laki/i.test(v.name));
  maleFound = !!male;
  cachedVoice = male ?? list[0];
  return cachedVoice;
}

if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.addEventListener?.("voiceschanged", () => {
    cachedVoice = undefined;
    pickVoice();
  });
}

export const ttsSupported = () => typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";

export function stopSpeech() {
  if (ttsSupported()) speechSynthesis.cancel();
}

/** Ucapkan satu kalimat; selesai saat suara berakhir (atau timeout pengaman). */
export function speak(text: string, opts: { audioSrc?: string; voiceOn: () => boolean }): Promise<void> {
  return new Promise((resolve) => {
    const est = text.length * 62 + 900;
    let done = false;
    let audio: HTMLAudioElement | null = null;
    const fin = () => {
      if (done) return;
      done = true;
      window.clearTimeout(guard);
      resolve();
    };
    const on = opts.voiceOn();
    const guard = window.setTimeout(fin, on ? est * 2.4 + 2500 : est);
    if (!on) return;

    if (opts.audioSrc) {
      audio = new Audio(opts.audioSrc);
      audio.onended = fin;
      audio.onerror = fin;
      void audio.play().catch(fin);
      return;
    }
    if (!ttsSupported()) return;
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    u.lang = "id-ID";
    if (v) u.voice = v;
    u.rate = 1.04;
    u.pitch = v && maleFound ? 1.05 : 0.8; // suara dibuat lebih "laki-laki muda" bila tidak ada suara pria
    u.onend = fin;
    u.onerror = fin;
    speechSynthesis.speak(u);
  });
}
