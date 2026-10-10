/**
 * Products the owner has confirmed are in development. Deliberately text only:
 * no image, CTA, detail page, or sitemap entry, so nothing implies they are available.
 */
import { Hourglass } from "lucide-react";
import { useMessages } from "@/i18n";

export default function UpcomingProducts({ className = "" }: { className?: string }) {
  const t = useMessages().upcoming;
  return (
    <section className={`upcoming-section ${className}`} aria-labelledby="upcoming-title">
      <div className="upcoming-intro">
        <h2 id="upcoming-title">{t.title}</h2>
        <p>{t.lead}</p>
      </div>
      <ul className="upcoming-grid">
        {t.items.map((item) => (
          <li className="upcoming-card" key={item.name}>
            <span className="upcoming-status">
              <Hourglass size={12} aria-hidden="true" /> {t.status}
            </span>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
