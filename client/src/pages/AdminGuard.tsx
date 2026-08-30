/** CMS access gate: manual credentials authentication (username/email & password) with secure session handling. */
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ChevronRight, Eye, EyeOff, KeyRound, Loader2, Lock, LockKeyhole, LogOut, Mail, ShieldAlert, ShieldCheck, Sparkles, User } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { BrandLockup } from "@/components/BrandLockup";
import CmsIllustration from "@/components/CmsIllustration";
import { useAuth } from "@/_core/hooks/useAuth";
import { CMS_BASE_PATH } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function AccessFrame({ eyebrow, title, body, children, denied = false }: { eyebrow: string; title: ReactNode; body: string; children: ReactNode; denied?: boolean }) {
  // Public query, so the sign-in screen carries the real company name before any session exists.
  const contentQuery = trpc.registry.public.siteContent.useQuery();
  const content = Object.fromEntries((contentQuery.data ?? []).map((item) => [item.key, item.value]));
  const companyName = content["company.name"] || "Ruang Karya";

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_.98fr]">
        {/* Brand panel */}
        <section className="relative flex min-h-[46vh] flex-col justify-between overflow-hidden bg-[var(--ink)] px-7 py-8 text-[var(--warm-20)] sm:px-12 sm:py-12">
          <div className="pointer-events-none absolute -right-32 -top-36 h-96 w-96 rounded-full bg-[var(--purple-80)] opacity-40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-28 h-96 w-96 rounded-full bg-[var(--teal-80)] opacity-35 blur-3xl" />

          <div className="relative flex items-center justify-between gap-4">
            <Link href="/" className="text-[var(--lightest)] transition-opacity hover:opacity-85">
              <BrandLockup name={companyName} variant="duo" />
            </Link>
            <span className="font-[family-name:var(--mono)] text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--warm-40)]">
              Panel Admin
            </span>
          </div>

          <div className="relative my-10 lg:my-0">
            <CmsIllustration className="mx-auto w-full max-w-[440px]" />
          </div>

          <div className="relative">
            <span className="inline-flex items-center gap-2 font-[family-name:var(--mono)] text-[10px] font-semibold uppercase tracking-[.17em] text-[var(--lime-30)]">
              <Sparkles size={13} /> Ruang kerja privat
            </span>
            <p className="mt-4 max-w-md admin-display text-2xl leading-tight text-[var(--lightest)] sm:text-[27px]">
              Kelola katalog produk dan seluruh konten situs <em className="text-[var(--lime-30)]">dari satu tempat.</em>
            </p>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-2 border-t border-white/12 pt-5 font-[family-name:var(--mono)] text-[11px] text-[var(--warm-40)]">
              <span>Katalog Produk</span>
              <span>Profil &amp; Konten</span>
              <span>Kotak Masuk</span>
              <span>Kontrol Akses</span>
            </div>
          </div>
        </section>

        {/* Sign-in panel */}
        <section className="relative flex items-center px-7 py-12 sm:px-14 lg:px-16">
          <span className="absolute right-8 top-8 font-[family-name:var(--mono)] text-[10px] font-semibold uppercase tracking-[.15em] text-[var(--cool-40)]">
            [ masuk aman ]
          </span>
          <div className="w-full max-w-lg">
            <span className={`inline-flex items-center gap-2 font-[family-name:var(--mono)] text-[10px] font-semibold uppercase tracking-[.16em] ${denied ? "text-[var(--red-50)]" : "text-[var(--accent)]"}`}>
              {denied ? <ShieldAlert size={14} /> : <LockKeyhole size={14} />}
              {eyebrow}
            </span>
            <h1 className="mt-4 admin-display text-[27px] leading-tight text-[var(--ink)] sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[var(--ink-soft)]">{body}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-9 grid gap-3 border-t border-[var(--line)] pt-5 text-xs leading-5 text-[var(--ink-soft)] sm:grid-cols-2">
              <span className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green-50)]" />
                Pemeriksaan peran dijalankan di server untuk setiap tindakan CMS.
              </span>
              <span className="flex gap-2">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green-50)]" />
                Sesi Anda diverifikasi sebelum data produk atau pengguna dibuka.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoginForm() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (userData) => {
      setErrorMessage(null);
      // Credentials can be valid while the account still lacks the admin role, so don't
      // claim CMS access here — AdminGuard decides which screen comes next.
      const isAdmin = (userData as { role?: string } | null)?.role === "admin";
      toast.success(isAdmin ? "Berhasil masuk ke CMS." : "Akun terverifikasi. Menunggu izin administrator.");
      utils.auth.me.setData(undefined, userData as any);
      void utils.auth.me.invalidate();
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage("Silakan isi username/email dan password.");
      return;
    }
    setErrorMessage(null);
    loginMutation.mutate({ usernameOrEmail: usernameOrEmail.trim(), password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-[var(--r-sm)] border-[1.5px] border-[var(--red-30)] bg-[var(--red-10)] p-3.5 text-xs font-semibold leading-5 text-[var(--red-70)]">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-[var(--red-50)]" />
          <div>{errorMessage}</div>
        </div>
      )}

      <div>
        <label className="block text-xs font-extrabold uppercase tracking-wide text-[var(--ink)]" htmlFor="usernameOrEmail">
          Username atau Email
        </label>
        <div className="relative mt-1.5">
          <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--cool-40)]" />
          <input
            id="usernameOrEmail"
            type="text"
            required
            autoComplete="username"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="admin atau email anda"
            className="w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--line-strong)] bg-[var(--card)] py-3 pl-10 pr-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-extrabold uppercase tracking-wide text-[var(--ink)]" htmlFor="password">
          Password
        </label>
        <div className="relative mt-1.5">
          <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--cool-40)]" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--line-strong)] bg-[var(--card)] py-3 pl-10 pr-10 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cool-40)] transition-colors hover:text-[var(--ink)]"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="group flex w-full items-center justify-center gap-2.5 rounded-[var(--r-pill)] bg-[var(--ink)] py-3.5 text-sm font-bold text-[var(--lightest)] transition-all hover:bg-[var(--cool-80)] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Memeriksa akun…
            </>
          ) : (
            <>
              Masuk ke Panel CMS <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>

      {import.meta.env.DEV && (
        <div className="mt-5 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--warm-2)] p-3.5 text-xs text-[var(--ink-soft)]">
          <span className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
            <KeyRound size={13} className="text-[var(--accent)]" /> Kredensial default admin
            <span className="ml-1 rounded-full bg-[var(--yellow-10)] px-2 py-0.5 font-[family-name:var(--mono)] text-[9px] font-semibold uppercase tracking-[.1em] text-[var(--ink)]">
              hanya dev
            </span>
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[var(--cool-40)]">Username:</span> <code className="font-bold text-[var(--ink)]">admin</code>
            </div>
            <div>
              <span className="text-[var(--cool-40)]">Password:</span> <code className="font-bold text-[var(--ink)]">admin123</code>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const contentQuery = trpc.registry.public.siteContent.useQuery();
  const companyName =
    (contentQuery.data ?? []).find((item) => item.key === "company.name")?.value || "Ruang Karya";

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--paper)]">
        <div className="text-center">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--accent)]" />
          <p className="mt-4 font-[family-name:var(--mono)] text-xs font-semibold uppercase tracking-[.16em] text-[var(--ink)]">Membuka CMS…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <AccessFrame
        eyebrow={`Panel Admin ${companyName}`}
        title={
          <>
            Masuk ke <em className="text-[var(--accent)]">CMS {companyName}.</em>
          </>
        }
        body="Silakan masukkan username/email dan password administrator untuk mengelola konten dan katalog produk."
      >
        <LoginForm />
      </AccessFrame>
    );
  }

  if (user.role !== "admin") {
    return (
      <AccessFrame
        denied
        eyebrow="Akses Membutuhkan Persetujuan"
        title={
          <>
            Akun Terhubung, <em className="text-[var(--accent)]">Belum Memiliki Izin.</em>
          </>
        }
        body="Akun Anda telah terdaftar, namun belum memiliki role administrator. Hubungi administrator yang berwenang untuk menyetujui akses akun ini atau masuk dengan akun admin."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              await logout();
              window.location.href = CMS_BASE_PATH;
            }}
            className="group inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-[var(--ink)] px-6 py-3.5 text-sm font-bold text-[var(--lightest)] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[.97]"
          >
            <LogOut size={15} /> Keluar &amp; Ganti Akun
          </button>
          <Link
            href="/"
            className="group inline-flex items-center gap-3 rounded-[var(--r-pill)] border-[1.5px] border-[var(--ink)] px-6 py-3.5 text-sm font-bold text-[var(--ink)] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[.97]"
          >
            Kembali ke website <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </AccessFrame>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
