/** Contact page: enquiries are saved to the CMS inbox rather than handed off to a mailto: draft. */
import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowUpRight, Check, Loader2, Mail, MapPin } from "lucide-react";
import { Link, useSearch } from "wouter";
import SiteShell from "@/components/SiteShell";
import { useDocumentTitle, useMessages } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { SITE } from "@shared/site";

export default function Contact() {
  const t = useMessages();
  useDocumentTitle(t.meta.contactTitle);
  const search = useSearch();
  const productsQuery = trpc.registry.public.list.useQuery();

  // "Request a demo" links arrive as /contact?product=<slug>; only a published product is honoured.
  const requestedSlug = new URLSearchParams(search).get("product");
  const demoProduct = requestedSlug ? productsQuery.data?.find((product) => product.slug === requestedSlug) : undefined;

  const [sent, setSent] = useState(false);
  const submit = trpc.registry.public.submitContact.useMutation({
    onSuccess: () => setSent(true),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    submit.mutate({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      company: String(data.get("company") ?? "").trim() || undefined,
      message: String(data.get("message") ?? "").trim(),
      botField: String(data.get("botField") ?? ""),
    });
  };

  return (
    <SiteShell>
      <main className="contact-page">
        <section className="contact-hero">
          <div>
            <span className="section-label">
              <i /> {t.contact.eyebrow}
            </span>
            <h1>{t.contact.title}</h1>
          </div>
          <p>{t.contact.lead}</p>
        </section>

        <section className="contact-body">
          <aside className="contact-aside">
            <div>
              <span>{t.contact.emailLabel}</span>
              <a href={`mailto:${SITE.email}`}>
                <Mail size={16} aria-hidden="true" /> {SITE.email} <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
            <div>
              <span>{t.contact.locationLabel}</span>
              <p>
                <MapPin size={16} aria-hidden="true" /> {t.common.location}
              </p>
            </div>
          </aside>

          {sent ? (
            <div className="contact-form contact-sent" role="status" aria-live="polite">
              <span className="sent-badge">
                <Check size={16} />
              </span>
              <h2>{t.contact.sentTitle}</h2>
              <p>{t.contact.sentBody}</p>
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  setSent(false);
                  submit.reset();
                }}
              >
                {t.contact.sendAnother}
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-heading">
                <span>{demoProduct ? t.contact.demoFormEyebrow(demoProduct.name) : t.contact.formEyebrow}</span>
                <p>{t.contact.formLead}</p>
              </div>

              <label>
                {t.contact.name}
                <input required name="name" autoComplete="name" placeholder={t.contact.namePlaceholder} />
              </label>

              <label>
                {t.contact.email}
                <input required type="email" name="email" autoComplete="email" placeholder={t.contact.emailPlaceholder} />
              </label>

              <label>
                {t.contact.company} <span>{t.contact.optional}</span>
                <input name="company" autoComplete="organization" placeholder={t.contact.companyPlaceholder} />
              </label>

              <label>
                {t.contact.message}
                <textarea
                  required
                  name="message"
                  rows={6}
                  // Re-mount when the requested product resolves so the prefill applies.
                  key={demoProduct?.slug ?? "general"}
                  defaultValue={demoProduct ? t.contact.demoPrefill(demoProduct.name) : undefined}
                  placeholder={t.contact.messagePlaceholder}
                />
              </label>

              {/* Honeypot — off-screen and skipped by tab order; only bots fill it. */}
              <input className="bot-field" type="text" name="botField" tabIndex={-1} autoComplete="off" aria-hidden="true" />

              {submit.isError && (
                <p className="form-error" role="alert">
                  <AlertCircle size={15} />
                  {submit.error.message || t.contact.errorFallback}
                </p>
              )}

              <p className="form-consent">
                {t.contact.consentBefore}
                <Link href="/privacy">{t.contact.consentLink}</Link>
                {t.contact.consentAfter}
              </p>

              <button className="button button-ink" type="submit" disabled={submit.isPending}>
                {submit.isPending ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> {t.contact.sending}
                  </>
                ) : (
                  <>
                    {t.contact.submit} <ArrowUpRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
