/** Privacy Policy and Terms of Service. While LEGAL_PAGES_DRAFT is on they carry a visible draft banner (and noindex, server-side). */
import { AlertTriangle } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { useDocumentTitle, useMessages } from "@/i18n";
import { LEGAL_PAGES_DRAFT } from "@shared/site";

export default function Legal({ doc }: { doc: "privacy" | "terms" }) {
  const t = useMessages();
  const page = t.legal[doc];
  useDocumentTitle(page.title);

  return (
    <SiteShell>
      <main className="legal-page">
        {LEGAL_PAGES_DRAFT && (
          <p className="draft-banner" role="note">
            <AlertTriangle size={16} aria-hidden="true" /> {t.legal.draftBanner}
          </p>
        )}
        <header className="legal-head">
          <span className="section-label">
            <i /> {page.eyebrow}
          </span>
          <h1>{page.title}</h1>
          <p className="legal-updated">
            {t.legal.lastUpdated}: {page.updated}
          </p>
          <p className="legal-intro">{page.intro}</p>
        </header>
        <div className="legal-body">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
