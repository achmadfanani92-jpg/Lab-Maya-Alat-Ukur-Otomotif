# LAB MAYA – Opening + tema baru

Jalankan: `npm install` lalu `npm run dev` (atau `npm run build` → satu file HTML).

File baru/diubah
- src/components/Opening.tsx      – 4 adegan opening (sesuai ADEGAN_LAB_MAYA.pptx), subtitle, tombol MULAI PEMBELAJARAN
- src/components/openingAudio.ts  – musik instrumental teknologi (sintesis WebAudio) + narasi suara Indonesia
- src/assets/bengkel.jpg, mekanik.png – background bengkel & karakter mekanik
- src/index.css                   – palet navy/merah/abu-abu, font Poppins/Montserrat, animasi slide/zoom/fade/pop-up
- src/App.tsx                     – opening tampil dulu, header/beranda bertema baru, transisi halaman

Dubbing asli: isi NARASI_AUDIO di Opening.tsx, contoh { "1-0": "/audio/a1-0.mp3" } (kunci = "adegan-baris").

## Tampilan lab 16:9 satu layar
- Seluruh lab berada di panggung 1920×1080 yang otomatis diskalakan mengikuti ukuran jendela (tidak perlu geser ke bawah).
- Di layar yang bukan 16:9 akan muncul bidang gelap di tepi (letterbox) agar proporsi tetap utuh.
- Tata letak mengikuti versi layar lebar (breakpoint dikunci di src/index.css).
- Disarankan dibuka pada layar landscape (laptop/PC/tablet mendatar).
