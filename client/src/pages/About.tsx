/** Design system: Software Almanac — About narrative in Indonesian connected to CMS siteContent. */
import { ArrowUpRight, Asterisk, Check } from "lucide-react";
import { Link } from "wouter";
import RegistryProductVisual from "@/components/RegistryProductVisual";
import SiteShell, { BrandMark } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

function contentMap(items: Array<{ key: string; value: string }> | undefined) {
  return Object.fromEntries((items ?? []).map((item) => [item.key, item.value]));
}

export default function About() {
  const productsQuery = trpc.registry.public.list.useQuery();
  const contentQuery = trpc.registry.public.siteContent.useQuery();
  const product = productsQuery.data?.[0];
  const content = contentMap(contentQuery.data);

  return (
    <SiteShell>
      <main className="about-page">
        {/* Page Hero */}
        <section className="page-hero about-hero">
          <div>
            <span className="section-label">
              <i /> Tentang Studio Kami
            </span>
            <h1>
              {content["about.heroTitle"] ?? "Independen dalam desain."}
              <br />
              <em>{content["about.heroDescription"] ?? "Bermanfaat sejak awal."}</em>
            </h1>
          </div>
          <div className="about-intro-side">
            <BrandMark />
            <p>
              Kami membuat produk perangkat lunak untuk mendukung keputusan, rutinitas, dan pekerjaan kreatif yang membutuhkan ketelitian lebih dari sekadar alat generik.
            </p>
          </div>
        </section>

        {/* Statement */}
        <section className="about-statement">
          <span>[ PRINSIP KAMI ]</span>
          <p>
            {content["about.statement"] ??
              "Perangkat lunak memberikan nilai tertinggi saat mampu mengembalikan fokus dan efisiensi waktu penggunanya tanpa menambah kerumitan baru."}
          </p>
          <div className="statement-rule" />
        </section>

        {/* About Grid */}
        <section className="about-grid">
          <div className="about-grid-copy">
            <span className="section-label">
              <i /> Tujuan yang Kami Bangun
            </span>
            <h2>
              {content["about.gridHeading"] ?? "Membangun sistem kerja yang lebih matang dan terencana."}
            </h2>
            <p>
              Workshop Collective adalah studio produk perangkat lunak independen yang berbasis di Bandung. Kami peduli pada operasional di balik sebuah tim, logika di balik keputusan bisnis, dan ritme kreatif di balik ide yang dipublikasikan.
            </p>
            <p>
              Fokus kami terarah: membangun perangkat lunak yang berguna, memecahkan masalah nyata, dan menjaga segala sesuatunya cukup sederhana agar orang nyaman menggunakannya setiap hari.
            </p>
          </div>
          <div className="about-grid-visual">
            <span className="visual-index">[ sistem yang memberi ruang berpikir ]</span>
            {product && <RegistryProductVisual product={product} alt={`Pratinjau ${product.name}`} />}
            <span className="about-annotation">
              Kami membuat alur kerja tak kasat mata<br />menjadi lebih terstruktur.
            </span>
          </div>
        </section>

        {/* Values Section */}
        <section className="values-section">
          <div className="values-title">
            <span className="section-label">
              <i /> Cara Kami Bekerja
            </span>
            <h2>
              Prinsip terarah. <br />
              <em>Dampak berkelanjutan.</em>
            </h2>
          </div>
          <div className="values-list">
            {[
              {
                title: "Fungsional di Atas Segalanya",
                copy: "Kami memprioritaskan produk yang mampu menghilangkan hambatan harian dibanding ide rumit yang sulit dipertahankan dalam jangka panjang.",
              },
              {
                title: "Konteks adalah Bagian dari Desain",
                copy: "Setiap layar harus membantu pengguna memahami mengapa suatu hal penting—bukan sekadar tombol apa yang harus diklik berikutnya.",
              },
              {
                title: "Kualitas Ada Pada Setiap Detail",
                copy: "Kejelasan alur lahir dari puluhan keputusan kecil: pemilihan kata, status sistem, perpindahan data, dan tata letak yang tepat.",
              },
            ].map((value, index) => (
              <article key={value.title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{value.title}</h3>
                  <p>{value.copy}</p>
                </div>
                <Asterisk size={17} />
              </article>
            ))}
          </div>
        </section>

        {/* About CTA */}
        <section className="about-cta">
          <div>
            <span>Bangun software yang berguna.</span>
            <span>Selesaikan masalah nyata.</span>
            <span>Tetap sederhana.</span>
          </div>
          <Link href="/contact" className="button button-light">
            Bekerja Bersama Kami <ArrowUpRight size={17} />
          </Link>
          <Check className="about-check" size={30} />
        </section>
      </main>
    </SiteShell>
  );
}
