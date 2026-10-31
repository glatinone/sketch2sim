# Sketch2Sim — Demo Playbook (full digital, 2 menit)

Satu kalimat: **"From a paper sketch to a running circuit."** (versi panjang: "Every hardware idea starts as a sketch on paper. Sketch2Sim turns that paper sketch into a running circuit.")

---

## 1. Story (kenapa juri harus peduli)

| Babak | Isi | Bukti di layar |
|---|---|---|
| **Masalah** | Di lab elektronika (Polibatam, maker), ide selalu mulai dari coretan. Dari coretan ke rangkaian yang jalan itu lama: pilih pin, pasang resistor, tulis firmware, debug kabel terbalik. | Foto sketsa di kertas |
| **Ide** | Kasih coretan itu ke Gemma 4 (multimodal). Dia membaca gambar dan mengeluarkan rangkaian lengkap + firmware. | Tombol Compile |
| **Twist (bagian teknis)** | AI bisa salah: mengarang nama pin, memasang buzzer terbalik, lupa resistor. Jadi output Gemma **tidak dipercaya buta**: setiap kabel dicek oleh validator deterministik yang mengunci komponen ke katalog Wokwi asli dan membetulkan kesalahan otomatis. | Chip "Auto-fixed by validator" + tabel kabel dengan alasan per pin |
| **Bukti** | Hasilnya ditempel ke **Wokwi asli**, tekan Play, dan rangkaian dari coretan tangan langsung jalan. | Lampu lalu lintas menyala di Wokwi |
| **Penutup** | Open source, dibangun hari ini, siap dikembangkan (ESP32, Arduino UNO Q). | Link GitHub |

---

## 2. Workflow (alur sistem)

```
 [Foto kertas / gambar di kanvas]
            │  JPG/PNG (base64)
            ▼
 ┌──────────────────────┐
 │  Gemma 4 26B (vision) │  membaca kotak + garis + catatan
 │  via Gemini API       │  → JSON: parts, wires, firmware
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │  Validator (kode kita)│  katalog 9 part Wokwi, alias pin,
 │  deterministik        │  resistor 220Ω otomatis, servo → PWM,
 │                       │  polaritas terbalik, GND/5V yang lupa
 └──────────┬───────────┘
            ▼
 diagram.json  +  sketch.ino   ──copy/paste──▶   Wokwi ▶ jalan
```

## 3. Input → Output

| Input (yang kamu kasih) | Output (yang keluar) |
|---|---|
| Foto sketsa kertas (`demo/sketches/*.jpg`) **atau** gambar langsung di tab Draw | **Circuit**: judul, ringkasan, daftar komponen, tabel kabel (warna, jenis sinyal, alasan pemilihan pin) |
| Board: Arduino Uno | **Auto-fixed**: daftar perbaikan validator (bisa kosong kalau Gemma sudah benar) |
| | **diagram.json**: siap tempel ke Wokwi |
| | **sketch.ino**: firmware Arduino lengkap |
| | **Notes**: catatan listrik (mis. "install Servo library") |
| | Header: waktu proses (±30 detik) + model id |

## 4. Sketsa demo (sudah dites lewat engine)

| File | Isi | Hasil engine | Peran |
|---|---|---|---|
| `demo/sketches/01-traffic-light.jpg` | UNO + LED merah/kuning/hijau + BUTTON | 8 part, 11 kabel, ±34 detik | **Demo utama** (paling visual, tanpa library) |
| `demo/sketches/02-parking-gate.jpg` | UNO + BUTTON + SERVO + 2 LED | 7 part, 11 kabel, ±32 detik | Cadangan / demo kedua kalau ada waktu |
| `demo/sketches/03-air-piano.jpg` | UNO + ULTRASONIC + BUZZER + POT | 4 part, 9 kabel, 1 auto-fix (buzzer terbalik) | **Bukti validator**: tunjukkan kalau ditanya "AI-nya pernah salah?" |

---

## 5. Timeline demo (2:00)

Layar: **Tab 1 = Sketch2Sim**, **Tab 2 = Wokwi** (sudah terbuka di `wokwi.com/projects/new/arduino-uno`).

| Waktu | Kamu lakukan | Kamu ucapkan (EN / ID) |
|---|---|---|
| **0:00–0:10** | Tunjukkan foto sketsa traffic light di layar (tab Upload, preview besar). | "Every hardware idea starts like this: a sketch on paper. This one is a traffic light for a campus crossing." |
| **0:10–0:15** | Klik **Compile** (atau Ctrl+Enter). Progress mulai jalan. | "I give the photo to Gemma 4." |
| **0:15–0:45** | **Selama ±30 detik menunggu**, cerita. Jangan diam. | "Gemma 4 is multimodal: it reads the boxes, the lines, even my handwritten note about the light sequence. But AI makes mistakes: it invents pin names, it puts a buzzer in backwards. So we never trust it blindly. Every wire goes through our own validator, locked to real Wokwi parts. Wrong pins get fixed, missing resistors get added." |
| **0:45–1:05** | Hasil muncul. Scroll tabel kabel, hover 1 alasan pin. Tunjuk chip auto-fixed (kalau kosong: "the validator checked all 11 wires, nothing to fix this time"). | "Three LEDs, each with a 220-ohm resistor. It even explains why it picked each pin." |
| **1:05–1:30** | Copy **diagram.json** → Tab 2 Wokwi → tab diagram.json → Ctrl+A, Ctrl+V. Copy **sketch.ino** → tab sketch.ino → Ctrl+A, Ctrl+V. Klik canvas lalu ⋮ → Fit. | "Now the real test. This is Wokwi, a real Arduino simulator. Paste the circuit, paste the firmware…" |
| **1:30–1:45** | Tekan **▶ Play**. Merah menyala. Klik-tahan tombol hijau → merah mati → hijau 3 detik → kuning → merah. | "…press play. Red. I press the pedestrian button… green, yellow, red. From a paper sketch to a running circuit in under a minute." |
| **1:45–2:00** | Kembali ke Tab 1, tunjuk badge Gemma 4 + link GitHub. | "Built today, open source, with Gemma 4 and a deterministic validator. Next: ESP32 and Arduino UNO Q. Thank you!" |

**Kalau juri kasih waktu lebih:** upload `03-air-piano.jpg` dan tunjukkan validator membetulkan buzzer yang terbalik.

---

## 6. Rencana cadangan

| Masalah | Langkah |
|---|---|
| Compile > 60 detik atau error | Tab **Presets** → pilih preset → hasil muncul dengan badge **CACHED** (jujur, jangan disembunyikan). Lanjut paste ke Wokwi seperti biasa. Bilang: "Live API is slow right now, this is the last real result from the same pipeline." |
| Wokwi minta "Install Servo library" | Klik tombol **INSTALL "SERVO" LIBRARY** di dialog, tekan Play lagi (±5 detik). Hanya terjadi di sketsa yang pakai servo. |
| Wokwi tanya "Leave site?" | Klik Leave (projek baru, tidak ada yang hilang). |
| Simulasi lambat (speed % rendah) | Tutup tab lain, pastikan tab Wokwi di depan. Speed % kelihatan di pojok simulator. |
| Internet mati total | Screenshot hasil Wokwi di `probe/wokwi-check/` (traffic-*, servo-*, parking-*) sebagai bukti terakhir. |

**Jangan tekan huruf F waktu kursor ada di editor kode** (akan mengetik "f" ke diagram.json). Pakai ⋮ → Fit, atau klik canvas dulu.

---

## 7. Checklist 10 menit sebelum demo

- [ ] Tab 1: Sketch2Sim jalan (`npm run dev`), API key sudah diisi di Settings, model `gemma-4-26b-a4b-it`.
- [ ] Tab 2: `wokwi.com/projects/new/arduino-uno` terbuka; klik tab **diagram.json** sekali (supaya editornya siap).
- [ ] Zoom browser 125% supaya terbaca dari jauh. Tutup tab lain dan notifikasi.
- [ ] Sekali latihan penuh dengan `01-traffic-light.jpg` (sekaligus memanaskan API).
- [ ] **Cek angka speed % di simulator Wokwi saat latihan, harus mendekati 100%.** Waktu dites lewat browser otomatis cuma 2–4% (1 siklus lampu = 3,5 menit!). Kalau di Edge biasa masih rendah: tutup tab lain, matikan Efficiency mode Edge (⋯ → Settings → System and performance), colok charger.
- [ ] File `demo/sketches/*.jpg` gampang dicari di dialog Upload.
- [ ] Tab Presets sudah dicoba sekali (pastikan badge CACHED muncul).

## 8. Pertanyaan juri yang mungkin muncul

| Pertanyaan | Jawaban singkat |
|---|---|
| Apa bedanya dengan Wokwi? | "Wokwi runs circuits. Sketch2Sim writes them for you, from a paper sketch, and checks them before you press play." Kita satu langkah sebelum Wokwi: di Wokwi kamu menaruh part, menarik kabel, dan menulis kode sendiri; di sini cukup coretan → hasil siap tempel. |
| Kenapa Gemma 4? | Open-weights, multimodal, bisa dijalankan sendiri. Di sini dipakai lewat Gemini API, model `gemma-4-26b-a4b-it`. |
| Bagaimana kalau AI-nya salah? | Itu inti desainnya: validator deterministik. Contoh nyata: di sketsa air piano Gemma memasang buzzer terbalik, dan validator membetulkannya otomatis. |
| Kenapa lama ±30 detik? | Model berpikir sebelum menjawab. Awalnya 100 detik; kami tuning prompt sampai ±30 detik. |
| Bisa board lain? | Arsitekturnya per-katalog. ESP32 dan Arduino UNO Q tinggal menambah katalog part + pin; sudah jadi good-first-issue di repo. |
| Ini hardware beneran? | Wokwi mensimulasikan Arduino Uno asli; diagram.json + sketch.ino yang sama bisa dirakit dan di-upload ke board fisik. |
| Apa yang kamu pelajari? | Model vision bagus membaca topologi, tapi lemah di detail listrik (nama pin, polaritas). Pembagian kerja AI = memahami maksud, kode = menjamin kebenaran, itu yang bikin hasilnya bisa dipercaya. |
