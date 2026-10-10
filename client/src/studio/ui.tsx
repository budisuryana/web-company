/**
 * Workshop CMS primitives in the NUSAKARYA HQ design system (window.NusakaryaHQ: Button, Badge,
 * StatCard, …) plus the shell patterns the HQ prototype builds from the same tokens: cards, tables,
 * pagination, fields, segmented controls and the loading / empty / error states.
 * Styles live in studio.css under html[data-studio].
 */
import type { ButtonHTMLAttributes, ComponentType, CSSProperties, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2, OctagonAlert, RotateCw } from "lucide-react";
import { useT } from "@/admin/i18n";

type Icon = ComponentType<{ className?: string; size?: number | string; "aria-hidden"?: boolean | "true" }>;
export type Hue = "blue" | "teal" | "violet" | "amber" | "green" | "red" | "neutral";
export type Tone = "neutral" | "success" | "warning" | "danger" | "review" | "accent" | "teal" | "outline";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/** Class list for an HQ button, so links, labels and file pickers can look like buttons too. */
export function btn(variant: "default" | "primary" | "ghost" | "danger" = "default", size: "md" | "sm" | "lg" = "md", extra?: string) {
  return cx("hq-btn", variant !== "default" && variant, size !== "md" && size, extra);
}

export function Button({
  variant = "default",
  size = "md",
  icon: IconComponent,
  iconOnly = false,
  block = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
  size?: "md" | "sm" | "lg";
  icon?: Icon;
  iconOnly?: boolean;
  block?: boolean;
}) {
  return (
    <button type={type} className={btn(variant, size, cx(iconOnly && "icon", block && "block", className))} {...props}>
      {IconComponent && <IconComponent aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Badge({ tone = "neutral", dot = false, pulse = false, icon: IconComponent, className, children }: { tone?: Tone; dot?: boolean; pulse?: boolean; icon?: Icon; className?: string; children: ReactNode }) {
  return (
    <span className={cx("hq-badge", tone !== "neutral" && tone, className)}>
      {dot && <span className={cx("hq-dot", pulse && "pulse")} aria-hidden="true" />}
      {IconComponent && <IconComponent aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Tile({ icon: IconComponent, hue = "blue", large = false }: { icon: Icon; hue?: Hue; large?: boolean }) {
  return (
    <span className={cx("hq-tile", large && "lg")} data-hue={hue} aria-hidden="true">
      <IconComponent />
    </span>
  );
}

export function PageHead({ title, description, actions, children }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="hq-page-head">
      <div className="min-w-0">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </div>
      {actions && <div className="hq-actions">{actions}</div>}
    </div>
  );
}

export function Card({ className, hue, wash = false, children, style, as: Tag = "section", ...rest }: { className?: string; hue?: Hue; wash?: boolean; children: ReactNode; style?: CSSProperties; as?: "section" | "div" | "article" | "form"; "aria-label"?: string; onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <Tag className={cx("hq-card", className)} data-hue={hue} data-wash={wash ? "" : undefined} style={style} {...(rest as object)}>
      {children}
    </Tag>
  );
}

export function CardHead({ icon, hue, title, sub, right, as: Heading = "h2" }: { icon?: Icon; hue?: Hue; title: ReactNode; sub?: ReactNode; right?: ReactNode; as?: "h2" | "h3" }) {
  return (
    <div className="hq-card-head">
      {icon && <Tile icon={icon} hue={hue} />}
      <div className="min-w-0">
        <Heading>{title}</Heading>
        {sub && <div className="hq-sub">{sub}</div>}
      </div>
      {right && <div className="hq-right">{right}</div>}
    </div>
  );
}

/** KPI tile: label with a tinted icon, one big number, one line of context (HQ StatCard). */
export function StatCard({ label, icon, hue = "blue", value, unit, sub, tone, href, onNavigate }: { label: ReactNode; icon: Icon; hue?: Hue; value: ReactNode; unit?: ReactNode; sub?: ReactNode; tone?: "danger" | "warning"; href?: string; onNavigate?: (href: string) => void }) {
  const body = (
    <>
      <div className="hq-lbl">
        <Tile icon={icon} hue={hue} />
        <span>{label}</span>
      </div>
      <div className="hq-val">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      {sub && <div className="hq-delta">{sub}</div>}
    </>
  );
  const className = cx("hq-card hq-stat", tone === "danger" && "alert", tone === "warning" && "warn");
  if (href && onNavigate)
    return (
      <a
        href={href}
        className={className}
        data-hue={hue}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onNavigate(href);
        }}
      >
        {body}
      </a>
    );
  return (
    <article className={className} data-hue={hue}>
      {body}
    </article>
  );
}

export function Field({ label, htmlFor, required = false, hint, error, children, className }: { label: ReactNode; htmlFor?: string; required?: boolean; hint?: ReactNode; error?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx("hq-field", className)}>
      <label className="hq-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="hq-req" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <span className="hq-error">
          <OctagonAlert aria-hidden="true" />
          {error}
        </span>
      ) : (
        hint && <span className="hq-hint">{hint}</span>
      )}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label, className }: { value: T; options: Array<{ value: T; label: ReactNode; icon?: Icon; lang?: string }>; onChange: (value: T) => void; label: string; className?: string }) {
  return (
    <div className={cx("hq-seg", className)} role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} lang={option.lang} onClick={() => onChange(option.value)}>
          {option.icon && <option.icon aria-hidden="true" />}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon: IconComponent, title, children, action }: { icon: Icon; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="hq-empty">
      <span className="hq-ei" aria-hidden="true">
        <IconComponent />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ children }: { children: ReactNode }) {
  return (
    <div className="hq-loading" role="status">
      <Loader2 className="hq-spin" aria-hidden="true" />
      {children}
    </div>
  );
}

export function ErrorState({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  const t = useT();
  return (
    <div className="hq-banner err m-3.5" role="alert">
      <OctagonAlert aria-hidden="true" />
      <span className="min-w-0 flex-1">{children}</span>
      {onRetry && (
        <Button size="sm" icon={RotateCw} className="hq-banner-act" onClick={onRetry}>
          {t("Try again")}
        </Button>
      )}
    </div>
  );
}

/** Footer pager for client-side paginated lists: summary, page size and previous / next. */
export function Pagination({ summary, page, pages, pageSize, sizes = [5, 10, 20], onPage, onPageSize }: { summary: ReactNode; page: number; pages: number; pageSize: number; sizes?: number[]; onPage: (page: number) => void; onPageSize: (size: number) => void }) {
  const t = useT();
  return (
    <div className="hq-pager">
      <span>{summary}</span>
      <div className="flex flex-wrap items-center gap-3">
        <label className="hq-pager-size">
          <span>{t("Tampilkan:")}</span>
          <select className="hq-select" value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))}>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {t("{count} / hal", { count: size })}
              </option>
            ))}
          </select>
        </label>
        <div className="hq-pager-nav">
          <Button size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onPage(Math.max(page - 1, 1))}>
            {t("Prev")}
          </Button>
          <span>
            {t("Hal {page} / {pages}", { page, pages })}
          </span>
          <Button size="sm" disabled={page >= pages} onClick={() => onPage(Math.min(page + 1, pages))}>
            {t("Next")}
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
