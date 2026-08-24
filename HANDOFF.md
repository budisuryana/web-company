# HANDOFF — Workshop Collective (Lokal)

Catatan semua perubahan & keputusan agar pekerjaan tidak diulang dari awal.
Terakhir diperbarui: 2026-08-24.

---

## 1. Konteks Proyek

- **Workshop Collective**: company profile/portfolio + CMS, hasil template full-stack Manus.
- Awalnya MySQL (Drizzle + mysql2), OAuth Manus untuk login, storage S3 via Forge.
- **Kondisi sekarang**: dijalankan murni lokal dengan **PostgreSQL**, upload fallback disk, dan jalur login lokal khusus development.
- Stack: React 19 + Vite + Tailwind 4, Express + tRPC v11, Drizzle ORM, Vitest, pnpm.

---

## 2. Environment Lokal (PENTING)

| Hal | Nilai | Catatan |
|---|---|---|
| Postgres | **Homebrew postgresql@14, port 5433** | Port 5432 **sudah diduduki PostgreSQL 17** (installer EDB, `/Library/PostgreSQL/17`, milik user `postgres`, password tidak kita pegang). JANGAN ganggu instance itu. |
| Start service | `brew services start postgresql@14` | Config port ada di `/opt/homebrew/var/postgresql@14/postgresql.conf` (`port = 5433`). |
| Database | `workshop_collective` | Superuser = `budi` (auth trust di localhost). |
| DATABASE_URL | `postgresql://127.0.0.1:5433/workshop_collective` | Ada di `.env` (tidak di-commit, sudah gitignored). |
| `.env` lain | `JWT_SECRET` (random string), `VITE_APP_ID=local-workshop-collective` (**wajib non-empty!**), `OAUTH_SERVER_URL=` kosong, `OWNER_OPEN_ID=` kosong | |

### Gotcha .env
- `VITE_APP_ID` kosong → session JWT gagal validasi (`Session payload missing required fields`), login tampak gagal padahal cookie ter-set.
- `tsx watch` TIDAK me-reload saat `.env` berubah → restart manual dev server.

---

## 3. Migrasi MySQL → PostgreSQL (2026-08-24)

File yang diubah:

| File | Perubahan |
|---|---|
| `drizzle/schema.ts` | `mysql-core` → `pg-core`: `pgTable`, `pgEnum` (`user_role`, `product_status`, `publication_status`), `serial` id untuk users, `jsonb` untuk capabilities/workflowSteps/detail |
| `server/db.ts` | Driver `postgres` (postgres.js); `onDuplicateKeyUpdate` → `onConflictDoUpdate({ target: users.openId })` |
| `drizzle.config.ts` | `dialect: "postgresql"` + `import "dotenv/config"` agar `pnpm db:push` baca `.env` |
| `package.json` | Hapus `mysql2`, tambah `postgres ^3.4.7` |
| `drizzle/0000_romantic_galactus.sql` + `meta/` | Migrasi PG baru hasil generate; migrasi MySQL lama (0000, 0001) & `relations.ts` stub dihapus |

### Beda perilaku yang perlu diingat
1. **Seed otomatis tetap jalan** lewat `ensureRegistrySeeded()` pada request pertama (5 produk, 6 site content).
2. ⚠️ **`updatedAt` tidak lagi auto-update** — skema MySQL memakai `onUpdateNow()`, Postgres Drizzle tidak punya padanan. Update lewat CMS tidak menyentuh kolom timestamp. Kalau dibutuhkan, tambahkan trigger DB atau set manual di query.
3. `featured` tetap integer 0/1 (bukan boolean) demi minim churn.

---

## 4. Storage Lokal (fallback disk)

- `server/storage.ts`: kalau `BUILT_IN_FORGE_API_URL`/`BUILT_IN_FORGE_API_KEY` kosong → mode lokal, file ditulis ke **`.local-storage/`** (override via env `LOCAL_STORAGE_DIR`). URL balikan tetap `/manus-storage/{key}`.
- `server/_core/storageProxy.ts`: kalau Forge tidak terkonfigurasi → serve file dari disk (dengan guard path traversal); kalau terkonfigurasi → perilaku proxy Forge seperti semula.
- `.local-storage/` masuk `.gitignore`.
- Efeknya: upload logo/cover/screenshot di CMS **berfungsi penuh secara lokal**.

---

## 5. Auth Lokal untuk `/admin`

Tujuan: akses CMS tanpa deploy (OAuth Manus tidak tersedia lokal).

- **`server/_core/localAuth.ts`** (baru): endpoint `GET /api/auth/local-signin?role=admin|user&name=&redirect=`
  - Membuat/update user lokal (`openId = local_<slug>`), sign session JWT yang sama persis dengan alur OAuth, set cookie, redirect (default `/admin`).
  - **Gate keamanan**: route hanya terdaftar jika `NODE_ENV !== production` **dan** `OAUTH_SERVER_URL` kosong. Di deploy, route ini tidak akan pernah eksis.
- **`client/src/pages/AdminGuard.tsx`**: dua tombol ("Sign in as local admin / standard user") di layar login, hanya dirender saat `import.meta.env.DEV`.
- Cookie di http localhost pakai `sameSite: lax, secure: false` — `SameSite=None` tanpa Secure akan ditolak Chrome.
- Logout tetap pakai tRPC `auth.logout` yang ada.
- Role `user` sengaja bisa dipilih untuk menguji tampilan "access denied".

### Bootstrap admin di DB (manual, sekali)
Dibutuhkan karena aturan bisnis "minimal satu administrator":
```sql
INSERT INTO users ("openId", name, email, "loginMethod", role)
VALUES ('local-bootstrap-admin', 'Local Admin', 'admin@localhost', 'local', 'admin')
ON CONFLICT ("openId") DO NOTHING;
```
Sudah dieksekusi di database lokal. (Ingat: nama kolom camelCase WAJIB di-quote di psql.)

---

## 6. Testing

- `vitest.setup.ts` (baru): `import "dotenv/config"` — supaya 2 file integration test (`registry.router.test.ts`, `userManagement.router.test.ts`) konek ke Postgres lokal.
- `vitest.config.ts`: daftarkan `setupFiles`.
- Integration test menulis data sementara ke DB lokal lalu membersihkannya sendiri (afterAll).
- Status verifikasi terakhir: `pnpm check` bersih, **16/16 test pass**, homepage 200, tRPC admin 200 dengan cookie lokal.

---

## 7. Struktur Git

Temuan kunci: repo Manus aktif = **repo GitHub sendiri** (`origin` = `github.com/budisuryana/web-company`) — Manus mendorong update langsung ke sana. Tidak perlu remote kedua.

| Elemen | Fungsi |
|---|---|
| branch `main` @ 5c23794 | Cermin `origin/main`. Dilarang commit di sini (hook menolak). |
| branch `local/postgres` @ 7a4823b | SEMUA pekerjaan lokal hidup di sini. |
| tag `mysql-baseline` @ 5c23794 | Commit MySQL terakhir, acuan diff. |
| `.git/hooks/pre-commit` | Menolak commit di `main` dengan pesan panduan. |
| config `pull.ff only` | Pull non-fast-forward otomatis gagal (tidak ada merge silang). |

### Alur tarik update Manus
```bash
git checkout main
git pull --ff-only origin main     # ff-only: gagal aman kalau divergen
git checkout local/postgres
git merge main
pnpm install && pnpm check && pnpm test
```

### Playbook conflict
1. **`pnpm-lock.yaml`** → ambil versi mana pun lalu `pnpm install` (regenerasi). Jangan resolve manual.
2. **`drizzle/`** → migrasi MySQL baru dari Manus dibuang (pakai versi kita). TAPI jika `drizzle/schema.ts` mereka berubah (kolom/tabel baru), port manual perubahan itu ke schema pg, lalu `pnpm db:push`.
3. Jejak lokal terkonsentrasi di: `schema.ts`, `db.ts`, `package.json`, `storage.ts`, `storageProxy.ts`, `localAuth.ts`, `AdminGuard.tsx`, `index.ts` (2 baris), `vitest.*`, `.gitignore`.

### Aturan
- **Jangan push ke remote tanpa izin pemilik.** Backup opsional: `git push -u origin local/postgres`.
- Kalau suatu saat ternyata Manus pindah ke repo terpisah: `git remote add upstream <url>` lalu fetch dari situ; struktur branch tidak berubah.

---

## 8. Gotchas Operasional

- **Port ganda**: kalau dev server lama masih hidup, server baru pindah ke 3001 dan cookie/session terasa "rusak" karena hit server beda. Bunuh dulu: `pkill -f 'server/_core/index.ts'`.
- **psql nyasar**: selalu `-h 127.0.0.1 -p 5433`; koneksi ke 5432 = instance lama milik `postgres` (minta password).
- Warning pnpm "`pnpm` field ... no longer read" sudah ada sejak migrasi (terkait versi pnpm baru vs key `patchedDependencies`/`overrides` di package.json). Belum berdampak; jika patch wouter bermasalah, pindahkan key tersebut ke `pnpm-workspace.yaml`.

---

## 9. Log Perubahan (append-only)

- **2026-08-24** — Migrasi MySQL→PostgreSQL (schema, driver, config, migrasi baru); Postgres lokal Homebrew@14 port 5433 + database `workshop_collective`; storage fallback disk `.local-storage/`; auth lokal `/api/auth/local-signin` + tombol dev di AdminGuard; vitest setup dotenv; bootstrap admin row; struktur git (branch `local/postgres`, tag `mysql-baseline`, pre-commit guard, pull.ff only).
- **2026-08-24** — Perbaikan CMS prioritas:
  - **Cleanup media**: `storageRemove()` di `server/storage.ts` (lokal: unlink; Forge: skip + warning karena API tidak menyediakan delete). Dipakai saat hapus produk (`deleteRegistryProduct`), hapus screenshot, dan ganti logo/cover — file lama tidak lagi jadi yatim.
  - **updatedAt hidup lagi**: semua path update (`updateRegistryProduct`, reorder, `updateProductAsset`, `updateSiteContent`, ganti role user) kini set `updatedAt: new Date()` eksplisit.
  - **Slug duplikat → CONFLICT ramah**: pre-check `isSlugTaken()` di service (+ backstop PG `23505`) di-mapping router menjadi TRPCError `CONFLICT` dengan pesan jelas; editor menampilkan pesan itu di toast & highlight field slug. Auto-slug dari nama ternyata sudah ada di editor sejak awal.
  - **PENTING — timestamptz**: kolom timestamp MySQL→PG semula `timestamp without time zone` dan memicu skew ~7 jam (driver tulis UTC, dibaca lokal). Semua kolom kini `{ withTimezone: true }`; migrasi ALTER `0001_*.sql` sudah diterapkan. Jangan pernah pakai timestamp tanpa tz di PG.
  - Test baru `server/registry.slug.test.ts` (4 kasus: konflik create/rename, keep-own-slug, bump updatedAt). Total 20/20 pass.
- **2026-08-24** — Form produk editor (`AdminProductEditor.tsx`) dipecah jadi 4 tab (Identity / Story / Capabilities / Assets — tab Assets hanya untuk produk existing) memakai shadcn Tabs dengan gaya editorial (underline coral). Validasi gagal otomatis memindahkan ke tab yang berisi error; error slug dari server juga. Footer Cancel/Save tetap selalu terlihat di luar panel tab.
- **2026-08-24** — Halaman index `/admin/products` dirapikan: header lebih ringkas (judul 1 baris), baris tabel lebih padat (padding & ukuran font turun, thumbnail logo produk bila ada, info "updated X ago" via date-fns). Filter bar baru: pencarian (nama/slug/kategori), filter publication (published/draft), filter product status (active/planned/retired), toggle Featured-only, tombol Clear, empty-state + counter "N of M". Reorder tetap benar saat terfilter (swap posisi di list penuh, bukan di subset).
- **2026-08-24** — Polish layout `/admin/products` (spacing saja, tanpa ubah fungsi): container `max-w-5xl`; filter bar digabung ke panel list sebagai strip atas (border-b) sehingga toolbar + rows + footer jadi satu objek; footer counter dipindah ke dalam panel (tidak mengambang); grid row fixed `[52px_1fr_150px_92px]` agar kolom badge publikasi/status & tombol Edit rata antar-baris (badge diberi min-width + center); kontrol toolbar turun ke h-8, row padding py-2, ikon/logo h-8, panah reorder h-6.
- **2026-08-24** — Rapikan `/admin/products` putaran ketiga (alignment + rough edges, fungsi tidak berubah):
  - **Inset seragam `px-3`**: sebelumnya satu panel memakai 4 inset horizontal berbeda — toolbar `p-2.5` (10px), loading `p-4` (16px), empty-state `px-6` (24px), rows & footer `px-3` (12px). Tepi kiri toolbar/loading/empty karena itu tidak selurus baris tabel. Semua kini `px-3`.
  - **Track grid jadi satu sumber**: konstanta `rowTracks` dipakai bersama oleh header kolom dan setiap baris, jadi keduanya tidak bisa lagi drift. Track pakai `minmax(0,1fr)` (bukan `1fr`) supaya kolom nama produk benar-benar bisa menyusut dan `truncate` bekerja.
  - **Header kolom baru** (Product / Status), `hidden md:grid`, diberi `aria-hidden` karena baris ini `div` grid dan bukan `<table>` sungguhan — jadi label itu murni visual. Kolom 150px/92px sekarang terbaca sebagai keputusan, bukan angka acak.
  - **Error state baru + tombol "Try again"**: sebelumnya query yang gagal jatuh ke cabang `filtered.length === 0` dan tampil sebagai "The registry is empty." — menyesatkan. Catatan: **tidak ada halaman admin lain yang menangani error query** (`AdminContent`, `AdminUsers`, `AdminDashboard` hanya menangani `isLoading`), jadi pola yang sama masih perlu diterapkan di sana.
  - Chip `productStatus` diberi border agar seimbang dengan chip publication (sebelumnya teks polos di sebelah chip berlatar). a11y: `aria-label` pada dua tombol reorder ikon-saja, `aria-live="polite"` pada counter agar hasil filter diumumkan.
  - **Belum diubah (sengaja)**: semantik reorder saat terfilter. `move()` menukar posisi absolut di list penuh, jadi memindahkan produk bisa membuatnya melompati produk yang sedang tersembunyi filter. §9 entri sebelumnya mencatat ini sebagai perilaku yang diinginkan, jadi dibiarkan — tapi ini masih titik yang membingungkan kalau nanti mau ditinjau.
  - Verifikasi: `pnpm check` bersih, 20/20 test pass, `pnpm build` sukses, dan kelas Tailwind arbitrary dipastikan ter-generate di CSS hasil build (`grid-template-columns:52px minmax(0,1fr) 150px 92px`, `min-w-[74px]`, `min-w-[62px]`) — perlu dicek karena memindahkan kelas ke konstanta berisiko lolos dari pemindaian Tailwind. **Belum diverifikasi secara visual**: tidak ada driver browser (playwright/puppeteer) terpasang di mesin ini.
- **2026-08-24** — Lebar konten `/admin/products` dimaksimalkan (jarak ke sidebar terlalu jauh):
  - **Penyebab dominan ternyata `mx-auto` + `max-w-5xl`, bukan padding.** Cap 1024px yang di-center membuat sisa ruang dibagi dua, jadi gutter kiri tumbuh seiring lebar layar: 73px @1440, **217px @1728, 313px @1920**. Padding `main` hanya 32px dari total itu.
  - `AdminProducts.tsx`: container `mx-auto w-full max-w-5xl` → `w-full` (cap dilepas, tidak di-center lagi).
  - `DashboardLayout.tsx`: `<main>` `p-5 md:p-8` → `p-5 md:px-6 md:py-8` (padding horizontal 32→24px, vertikal tetap 32px). ⚠️ **Ini shell bersama — mempengaruhi kelima halaman admin.** Halaman lain masih punya cap sendiri dan tetap di-center, jadi efeknya di sana kecil.
  - Toolbar filter: kolom search `minmax(220px,1fr)` → `minmax(220px,340px)`. Tanpa ini, hilangnya cap membuat input search melar sampai ~1400px. Sisa ruang sekarang tertinggal di kanan (grid `justify-content: start`), jadi kontrol filter tetap mengelompok di kiri dan lurus dengan inset baris.
  - Hasil: gap ke sidebar **24px konsisten di semua lebar**; lebar konten 1024 → 1122px @1440, 1410px @1728, 1602px @1920.
  - ⚠️ **Konsekuensi yang belum ditangani**: lebar antar halaman admin kini tidak seragam — `AdminProducts` full-width, tapi `AdminProductEditor` `max-w-5xl`, `AdminDashboard`/`AdminUsers` `max-w-6xl`, `AdminContent` `max-w-4xl`, semuanya masih di-center. Klik "Edit" dari registry akan terasa menyempit mendadak. Untuk form (editor, site copy) measure sempit memang lebih baik dibaca, jadi ini dibiarkan sebagai keputusan terbuka — bukan sudah beres.
  - Di monitor ultra-wide (>2000px) kolom nama produk menyerap semua sisa ruang karena track-nya `minmax(0,1fr)`; kalau terasa terlalu renggang, tambahkan cap atas di container.
- **2026-08-24** — Overview / Site Copy / User Management disamakan dengan Product Registry (menutup konsekuensi tidak-seragam di entri sebelumnya):
  - Container luar `mx-auto max-w-*` → `w-full` di `AdminDashboard.tsx` (dari `max-w-6xl`), `AdminUsers.tsx` (dari `max-w-6xl`), `AdminContent.tsx` (dari `max-w-4xl`). Keempat halaman ini sekarang mulai di inset 24px yang sama dari sidebar, tanpa gutter centering.
  - **Overview & User Management**: cukup lepas cap, isinya sudah grid dan mengisi ruang dengan benar — stat cards `xl:grid-cols-5` jadi lega, kolom info user (`1fr`) dapat ruang lebih untuk email/openId yang tadinya cepat ter-truncate.
  - **Site Copy diperlakukan berbeda dan ini disengaja**: container `w-full` (header + h1 rata kiri seperti halaman lain), tapi kolom kartu editor diberi `max-w-3xl`. Alasannya: nilai site copy terpanjang hanya **158 karakter** (mayoritas 29–89), jadi textarea selebar ~1600px akan membuat headline 40 karakter membentang satu baris panjang — sulit dibaca dan diedit. Ini pola yang sama dengan Product Registry yang meng-cap input search ke `minmax(220px,340px)` di dalam panel full-width: panel ikut lebar, kontrol isian tidak. **Kalau ternyata memang mau textarea full-width, cukup hapus `max-w-3xl` di wrapper `mt-8 space-y-4`.**
  - Cap reading-measure di dalam halaman **sengaja dipertahankan**: `max-w-2xl` pada paragraf intro ketiga halaman, `max-w-sm`/`max-w-md` pada empty-state. Ini pembatas keterbacaan, bukan sisa layout lama.
  - `AdminProductEditor` **tetap** `mx-auto max-w-5xl` — tidak diminta dan memang form; melebarkan textarea deskripsi produk sampai 1600px tidak membantu. Jadi lompatan lebar saat klik "Edit" dari registry masih ada, sekarang sebagai satu-satunya sisa ketidakseragaman.
  - Verifikasi: `pnpm check` bersih, 20/20 test pass, `pnpm build` sukses, `.max-w-3xl` terkonfirmasi ada di CSS hasil build. Masih **belum diverifikasi visual** (tidak ada driver browser di mesin ini).
- **2026-08-24** — Perbaikan layout Editor (`AdminProductEditor`) & text color button:
  - **Layout Full Width**: `AdminProductEditor.tsx` container luar diubah dari `mx-auto max-w-5xl` menjadi `w-full`, sehingga form editor rata kiri (24px dari sidebar) dan seragam dengan halaman Product Registry, Overview, Users, dan Site Copy.
  - **Fix Button Hitam / Label Tidak Terlihat**: di `index.css`, tag reset (`a`, `body`, `button`, dll.) dibungkus ke dalam `@layer base`. Sebelumnya `a { color: inherit }` berada di luar layer sehingga meng-override utility Tailwind `text-[#fffdf8]` pada link button (`<Link className="... bg-[#102239] text-[#fffdf8]">`), menyebabkan teks gelap di atas background gelap (navy on navy). Dengan `@layer base`, utility class Tailwind secara tepat meng-override tag reset.
  - Verifikasi: `pnpm check` bersih, 20/20 test pass, `pnpm build` sukses.
- **2026-08-24** — Standardisasi Judul & Deskripsi CMS:
  - Semua judul puitis/abstrak pada panel admin CMS telah diperbarui menjadi judul yang jelas, to-the-point, dan profesional:
    - Overview: `Dashboard & Overview` ("Ringkasan status koleksi produk, publikasi, perizinan akun admin, dan log aktivitas terbaru.")
    - Product Registry: `Product Registry & Catalog` ("Kelola daftar produk, status publikasi (Draft / Published), status produk, dan urutan tampilan portofolio.")
    - Product Editor: `Add New Product` / `Edit Product Details` (beserta subtitle section yang jelas).
    - Site Content: `Site Content & Copy Editor` ("Kelola teks headline, tagline, dan copy halaman website publik secara dinamis tanpa perlu deploy.")
    - User Management: `User & Access Management` ("Kelola akun pengguna yang terdaftar, berikan peran Administrator, atau sesuaikan hak akses CMS dengan aman.")
    - Admin Guard / Sign-in: `Masuk ke Workshop CMS` (instruksi login yang jelas & relevan).
  - Teks konten publik dan copy website tetap dapat diedit secara dinamis melalui menu **Site Copy** (`/admin/content`).
  - Verifikasi: `pnpm check` bersih, 20/20 test pass.
- **2026-08-24** — Tab Grouping & Search di Site Content Editor (`AdminContent`):
  - `AdminContent.tsx` dirombak dari daftar panjang satu kolom menjadi sistem Tab Grouping: **Semua Konten**, **Home Page**, **About Page**, dan **Contact Page** lengkap dengan badge counter di tiap tab.
  - Dilengkapi fitur pencarian real-time (search bar), status indikator teks yang belum disimpan (*Belum disimpan* badge), tombol *Reset* per-item, serta feedback tombol simpan dinamis.
  - Verifikasi: `pnpm check` bersih, 20/20 test pass.
- **2026-08-24** — Unified Single Form di Site Content (`AdminContent`) & Perbaikan Fungsi Logout:
  - **Single Form**: Seluruh field per-tab digabung menjadi satu container form yang rapi dengan satu tombol **Simpan Perubahan** di bagian bawah (mendukung batch save untuk semua field yang diedit), tombol **Batalkan**, dan indikator status perubahan teks.
  - **Perbaikan Fungsi Logout**:
    - Di `cookies.ts`, opsi cookie disesuaikan agar pada HTTP localhost memakai `sameSite: "lax", secure: false` (sebelumnya `sameSite: "none"` tanpa secure ditolak oleh browser Chrome saat clearCookie).
    - Di `DashboardLayout.tsx`, handler tombol Sign out mengeksekusi `await logout()` lalu me-redirect window ke `/admin` sehingga sesi langsung terputus dan tampilan kembali ke layar login CMS.
  - Verifikasi: `pnpm check` bersih, 20/20 test pass, `pnpm build` sukses.
- **2026-08-24** — Update Konten & Nilai Seed Site Copy ke Bahasa Indonesia:
  - Seluruh nilai default dan baris database pada tabel `site_content` telah diubah ke Bahasa Indonesia yang profesional, jelas, dan relevan:
    - `home.heroEyebrow`: `"Produk Digital & Solusi Perangkat Lunak"`
    - `home.heroTitle`: `"Pekerjaan menjadi lebih ringan saat sistem tersusun rapi dan terarah."`
    - `home.heroDescription`: `"Kami merancang dan mengembangkan perangkat lunak yang fungsional, terstruktur, dan mudah digunakan untuk mendukung produktivitas tim dan kreator."`
    - `home.featuredHeading`: `"Dirancang khusus untuk menyelesaikan kendala nyata dalam operasional kerja."`
    - `about.statement`: `"Perangkat lunak memberikan nilai tertinggi saat mampu mengembalikan fokus dan efisiensi waktu penggunanya."`
    - `contact.intro`: `"Tertarik menggunakan produk kami, mendiskusikan peluang kemitraan, atau memiliki kebutuhan solusi sistem khusus? Mari diskusikan bersama kami."`
  - Seed di `server/registrySeed.ts` serta data aktif di database PostgreSQL telah diperbarui langsung.
  - Verifikasi: `pnpm check` bersih, 20/20 test pass, `pnpm build` sukses.
- **2026-08-24** — Akses Admin Guard & Pemulihan Role:
  - Role akun pengguna lokal (`local_local-admin`) di database PostgreSQL telah dikembalikan ke status `admin`.
  - Pada [AdminGuard.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/pages/AdminGuard.tsx), layar *Akses Membutuhkan Persetujuan* (ketika akun bukan admin) kini dilengkapi tombol **Keluar & Ganti Akun** serta link **Sign in as local admin** agar pengguna tidak terjebak di layar denied dan dapat langsung beralih ke akun administrator.
  - Verifikasi: `pnpm check` bersih, 20/20 test pass.
- **2026-08-24** — Implementasi Login Manual (Username/Email & Password):
  - Menghapus tombol *Continue securely*, *Sign in as local admin*, dan *Sign in as standard user*.
  - Menambahkan kolom `username` dan `passwordHash` pada tabel `users` di schema Drizzle & database PostgreSQL.
  - Mengimplementasikan modul hashing [password.ts](file:///Users/budi/Data/projects/new-web-company/server/_core/password.ts) berbasis `scrypt` + `randomBytes` + `timingSafeEqual`.
  - Menambahkan tRPC procedure `auth.login` di [routers.ts](file:///Users/budi/Data/projects/new-web-company/server/routers.ts) untuk memverifikasi kredensial, membuat sesi JWT, dan menyimpan cookie HTTP-Only.
  - Merancang ulang [AdminGuard.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/pages/AdminGuard.tsx) dengan formulir login manual yang bersih, modern, responsif, dan ramah pengguna.
  - Kredensial default admin: `admin` / `admin123`.
  - Verifikasi: `pnpm check` bersih, 23/23 test pass, `pnpm build` sukses.
- **2026-08-24** — Perbaikan Error 400 & Optimasi Kecepatan Transisi Login:
  - **Fix 400 Bad Request di index.html**: Menghapus tag script analytics yang belum terkonfigurasi (`/%VITE_ANALYTICS_ENDPOINT%/umami`) yang memicu request 400 saat browser memuat halaman.
  - **Optimasi Transisi Login**: Mengupdate `loginMutation.onSuccess` di [AdminGuard.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/pages/AdminGuard.tsx) agar langsung menyetel data cache user ke `utils.auth.me.setData(undefined, userData)` sehingga transisi ke dashboard berlangsung instan.
  - **Nonaktifkan Retry Lambat pada Error 401/403**: Di `main.tsx`, `QueryClient` dikonfigurasi agar tidak melakukan retry berulang (yang sebelumnya membuat dashboard menunggu hingga 7+ detik).
  - **Query Enabled Guard pada Semua Halaman Admin**: Menambahkan opsi `{ enabled: isAdmin }` pada query data di `AdminDashboard`, `AdminProducts`, `AdminContent`, `AdminUsers`, dan `AdminProductEditor` agar tidak menembakkan query admin sebelum user benar-benar terautentikasi sebagai admin, mencegah munculnya error `403 (10002)` di console.
  - Verifikasi: `pnpm check` bersih, 23/23 test pass, `pnpm build` sukses.
- **2026-08-24** — Paginasi Recent Activity & Rekomendasi Fitur Dashboard:
  - Menambahkan sistem pagination pada tabel Recent Activity di [AdminDashboard.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/pages/AdminDashboard.tsx) dengan default **5 baris per halaman**, kontrol halaman Previous/Next, page size selector (5, 10, 20), dan counter total entri (`Menampilkan 1–5 dari X aktivitas`).
  - Menyusun rekomendasi modul/widget strategis yang ideal ditampilkan pada dashboard CMS company/product portfolio.
  - Verifikasi: `pnpm check` bersih, 23/23 test pass, `pnpm build` sukses.
- **2026-08-24** — Implementasi Sistem Visitor & Traffic Analytics Bawaan:
  - Membuat tabel `page_views` di [schema.ts](file:///Users/budi/Data/projects/new-web-company/drizzle/schema.ts) dan database PostgreSQL.
  - Mengembangkan service [analytics.ts](file:///Users/budi/Data/projects/new-web-company/server/analytics.ts) dengan pembuatan `visitorHash` (anonymized IP + UA) untuk privasi, pencegahan tracking route admin, dan kalkulasi metrik agregasi lalu lintas.
  - Menambahkan mutation `registry.public.trackView` dan auto-tracking di [SiteShell.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/components/SiteShell.tsx).
  - Menambahkan widget **Visitor & Traffic Analytics** di [AdminDashboard.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/pages/AdminDashboard.tsx) lengkap dengan 4 metrik utama, grafik tren bar 7 hari terakhir, dan daftar halaman terpopuler.
  - Verifikasi: `pnpm check` bersih, 25/25 test pass (termasuk unit test analytics), `pnpm build` sukses.
- **2026-08-24** — Penggantian Browser Native Confirm dengan Custom ConfirmModal:
  - Membuat komponen reusable [ConfirmModal.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/components/ConfirmModal.tsx) dengan styling modern Software Almanac (`DM Serif Display`, tombol aksi coral/navy, backdrop blur, dan teks bahasa Indonesia).
  - Mengganti seluruh pemanggilan dialog bawaan browser `window.confirm()` di [AdminUsers.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/pages/AdminUsers.tsx) (konfirmasi ubah/cabut role user) dan di [AdminProductEditor.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/pages/AdminProductEditor.tsx) (konfirmasi hapus produk dan hapus screenshot) dengan `ConfirmModal`.
  - Verifikasi: `pnpm check` bersih, 25/25 test pass, `pnpm build` sukses.
- **2026-08-24** — Pelacakan Geo-Lokasi (Kota/Negara), IP Address & Live Visitor Log:
  - Menambahkan kolom `ip`, `city`, `region`, `country`, `countryCode`, `deviceType`, `browser`, `os` pada tabel `page_views` di [schema.ts](file:///Users/budi/Data/projects/new-web-company/drizzle/schema.ts) dan database PostgreSQL.
  - Mengintegrasikan pustaka `geoip-lite` dan parser User-Agent di [analytics.ts](file:///Users/budi/Data/projects/new-web-company/server/analytics.ts) untuk mengidentifikasi kota/negara dan teknologi perangkat pengunjung secara real-time.
  - Memperbarui [AdminDashboard.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/pages/AdminDashboard.tsx) dengan:
    1. Widget **Lokasi Kota Pengunjung** (daftar kota teratas di Indonesia seperti Jakarta, Bandung, Surabaya, dll dengan persentase).
    2. Widget **Perangkat & Browser** (Desktop vs Mobile vs Tablet & Browser teratas).
    3. Tabel **Live Visitor Log (Detail Pengunjung)** menampilkan Waktu, IP Address, Lokasi Kota/Negara, Halaman Dikunjungi, dan Perangkat (lengkap dengan pagination default 5/hal).
  - Menghapus seluruh data mock/seed dari database PostgreSQL (`page_views`), sehingga dashboard hanya menampilkan **data nyata (Live Data murni)** dengan tampilan *Empty State* yang bersih dan informatif saat belum ada kunjungan.
  - Menghapus kartu *Panduan Cepat* ("Kelola konten & publikasi produk") dari sidebar Dashboard agar tata letak CMS lebih lapang dan berfokus pada navigasi serta metrik operasional.
  - Verifikasi: `pnpm check` bersih, 27/27 test pass, `pnpm build` sukses.
- **2026-08-24** — Konfigurasi Jalur CMS Dinamis via `.env` (`VITE_CMS_PATH`) & Penyesuaian GeoIP Lokal ke Bandung:
  - Mengubah rute panel admin menjadi dinamis menggunakan variabel lingkungan `VITE_CMS_PATH` (default saat ini: `/studio`).
  - URL `/admin` otomatis mengembalikan halaman **404 Not Found** sehingga tersembunyi dari pemindaian bot otomatis.
  - Seluruh tautan navigasi internal CMS dikelola terpusat melalui objek konstanta `CMS_ROUTES` di [const.ts](file:///Users/budi/Data/projects/new-web-company/client/src/const.ts).
  - Menyesuaikan *fallback* deteksi IP jaringan lokal (`127.0.0.1` / `localhost`) di [analytics.ts](file:///Users/budi/Data/projects/new-web-company/server/analytics.ts) menjadi **Kota Bandung, Jawa Barat**.
- **2026-08-25** — Penyesuaian Skala Tipografi & Posisi Vertikal Hero (*Hero Spacing Optimization*):
  - Menggeser seluruh section Hero ke atas dan memangkas jarak kosong (*blank space*) di bawah header navigasi.
  - Menyesuaikan `min-height` header menjadi `74px` (sebelumnya `92px`) dengan padding `8px 48px`.
  - Mengubah `.hero-home` dari `min-height: calc(100svh - 84px)` & `padding: 80px 48px` menjadi `min-height: auto` & `padding: 28px 48px 52px; align-items: start;`.
  - Mengatur kartu visual preview mockups agar berposisi lebih rapat ke atas (`top: 15px/42px/75px`).
  - Memperkecil dan menyeimbangkan ukuran *heading* (H1, H2, H3) di seluruh website agar terlihat proporsional, rapi, dan profesional (*clean editorial aesthetic*).
  - Verifikasi: `pnpm check` bersih, 27/27 test pass, `pnpm build` sukses.
- **2026-08-24** — Modul Pengaturan & Profil Perusahaan (*Company Settings*) & Upload Logo Gambar:
  - Menambahkan tab khusus **🏢 Profil Perusahaan** di menu CMS `/studio/content` ([AdminContent.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/pages/AdminContent.tsx)).
  - Menyediakan fitur **Unggah Logo Gambar Perusahaan (*Company Logo Uploader*)** dengan live preview, dukungan file gambar (PNG, SVG, JPG, WebP), tombol *Unggah/Ganti Logo*, serta tombol *Hapus Logo*.
  - Menghilangkan input manual **Logo Teks Bagian 1 & 2** (`company.wordmarkPart1` & `company.wordmarkPart2`) dari CMS dan database. Teks logo cadangan (fallback jika tanpa gambar) kini otomatis diambil langsung dari **Nama Perusahaan** (`company.name`).
  - Memperbaiki validasi schema tRPC `updateSiteContent` di [server/routers/registry.ts](file:///Users/budi/Data/projects/new-web-company/server/routers/registry.ts) agar mengizinkan nilai string kosong (`""`), mencegah error 400 *Too small* saat pengguna mengosongkan input form.
  - Memberikan jarak vertikal (*Vertical Breathing Room*) pada header di [index.css](file:///Users/budi/Data/projects/new-web-company/client/src/index.css) (`min-height: 92px`, `padding: 14px 48px`) dan [SiteShell.tsx](file:///Users/budi/Data/projects/new-web-company/client/src/components/SiteShell.tsx) (`pt-2.5 pb-1`).
  - Verifikasi: `pnpm check` bersih, 27/27 test pass, `pnpm build` sukses.
































