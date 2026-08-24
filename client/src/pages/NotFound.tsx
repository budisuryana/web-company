/** Design system: Software Almanac — clean Indonesian 404 error page. */
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <main className="not-found">
        <span className="section-label">
          <i /> 404 · Tidak Ditemukan
        </span>
        <h1>
          Halaman tidak <br />
          <em>ditemukan.</em>
        </h1>
        <p>
          Alamat atau tautan yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <Link href="/" className="button button-ink">
          <ArrowLeft size={17} /> Kembali ke Beranda
        </Link>
      </main>
    </SiteShell>
  );
}
