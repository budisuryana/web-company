/** Standalone 404 Error page with custom illustration and clean layout. */
import { ArrowLeft, ArrowRight, Home, LifeBuoy } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-[#f8f6f2] px-6 py-8 text-[#102239] selection:bg-[#f05a43] selection:text-white sm:px-12 sm:py-10">
      {/* Top minimal bar */}
      <header className="w-full max-w-5xl text-left">
        <span className="inline-flex items-center gap-1.5 border border-slate-900/15 bg-white px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-widest text-[#f05a43] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f05a43]" /> Error 404 · Not Found
        </span>
      </header>

      {/* Main Centered 2-Column Content Card */}
      <div className="my-auto w-full max-w-5xl border border-slate-900/15 bg-white p-6 shadow-sm sm:p-10 md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
          {/* Left Column: Text & Actions */}
          <div className="md:col-span-6 lg:col-span-5">
            <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f05a43]">
              Workshop Collective
            </span>
            <h1 className="mt-2 font-[DM_Serif_Display] text-5xl leading-[.92] tracking-tight text-[#102239] sm:text-6xl">
              Halaman Tidak <br />
              <em className="text-[#f05a43]">Ditemukan.</em>
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Oops! Jalur atau halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau Anda tidak memiliki akses ke URL ini.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#102239] px-5 py-3 text-xs font-extrabold text-[#fffdf8] transition-transform duration-150 hover:-translate-y-0.5"
              >
                <Home size={14} /> Ke Halaman Utama
              </Link>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 border border-slate-900/20 bg-[#fffdf8] px-5 py-3 text-xs font-extrabold text-[#102239] transition-transform duration-150 hover:-translate-y-0.5"
              >
                <ArrowLeft size={14} /> Kembali Sebelumnya
              </button>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-500">
              Butuh bantuan?{" "}
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 font-bold text-[#102239] transition-colors hover:text-[#f05a43]"
              >
                Hubungi tim kami <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Right Column: Illustration Image */}
          <div className="flex justify-center md:col-span-6 lg:col-span-7">
            <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-[#faf8f5] p-3">
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
      <footer className="w-full max-w-5xl text-center text-[11px] font-semibold text-slate-400">
        Workshop Collective · Status 404 (Not Found) · Bandung, Indonesia
      </footer>
    </main>
  );
}
