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
