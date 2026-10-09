/** 404 inside the site frame, so a lost visitor keeps the navigation, language switch, and footer. */
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";
import { useDocumentTitle, useMessages } from "@/i18n";

export default function NotFound() {
  const t = useMessages();
  useDocumentTitle(t.meta.notFoundTitle);

  return (
    <SiteShell>
      <main className="not-found">
        <span className="section-label">
          <i /> {t.notFound.eyebrow}
        </span>
        <h1>{t.notFound.title}</h1>
        <p>{t.notFound.body}</p>
        <div className="hero-actions">
          <Link href="/" className="button button-ink">
            <ArrowLeft size={17} /> {t.notFound.home}
          </Link>
          <Link href="/products" className="text-link">
            {t.notFound.products} <ArrowUpRight size={15} />
          </Link>
        </div>
      </main>
    </SiteShell>
  );
}
