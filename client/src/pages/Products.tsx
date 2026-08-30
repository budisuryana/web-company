/** Design system: Software Almanac — public product catalog in Indonesian with dynamic database products. */
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import RegistryProductVisual from "@/components/RegistryProductVisual";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

export default function Products() {
  const productsQuery = trpc.registry.public.list.useQuery();
  const products = productsQuery.data ?? [];

  return (
    <SiteShell>
      <main className="products-page">
        {/* Page Hero */}
        <section className="page-hero products-hero">
          <div>
            <span className="section-label">
              <i /> Koleksi Produk Kami
            </span>
            <h1>
              Perangkat lunak yang <br />
              membantu pekerjaan <em>lebih teratur.</em>
            </h1>
          </div>
          <p>
            Setiap produk di halaman ini sudah dipublikasikan dan bisa digunakan hari ini. Kami merilis ketika sebuah alur kerja benar-benar selesai, bukan ketika idenya terdengar menarik.
          </p>
        </section>

        {/* Products Archive Grid */}
        <section className="product-archive">
          {productsQuery.isLoading && (
            <div className="flex items-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat Katalog Produk…
            </div>
          )}

          {products.map((product, index) => (
            <article className={`archive-product archive-${index}`} key={product.id}>
              <div className="archive-meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{product.category}</span>
              </div>
              <div className="archive-copy">
                <h2>{product.name}</h2>
                <p>{product.shortDescription}</p>
                <div className="archive-problem">
                  <span>Dirancang untuk</span>
                  <p>{product.targetUsers}</p>
                </div>
                <Link href={`/products/${product.slug}`} className="text-link">
                  Lihat Detail Produk <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="archive-visual">
                <RegistryProductVisual product={product} alt={`Sampul ${product.name}`} />
              </div>
            </article>
          ))}
        </section>

        {/* Mini CTA */}
        <section className="mini-cta">
          <p>Mencari solusi yang lebih terstruktur untuk alur kerja operasional tim Anda?</p>
          <Link href="/contact" className="button button-ink">
            Mari Berdiskusi <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>
    </SiteShell>
  );
}
