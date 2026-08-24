/** CMS access gate: manual credentials authentication (username/email & password) with secure session handling. */
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ChevronRight, Eye, EyeOff, KeyRound, Loader2, Lock, LockKeyhole, LogOut, Mail, ShieldAlert, ShieldCheck, Sparkles, User } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { BrandMark } from "@/components/SiteShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { CMS_BASE_PATH } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function AccessFrame({ eyebrow, title, body, children, denied = false }: { eyebrow: string; title: ReactNode; body: string; children: ReactNode; denied?: boolean }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f0e6] text-[#102239]">
      <div className="grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
        <section className="relative flex min-h-[44vh] flex-col justify-between overflow-hidden bg-[#102239] px-7 py-8 text-[#f8f4ea] sm:px-12 sm:py-12">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border border-white/15" />
          <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full border border-[#f05a43]/60" />
          <div className="relative flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-3 text-[#f8f4ea]">
              <span className="grid h-9 w-9 place-items-center border border-white/25">
                <BrandMark />
              </span>
              <span>
                <b className="block font-[DM_Serif_Display] text-xl leading-none">Workshop</b>
                <small className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.16em] text-white/60">Collective CMS</small>
              </span>
            </Link>
            <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/50">Admin access</span>
          </div>
          <div className="relative max-w-md py-12 lg:py-0">
            <span className="mb-5 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#ff826e]">
              <Sparkles size={13} /> Independent software, considered
            </span>
            <p className="font-[DM_Serif_Display] text-2xl sm:text-3xl leading-tight">
              The calm side<br />
              of <em className="text-[#ff826e]">keeping work</em><br />
              in motion.
            </p>
          </div>
          <div className="relative flex items-end justify-between border-t border-white/15 pt-5 text-xs leading-5 text-white/60">
            <span>
              Product Registry<br />
              Site content<br />
              Access control
            </span>
            <span className="text-right">
              A private workspace<br />
              for considered publishing.
            </span>
          </div>
        </section>
        <section className="relative flex items-center px-7 py-10 sm:px-14 lg:px-20">
          <div className="absolute right-8 top-8 text-[10px] font-extrabold uppercase tracking-[.15em] text-slate-400">[ secure sign-in ]</div>
          <div className="w-full max-w-xl">
            <span className={`inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] ${denied ? "text-[#c44735]" : "text-[#f05a43]"}`}>
              {denied ? <ShieldAlert size={14} /> : <LockKeyhole size={14} />}
              {eyebrow}
            </span>
            <h1 className="mt-4 font-[DM_Serif_Display] text-2xl sm:text-3xl leading-tight tracking-tight text-[#102239]">{title}</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600">{body}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-10 grid gap-3 border-t border-slate-900/15 pt-5 text-xs leading-5 text-slate-500 sm:grid-cols-2">
              <span className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#4d7c5a]" />
                Role checks run on the server for every CMS action.
              </span>
              <span className="flex gap-2">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#4d7c5a]" />
                Your session is verified before product or user data is available.
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
      toast.success("Berhasil masuk ke CMS.");
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
        <div className="flex items-start gap-3 border border-[#f05a43]/40 bg-[#fff5f3] p-3.5 text-xs leading-5 text-[#c44735]">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-[#f05a43]" />
          <div>{errorMessage}</div>
        </div>
      )}

      <div>
        <label className="block text-xs font-extrabold uppercase tracking-wide text-[#102239]" htmlFor="usernameOrEmail">
          Username atau Email
        </label>
        <div className="relative mt-1.5">
          <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="usernameOrEmail"
            type="text"
            required
            autoComplete="username"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="admin atau email anda"
            className="w-full border border-slate-900/20 bg-[#fffdf8] py-3 pl-10 pr-3 text-sm text-[#102239] outline-none transition-colors focus:border-[#f05a43]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-extrabold uppercase tracking-wide text-[#102239]" htmlFor="password">
          Password
        </label>
        <div className="relative mt-1.5">
          <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-slate-900/20 bg-[#fffdf8] py-3 pl-10 pr-10 text-sm text-[#102239] outline-none transition-colors focus:border-[#f05a43]"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#102239]"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="group flex w-full items-center justify-center gap-2.5 bg-[#102239] py-3.5 text-sm font-extrabold text-[#fffdf8] transition-all hover:bg-[#1a3455] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="mt-5 border border-slate-900/10 bg-white/70 p-3.5 text-xs text-slate-600">
        <span className="flex items-center gap-1.5 font-bold text-[#102239]">
          <KeyRound size={13} className="text-[#f05a43]" /> Kredensial Default Admin:
        </span>
        <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400">Username:</span> <code className="font-bold text-[#102239]">admin</code>
          </div>
          <div>
            <span className="text-slate-400">Password:</span> <code className="font-bold text-[#102239]">admin123</code>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f0e6]">
        <div className="text-center">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#102239]/20 border-t-[#f05a43]" />
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[.16em] text-[#102239]">Opening the CMS</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <AccessFrame
        eyebrow="Workshop CMS Admin"
        title={
          <>
            Masuk ke <em className="text-[#f05a43]">Workshop CMS.</em>
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
            Akun Terhubung, <em className="text-[#f05a43]">Belum Memiliki Izin.</em>
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
            className="group inline-flex items-center gap-2 bg-[#102239] px-5 py-3.5 text-sm font-extrabold text-[#fffdf8] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[.97]"
          >
            <LogOut size={15} /> Keluar &amp; Ganti Akun
          </button>
          <Link
            href="/"
            className="group inline-flex items-center gap-3 border border-[#102239] px-5 py-3.5 text-sm font-extrabold text-[#102239] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[.97]"
          >
            Kembali ke website <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </AccessFrame>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
