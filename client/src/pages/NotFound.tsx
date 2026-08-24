/** Standalone 404 Error page: clean, isolated, without public site header or footer. */
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-[#f6f0e6] px-6 py-12 text-[#102239] selection:bg-[#f05a43] selection:text-white">
      {/* Top minimal bar */}
      <div className="w-full max-w-xl text-left">
        <span className="inline-flex items-center gap-1.5 border border-slate-900/15 bg-white px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-widest text-[#f05a43] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f05a43]" /> Error 404
        </span>
      </div>

      {/* Main Centered Content */}
      <div className="my-auto w-full max-w-xl border border-slate-900/15 bg-white p-8 shadow-sm sm:p-12">
        <h1 className="font-[DM_Serif_Display] text-6xl leading-[.9] tracking-tight text-[#102239] sm:text-7xl">
          404. <br />
          <em className="text-[#f05a43]">Tidak Ditemukan.</em>
        </h1>
        <p className="mt-5 text-sm leading-6 text-slate-600">
          Jalur atau halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau Anda tidak memiliki akses ke URL ini.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
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
      </div>

      {/* Bottom minimal imprint */}
      <div className="w-full max-w-xl text-center text-[11px] font-semibold text-slate-400">
        Workshop Collective · Status 404 (Not Found)
      </div>
    </main>
  );
}
