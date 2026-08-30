/** Design system: Software Almanac — Product detail chapters in Indonesian rendered directly from PostgreSQL database. */
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import RegistryProductVisual from "@/components/RegistryProductVisual";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const productQuery = trpc.registry.public.bySlug.useQuery(
    { slug: params?.slug ?? "" },
    { enabled: Boolean(params?.slug) }
  );
  const product = productQuery.data;

  if (productQuery.isLoading) {
    return (
      <SiteShell>
        <main className="not-found">
          <Loader2 className="mb-5 h-7 w-7 animate-spin text-[#f05a43]" />
          <h1>
            Memuat <br />
            <em>produk...</em>
          </h1>
        </main>
      </SiteShell>
    );
  }

  if (!product) {
    return (
      <SiteShell>
        <main className="not-found">
          <span className="section-label"><i /> Tidak ditemukan</span>
          <h1>
            Produk ini <br />
            belum <em>dipublikasikan.</em>
          </h1>
          <p>Item yang Anda cari mungkin masih dalam draf privat atau tidak lagi berada dalam koleksi publik.</p>
          <Link href="/products" className="button button-ink">
            <ArrowLeft size={17} /> Kembali ke Koleksi Produk
          </Link>
        </main>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <main className={`product-detail detail-${product.slug}`}>
        {/* Detail Hero */}
        <section className="detail-hero">
          <div className="detail-hero-copy">
            <Link href="/products" className="back-link">
              <ArrowLeft size={15} /> Semua Produk
            </Link>
            <span className="section-label">
              <i /> {String(product.displayOrder).padStart(2, "0")} / {product.category}
            </span>
            <h1>{product.heroHeadline}</h1>
            <p>{product.fullDescription}</p>
            {/* The app URL lives in the CMS (product field "URL aplikasi produk").
                Until it is filled there is nothing to try yet, so the contact
                route stays primary rather than guessing a domain. */}
            {product.demoUrl ? (
              <div className="hero-actions">
                <a
                  href={product.demoUrl}
                  className="button button-ink"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Coba {product.name} <ArrowUpRight size={17} />
                </a>
                <Link href="/contact" className="text-link">
                  Diskusikan {product.name} <ArrowUpRight size={15} />
                </Link>
              </div>
            ) : (
              <Link href="/contact" className="button button-ink">
                Diskusikan {product.name} <ArrowUpRight size={17} />
              </Link>
            )}
          </div>
          <div className="detail-hero-visual">
            <span className="visual-index">[ {product.name} / pratinjau produk ]</span>
            <span className="folio-tab">
              folio {String(product.displayOrder).padStart(2, "0")} — {product.category}
            </span>
            <RegistryProductVisual product={product} alt={`Sampul produk ${product.name}`} />
            <span className="folio-caption">
              Sistem kerja terintegrasi<br />dengan alur yang lebih rapi.
            </span>
          </div>
        </section>

        {/* Problem vs Solution */}
        <section className="problem-solution">
          <div className="problem-column">
            <span>TANTANGAN OPERASIONAL</span>
            <p>{product.problem}</p>
          </div>
          <div className="solution-column">
            <span>SOLUSI &amp; PENDEKATAN KAMI</span>
            <p>{product.solution}</p>
            <blockquote>{product.outcome}</blockquote>
          </div>
        </section>

        {/* How It Works */}
        <section className="how-section">
          <div className="how-title">
            <span className="section-label"><i /> Alur Kerja</span>
            <h2>
              Proses lengkap, <br />
              <em>tanpa perlu berganti aplikasi.</em>
            </h2>
          </div>
          <div className="steps-list">
            {product.workflowSteps.map((step, index) => (
              <article className="step-card" key={`${step.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
                <ChevronRight size={18} />
              </article>
            ))}
          </div>
        </section>

        {/* Capabilities */}
        <section className="capability-section">
          <div>
            <span className="section-label"><i /> Fitur &amp; Kapabilitas Utama</span>
            <h2>
              Fondasi yang menjaga <br />
              pekerjaan <em>tetap bergerak.</em>
            </h2>
          </div>
          <div className="capability-list">
            {product.capabilities.map((capability, index) => (
              <div key={capability}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{capability}</p>
                <Check size={17} />
              </div>
            ))}
          </div>
        </section>

        {/* Product Screens */}
        <section className="detail-screen-section">
          <div className="screen-section-heading">
            <span>Tangkapan Layar Produk</span>
            <p>
              Setiap antarmuka dirancang untuk mempertahankan konteks kerja, mengurangi friksi koordinasi, dan memperjelas keputusan berikutnya.
            </p>
          </div>
          <div className="screen-diptych">
            <div className="diptych-main">
              <span className="screen-folio-index">
                artefak / {String(product.displayOrder).padStart(2, "0")}
              </span>
              {product.screenshots[0] ? (
                <img
                  className="w-full rounded-2xl border border-[rgba(22,19,30,.12)] bg-white object-cover shadow-xl"
                  src={product.screenshots[0].url}
                  alt={product.screenshots[0].alt || `Screenshot ${product.name}`}
                />
              ) : (
                <RegistryProductVisual product={product} />
              )}
            </div>
            <div className="diptych-note">
              <span>Di dalam {product.name}</span>
              <b>
                Detail menjadi <br />
                lebih mudah ditindaklanjuti.
              </b>
              <i />
              <small>Catatan sistem — tampilan dengan konteks, bukan sekadar data mentah.</small>
            </div>
          </div>

          {product.screenshots.length > 1 && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {product.screenshots.slice(1).map((screenshot) => (
                <img
                  className="w-full rounded-2xl border border-[rgba(22,19,30,.12)] bg-white object-cover shadow-lg"
                  key={screenshot.id}
                  src={screenshot.url}
                  alt={screenshot.alt || `Screenshot ${product.name}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Target Audience */}
        <section className="audience-section">
          <div>
            <span className="section-label"><i /> Target Pengguna</span>
            <h2>
              Untuk tim yang menginginkan <br />
              pekerjaan <em>lebih terstruktur.</em>
            </h2>
          </div>
          <p>{product.targetUsers}</p>
          <Link href="/contact" className="text-link">
            Konsultasikan Kebutuhan Produk <ArrowUpRight size={16} />
          </Link>
        </section>
      </main>
    </SiteShell>
  );
}
