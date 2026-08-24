/** Design system: Software Almanac — the public homepage reading product catalog and marketing copy from PostgreSQL. */
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import RegistryProductVisual from "@/components/RegistryProductVisual";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

function contentMap(items: Array<{ key: string; value: string }> | undefined) {
  return Object.fromEntries((items ?? []).map((item) => [item.key, item.value]));
}

export default function Home() {
  const productsQuery = trpc.registry.public.list.useQuery();
  const contentQuery = trpc.registry.public.siteContent.useQuery();
  const products = productsQuery.data ?? [];
  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);
  const heroProduct = products.find((product) => product.slug === "kontenjadi") ?? products[0];
  const content = contentMap(contentQuery.data);

  return (
    <SiteShell>
      <main>
        {/* Hero Section */}
        <section className="hero-home section-rule">
          <div className="home-hero-copy">
            <span className="section-label">
              <i /> {content["home.heroEyebrow"] ?? "Produk Digital & Solusi Perangkat Lunak"}
            </span>
            <h1>{content["home.heroTitle"] ?? "Pekerjaan menjadi lebih ringan saat sistem tersusun rapi dan terarah."}</h1>
            <p>
              {content["home.heroDescription"] ??
                "Kami merancang dan mengembangkan perangkat lunak yang fungsional, terstruktur, dan mudah digunakan untuk mendukung produktivitas tim dan kreator."}
            </p>
            <div className="hero-actions">
              <Link href="/products" className="button button-ink">
                Jelajahi Produk <ArrowUpRight size={17} />
              </Link>
              <a className="text-link" href="#story">
                Filosofi Kami <ArrowDownRight size={16} />
              </a>
            </div>
          </div>
          <div className="home-hero-visual" aria-label="Antarmuka produk unggulan Workshop Collective">
            <span className="visual-index">[ katalog produk ]</span>
            {heroProduct ? (
              <>
                <div className="hero-folio hero-folio-back">
                  <RegistryProductVisual product={products[2] ?? heroProduct} compact />
                </div>
                <div className="hero-folio hero-folio-mid">
                  <RegistryProductVisual product={products[1] ?? heroProduct} compact />
                </div>
                <div className="hero-folio hero-folio-front">
                  <RegistryProductVisual product={heroProduct} alt={`Antarmuka ${heroProduct.name}`} />
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat katalog produk...
              </div>
            )}
            <span className="folio-note note-left">
              Dari kerumitan<br />menuju langkah yang jelas.
            </span>
            <span className="folio-note note-bottom">
              Portofolio produk<br />untuk alur kerja dinamis.
            </span>
          </div>
          <div className="hero-footnote">
            <span>Gulir untuk menjelajah</span>
            <i />
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="featured-section" id="story">
          <div className="section-intro split-intro">
            <div>
              <span className="section-label"><i /> 01 / Produk Pilihan</span>
              <h2>{content["home.featuredHeading"] ?? "Dirancang khusus untuk menyelesaikan kendala nyata dalam operasional kerja."}</h2>
            </div>
            <p>
              {content["home.featuredDescription"] ??
                "Sebagian besar tim tidak kekurangan aplikasi, namun sering kehilangan konteks antar alat kerja. Produk kami dibangun untuk menjaga kesinambungan informasi."}
            </p>
          </div>

          <div className="feature-list">
            {productsQuery.isLoading ? (
              <div className="py-14 text-sm text-slate-500">Memuat Katalog Produk…</div>
            ) : (
              featuredProducts.map((product, index) => (
                <article className="feature-row" key={product.id}>
                  <div className="feature-index">{String(index + 1).padStart(2, "0")}</div>
                  <div className="feature-copy">
                    <span>{product.category}</span>
                    <h3>{product.name}</h3>
                    <p>{product.shortDescription}</p>
                    <Link href={`/products/${product.slug}`} className="text-link">
                      Lihat Detail Produk <ArrowUpRight size={15} />
                    </Link>
                  </div>
                  <div className="feature-visual">
                    <RegistryProductVisual product={product} compact />
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="centered-action">
            <Link href="/products" className="button button-outline">
              Lihat Semua Produk <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        {/* Principle Band */}
        <section className="principle-band">
          <div className="principle-eyebrow">Prinsip &amp; Sudut Pandang</div>
          <div className="principle-message">
            <p>
              Bangun perangkat lunak yang berguna.<br />
              <em>Selesaikan masalah nyata.</em><br />
              Tetap sederhana.
            </p>
            <span>
              {content["home.principleBody"] ??
                "Kami adalah studio produk independen di Bandung. Kami fokus pada detail operasional yang membuat pekerjaan terasa rumit dan menyempurnakannya hingga lebih mudah dijalankan."}
            </span>
          </div>
          <div className="principle-stamp">
            <b>W</b>
            <small>
              dibuat dengan<br />ketelitian
            </small>
          </div>
        </section>

        {/* Showcase Section */}
        <section className="showcase-section">
          {heroProduct && (
            <>
              <div className="showcase-copy">
                <span className="section-label"><i /> Sorotan Utama</span>
                <h2>{heroProduct.heroHeadline}</h2>
                <p>{heroProduct.fullDescription}</p>
                <div className="workflow-pills">
                  {heroProduct.workflowSteps.map((step, index) => (
                    <span key={step.title}>
                      <b>{String(index + 1).padStart(2, "0")}</b>
                      {step.title}
                    </span>
                  ))}
                </div>
                <Link href={`/products/${heroProduct.slug}`} className="button button-coral">
                  Jelajahi {heroProduct.name} <ArrowUpRight size={17} />
                </Link>
              </div>
              <div className="showcase-visual">
                <span className="visual-index">[ sorotan / {heroProduct.name} ]</span>
                <RegistryProductVisual product={heroProduct} alt={`Pratinjau ${heroProduct.name}`} />
                <div className="visual-caption">
                  <span>Alur kerja produk terintegrasi</span>
                  <span>Berbasis data PostgreSQL</span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Working Method Section */}
        <section className="working-method">
          <div className="method-heading">
            <span className="section-label"><i /> 03 / Cara Kami Membangun</span>
            <h2>{content["home.methodHeading"] ?? "Standar kualitas yang tinggi untuk setiap fungsi."}</h2>
          </div>
          <div className="method-items">
            {[
              {
                no: "01",
                title: "Fokus pada Inti Masalah",
                body: "Kami memulai dengan memahami alur kerja di lapangan—hambatan koordinasi, kebingungan kecil, dan pengecekan berulang yang menguras energi.",
              },
              {
                no: "02",
                title: "Pertahankan Konteks Kerja",
                body: "Produk yang baik mengingat alasan di balik suatu pekerjaan, bukan sekadar mencatatnya di dalam daftar tugas.",
              },
              {
                no: "03",
                title: "Sederhana Tanpa Mengurangi Nilai",
                body: "Kami menyederhanakan antarmuka dengan cermat: detail penting tidak boleh hilang hanya demi tampilan yang terlihat minimalis.",
              },
            ].map((item) => (
              <article className="method-item" key={item.no}>
                <span>{item.no}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
                <Check size={18} />
              </article>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="closing-cta">
          <span className="plate-index">[ 04 / Langkah Jelas Berikutnya ]</span>
          <span className="section-label"><i /> Studio Produk Independen</span>
          <h2>
            Ada cara yang lebih <br />
            teratur untuk <em>memajukan</em><br />
            pekerjaan Anda.
          </h2>
          <Link href="/contact" className="button button-light">
            Mulai Konsultasi <ArrowUpRight size={17} />
          </Link>
          <span className="cta-corner">
            Workshop<br />Collective
          </span>
          <span className="plate-rule" />
        </section>
      </main>
    </SiteShell>
  );
}
