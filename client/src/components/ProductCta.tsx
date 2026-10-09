/** Primary product call to action and status badge, shared by the homepage, catalogue, and detail page. */
import { ArrowUpRight, CalendarCheck } from "lucide-react";
import { Link } from "wouter";
import { useMessages } from "@/i18n";
import { productCtaMode } from "@shared/i18n/products";

type CtaProduct = { slug: string; name: string; demoUrl?: string | null };

export function ProductPrimaryCta({ product, className = "button button-ink" }: { product: CtaProduct; className?: string }) {
  const t = useMessages();
  if (productCtaMode(product.slug) === "app" && product.demoUrl) {
    return (
      <a href={product.demoUrl} className={className} target="_blank" rel="noopener noreferrer" title={t.common.externalNote}>
        {t.common.tryProduct(product.name)} <ArrowUpRight size={16} />
      </a>
    );
  }
  return (
    <Link href={`/contact?product=${encodeURIComponent(product.slug)}`} className={className}>
      <CalendarCheck size={16} /> {t.common.requestDemo}
    </Link>
  );
}

export function ProductStatus({ status }: { status: string }) {
  const t = useMessages();
  if (status !== "active") return null;
  return (
    <span className="status-badge">
      <i aria-hidden="true" /> {t.common.statusLive}
    </span>
  );
}
