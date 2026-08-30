/** Standalone 404 page — Playful Spectrum palette, mono micro-labels, pill actions. */
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-[var(--blue-2)] px-6 py-8 text-[var(--ink)] selection:bg-[var(--purple-50)] selection:text-white sm:px-12 sm:py-10">
      {/* Top minimal bar */}
      <header className="w-full max-w-5xl text-left">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--purple-5)] px-4 py-1.5 font-[family-name:var(--mono)] text-[11px] font-semibold uppercase tracking-widest text-[var(--purple-60)]">
          <span className="h-2 w-2 rounded-[3px] bg-[var(--purple-50)]" /> Error 404 · Not Found
        </span>
      </header>

      {/* Main Centered 2-Column Content Card */}
      <div className="my-auto w-full max-w-5xl rounded-[28px] bg-white p-6 shadow-[0_18px_44px_rgba(22,19,30,.10)] sm:p-10 md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
          {/* Left Column: Text & Actions */}
          <div className="md:col-span-6 lg:col-span-5">
            <span className="font-[family-name:var(--mono)] text-[10px] font-semibold uppercase tracking-[.18em] text-[var(--purple-50)]">
              Workshop Collective
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-.035em] text-[var(--ink)] sm:text-4xl">
              Halaman Tidak <br />
              <span className="text-[var(--purple-50)]">Ditemukan.</span>
            </h1>
            <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
              Oops! Jalur atau halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau Anda tidak memiliki akses ke URL ini.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-xs font-bold text-[var(--lightest)] transition-transform duration-150 hover:-translate-y-0.5"
              >
                <Home size={14} /> Ke Halaman Utama
              </Link>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[var(--ink)] px-6 py-3 text-xs font-bold text-[var(--ink)] transition-transform duration-150 hover:-translate-y-0.5"
              >
                <ArrowLeft size={14} /> Kembali Sebelumnya
              </button>
            </div>

            <div className="mt-8 border-t border-[rgba(22,19,30,.12)] pt-4 text-xs text-[var(--ink-soft)]">
              Butuh bantuan?{" "}
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 font-bold text-[var(--ink)] transition-colors hover:text-[var(--purple-50)]"
              >
                Hubungi tim kami <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Right Column: Illustration Image */}
          <div className="flex justify-center md:col-span-6 lg:col-span-7">
            <div className="relative w-full max-w-lg overflow-hidden rounded-[20px] bg-[var(--teal-2)] p-3">
              <img
                src="/images/404-illustration.png"
                alt="404 Page Not Found Illustration"
                className="h-auto w-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom minimal imprint */}
      <footer className="w-full max-w-5xl text-center font-[family-name:var(--mono)] text-[11px] font-medium text-[var(--cool-40)]">
        Workshop Collective · Status 404 (Not Found) · Bandung, Indonesia
      </footer>
    </main>
  );
}
