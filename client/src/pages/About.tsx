/** About: what Ruang Karya is, what it operates today, verifiable company facts, and working principles. */
import { ArrowUpRight, Asterisk, Bot } from "lucide-react";
import { Link } from "wouter";
import SiteShell, { BrandMark } from "@/components/SiteShell";
import { useDocumentTitle, useMessages } from "@/i18n";

export default function About() {
  const t = useMessages();
  useDocumentTitle(t.meta.aboutTitle);

  return (
    <SiteShell>
      <main className="about-page">
        <section className="page-hero about-hero">
          <div>
            <span className="section-label">
              <i /> {t.about.eyebrow}
            </span>
            <h1>{t.about.title}</h1>
          </div>
          <div className="about-intro-side">
            <BrandMark />
            <p>{t.about.lead}</p>
          </div>
        </section>

        <section className="about-grid">
          <div className="about-grid-copy">
            <span className="section-label">
              <i /> {t.about.storyTitle}
            </span>
            {t.about.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <dl className="fact-list">
            <span className="fact-list-title">{t.about.factsTitle}</span>
            {t.about.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="values-section">
          <div className="values-title">
            <span className="section-label">
              <i /> {t.about.valuesEyebrow}
            </span>
            <h2>{t.about.valuesTitle}</h2>
          </div>
          <div className="values-list">
            {t.about.values.map((value, index) => (
              <article key={value.title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{value.title}</h3>
                  <p>{value.body}</p>
                </div>
                <Asterisk size={17} aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="about-ai">
          <Bot size={22} aria-hidden="true" />
          <div>
            <h2>{t.about.aiTitle}</h2>
            <p>{t.about.aiBody}</p>
          </div>
          <Link href="/#ai" className="text-link">
            {t.about.aiLink} <ArrowUpRight size={15} />
          </Link>
        </section>

        <section className="about-cta">
          <div>
            <span>{t.about.ctaTitle}</span>
          </div>
          <Link href="/contact" className="button button-light">
            {t.common.contactUs} <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>
    </SiteShell>
  );
}
