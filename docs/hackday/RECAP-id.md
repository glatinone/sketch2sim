# Recap — Sketch2Sim @ MLH Hacktoberfest Hack Day Batam (31 Okt 2026)

Bahan mentah untuk seri blog dev.to. Semua angka di sini dari log nyata (`status/A.md`, `status/B.md`, `probe/`).

## Event
- **MLH Hacktoberfest Hack Day Kota Batam × Batam Innovation Center**, di Politeknik Negeri Batam (Technopreneur Centre). 11:00–16:00 WIB, build sampai 15:00, demo setelahnya, submission tutup 16:00.
- Tim 1–2 orang. Kiell ikut solo (dibantu dua sesi Claude Code).
- Dua kategori: **Best Use of Gemma 4** dan **Best Open-Source AI Project**.
- Juri menilai Technology, Design, Completion, dan Learning dengan bobot sama. Pitch dan ide **tidak** dinilai; live demo diutamakan.
- Resource di halaman event: dokumentasi Gemma 4, **Wokwi** (simulator Arduino/ESP32), dan **Arduino UNO Q**.

## Memilih ide
- Kandidat awal: `prompt-guard-action` (linter prompt injection), `mfa-canary`, `tix-gate-mock`, **CircuitLens** (debug foto breadboard), **Sketch2Sim** (sketsa → Wokwi), `Sketch2ThreatModel`.
- Analisis: Sketch2Sim satu-satunya ide yang memakai semua resource event (Gemma 4 + Wokwi + Arduino). Tapi spec awalnya (simulator SVG sendiri, firmware hybrid UNO Q, UI CAD 3 panel) terlalu besar untuk 2,5 jam.
- Ditanyakan ke **Jev** (model keputusan, `typesafe/jev-1.13`): memilih **Sketch2Sim versi dipangkas** dengan probabilitas 0,73; peluang spec lengkap selesai tepat waktu dinilai 0,03.
- Keputusan: buang simulator buatan sendiri, **Wokwi asli jadi simulatornya**. Gemma hanya boleh memilih dari katalog part Wokwi, lalu validator deterministik membetulkan output-nya.

## Cara kerja: dua Claude Code paralel
- **Session A (Engine)**: client Gemma, prompt, katalog part, validator, builder diagram.json + firmware.
- **Session B (App)**: scaffold Vite/React/Tailwind, kanvas, upload/kamera, panel hasil, preset, README, GitHub, Pages, lalu deck + video.
- Anti-bentrok: **kepemilikan file** (bukan branch). Satu file kontrak `contract/types.ts` dibekukan di awal, satu fungsi `compileSketch()` sebagai satu-satunya titik temu, dan masing-masing session hanya menulis di status file-nya sendiri (`status/A.md`, `status/B.md`).
- Session A sendiri memakai subagent paralel: (1) membuat API key di AI Studio lewat browser Kiell + probe Gemma 4, (2) riset nama pin Wokwi dari sumber resmi, (3) verifikasi hasil di Wokwi asli, (4) tes end-to-end, (5) mengisi form submission (dihentikan sebelum Submit, atas permintaan Kiell).

## Timeline (WIB)
| Jam | Kejadian |
|---|---|
| ~12:31 | Plan, contract, dan brief dua session ditulis |
| 12:39 | B: scaffold siap |
| 12:43 | A: API key dibuat, Gemma 4 terbukti bisa baca gambar + JSON mode |
| ~12:50 | A: engine lengkap, tes offline: 1 output rusak → validator membetulkan 20 hal |
| 12:52 | **ENGINE READY**: compile live pertama berhasil |
| 12:56 | B: UI lengkap, terhubung ke engine asli |
| 13:02 | B: README, CONTRIBUTING, MIT, repo public `glatinone/sketch2sim` |
| 13:08 | A: 3 preset + hasil cadangan (CACHED) |
| ~13:15 | Latency dipangkas dari 104 detik → ~30 detik |
| 13:18 | A: perbaiki bug cadangan yang ditemukan B; ENGINE.md |
| 13:35 | 5/5 rangkaian terverifikasi jalan di Wokwi asli; B: deck 13 slide |
| 13:48 | Tes end-to-end lewat web app live → Wokwi: lolos |
| ~13:55 | Form MLH terisi, ditahan untuk review (tab sempat hilang, diisi ulang) |
| ~14:35 | Video demo di YouTube (unlisted) + deck PDF online di Pages |
| ~14:50 | **Submission dikirim oleh Kiell** (Best Use of Gemma 4 + Best Open-Source AI Project) |
| 15:10+ | Mobile-first UI live; artikel dev.to part 1 dibuat sebagai draft |

## Angka nyata
- Model: `gemma-4-26b-a4b-it` (8/8 berhasil). `gemma-4-31b-it` hanya 3/8 berhasil di free tier (500/503), ±60 detik.
- Latency awal 45–104 detik. Satu run: 3.209 token "thinking" + 1.637 token jawaban, ±47 token/detik → 104 detik. `thinkingBudget` dan `thinkingLevel` ditolak API untuk Gemma 4.
- Setelah prompt "jawab singkat, jangan deliberasi panjang": **0 token thinking, 26–34 detik**, kualitas sama.
- 6/6 sketsa jadi rangkaian valid. 5/5 yang dites jalan benar di Wokwi.
- Validator menangkap **buzzer terpasang terbalik** dua kali (parking-sensor, air-piano).
- Tes E2E: compile live 38,7 detik di web app.

## Masalah & pelajaran (bahan cerita)
1. **API key format baru `AQ.`** hanya diterima lewat `?key=`, ditolak lewat header `x-goog-api-key`.
2. **Env var lama** `GEMINI_API_KEY` berisi key proxy `sk-...` membuat semua call gagal "API key not valid", padahal key baru valid.
3. **Gemma suka menaruh newline mentah di string JSON** (kode Arduino) → parser harus escape sendiri.
4. **Thinking mendominasi latency**; prompt pendek lebih efektif daripada parameter (yang ditolak).
5. **Nama pin = titik lemah model vision.** Topologi dibaca bagus, detail listrik (polaritas, nama pin) tidak.
6. **Bug `import.meta.glob`**: guard `typeof import.meta.glob === "function"` selalu false di runtime Vite → cadangan tidak pernah muncul. Ditemukan oleh Session B, diperbaiki Session A.
7. **Wokwi butuh library Servo** (1 klik "Install Servo library").
8. **Kecepatan simulasi Wokwi turun ke 3–10%** saat CPU sibuk (banyak tab + render video).
9. Kerja paralel dua agent berhasil karena **batas kepemilikan file**, bukan karena git.

## Output
- Repo: https://github.com/glatinone/sketch2sim (MIT)
- Web app: https://glatinone.github.io/sketch2sim/
- Engine write-up: `sketch2sim/src/engine/ENGINE.md`
- Video demo: https://youtu.be/bYefFiPMhnQ
- Vertical short (36 s, media/Sketch2Sim-short-9x16.mp4): YouTube Shorts https://youtube.com/shorts/26oKRjytSj4 · TikTok https://www.tiktok.com/@glatinone/video/7702759250539367701
- Deck: https://glatinone.github.io/sketch2sim/Sketch2Sim-deck.pdf
- Series dev.to "Hackathon log" (4 part, published 31 Okt 2026 15:02 WIB):
  1. https://dev.to/kielltampubolon/from-a-paper-sketch-to-a-running-circuit-building-sketch2sim-with-gemma-4-in-one-hack-day-2ndm
  2. https://dev.to/kielltampubolon/two-claude-code-sessions-one-folder-no-merge-conflicts-how-i-split-a-hackathon-build-between-ai-3d5n
  3. https://dev.to/kielltampubolon/what-gemma-4-vision-gets-right-about-circuit-sketches-and-the-validator-that-fixes-the-rest-g18
  4. https://dev.to/kielltampubolon/from-arduino-sketches-to-digital-twins-where-sketch2sim-goes-next-and-how-to-get-involved-2bcb
- GitHub good first issues #1-#5: https://github.com/glatinone/sketch2sim/labels/good%20first%20issue
- Ilustrasi blog: sketch2sim/public/blog/*.png
- Hasil lomba: [TODO]
