# Eksplorasi Desain — Workshop Collective

## Tiga Arah Pendekatan

### 1. Software Almanac
**Very Brief Intro:** Sebuah editorial digital yang terasa seperti katalog kerja modern: tenang, terkurasi, dan penuh keyakinan. Produk diperlakukan sebagai artefak yang pantas ditelusuri, bukan kartu SaaS generik.

**Probability:** 0.07

### 2. Studio Field Notes
**Very Brief Intro:** Arah yang terinspirasi dari jurnal studio independen—lebih organik, penuh anotasi, dan sedikit eksperimental. Menonjolkan proses berpikir serta kedekatan terhadap problem sehari-hari.

**Probability:** 0.03

### 3. Precision Utility
**Very Brief Intro:** Arah yang sangat terstruktur dan taktis, dengan kontras navy–putih serta detail teknis yang hemat. Mengutamakan rasa stabil, presisi, dan efisiensi tanpa menjadi dingin.

**Probability:** 0.08

---

## Pendekatan Terpilih: Software Almanac

### Design Movement
**Contemporary editorial minimalism** bertemu **Japanese product catalog restraint**. Setiap halaman terasa seperti lembaran katalog yang diedit dengan teliti: informasi mengalir dalam ritme vertikal, tidak dikurung oleh dashboard atau kumpulan kartu seragam.

### Core Principles
1. **Produk adalah protagonis.** Mockup antarmuka besar, berlapis, dan kontekstual menjadi visual utama, sementara dekorasi dipakai hanya untuk memperjelas fokus.
2. **Asimetri yang disiplin.** Komposisi memakai kolom offset, garis penunjuk, dan ruang kosong yang sengaja dibiarkan untuk menciptakan rasa editorial.
3. **Hangat namun presisi.** Material visual lembut (cream, paper grain, shadow tipis) diseimbangkan dengan tipografi navy yang tajam dan struktur data yang jelas.
4. **Cerita sebelum daftar fitur.** Setiap produk berangkat dari ketegangan kerja nyata, lalu memperlihatkan perubahan yang diberikan produk tersebut.

### Color Philosophy
Latar **paper cream** memberi rasa terbuka dan human, seolah laman ini adalah ruang kerja yang siap dipakai; **deep ink navy** membawa ketegasan, kejelasan, dan kepercayaan; **vermilion coral** digunakan sebagai tanda aksi, sorotan, serta elemen hidup—bukan sebagai dekorasi dominan. Hijau sage yang sangat lembut hanya menambah keseimbangan pada visual produk.

### Layout Paradigm
Halaman dibangun seperti **serial editorial**: label kecil di tepi, headline besar yang melintasi kolom, dan panel produk yang memotong ritme halaman secara terarah. Alih-alih section berpusat penuh, copy sering ditempatkan pada seperempat kiri sementara UI product frame bergerak offset ke kanan atau melintasi lebar layar.

### Signature Elements
1. **Product folios:** mockup layar dengan tab indeks, nomor artefak, dan caption kecil seperti dokumen yang dapat ditelusuri.
2. **Coral index marks:** garis, titik, serta badge angka coral sebagai penanda narasi dan titik interaksi.
3. **Paper rules:** garis batas navy ber-opacity rendah yang membentuk struktur tanpa membuat setiap bagian menjadi kartu.

### Interaction Philosophy
Interaksi terasa seperti membuka atau menggeser lembaran katalog: hover pada produk menggeser frame beberapa piksel, mengganti indeks, dan menampilkan CTA. Navigasi selalu jelas dan tenang; interaksi tidak digunakan sebagai atraksi yang mengganggu pembacaan.

### Animation
Gunakan reveal dengan opacity dan translate Y kecil (10–18px) saat elemen masuk viewport, dengan stagger 40–70ms. Product folio boleh bergerak 3–6px terhadap pointer di desktop dan kembali dengan easing lembut. Hover berlangsung 180–240ms menggunakan `cubic-bezier(0.23, 1, 0.32, 1)`; tombol menekan hingga `scale(0.97)`. Semua gerak non-esensial dimatikan untuk `prefers-reduced-motion`.

### Typography System
**DM Serif Display** menjadi headline berkarakter, dipakai besar dengan line-height rapat dan sesekali italic untuk penekanan manusiawi. **Manrope** menangani UI dan body copy dengan tracking sedikit rapat, menjadikan informasi terasa modern dan bersih. Eyebrow/label memakai Manrope uppercase 11–12px dengan letter spacing tinggi; headline desktop bergerak dari 52–88px secara responsif.

### Brand Essence
**Workshop Collective membuat perangkat lunak yang membuang kerumitan dari kerja penting—untuk tim yang ingin bergerak dengan lebih jelas.**

Kepribadian: **thoughtful, capable, grounded**.

### Brand Voice
Headline bersifat lugas dan berirama, menunjukkan manfaat tanpa jargon. CTA terdengar seperti undangan yang spesifik, bukan ajakan generik.

Contoh: “Kerja yang rumit tidak harus terasa berat.”

Contoh: “Lihat bagaimana satu alur bisa menggantikan lima tools.”

### Wordmark & Logo
Wordmark **Workshop Collective** menggunakan serif yang sedikit condensed dengan slash indeks coral. Logo mark adalah dua bidang bersudut yang saling mengunci membentuk huruf **W** abstrak—melambangkan bagian kerja yang menjadi satu alur. Mark berdiri sendiri dengan warna navy di atas cream.

### Signature Brand Color
**Workshop Coral — `#F05A43`**: coral yang matang dan hangat, selalu dipakai dengan disiplin sebagai aksen atau action cue.

## Style Decisions

- Jangan memakai gradien neon, glassmorphism, atau dekorasi futuristik yang tidak membantu cerita produk.
- Hindari kumpulan kartu seragam; gunakan panel/folio yang beraneka skala namun tetap berbasis aturan kertas.
- Semua teks di atas visual produk harus memiliki latar atau overlay yang menjamin kontras.
- Wordmark Workshop Collective menggunakan treatment serif yang condensed dengan coral index slash yang terkontrol, bukan lockup sans generik.
- Workshop Coral `#F05A43` diprioritaskan sebagai indeks, penekanan, atau action cue; bidang coral besar selalu diperlakukan sebagai editorial plate dengan label dan paper rule.
