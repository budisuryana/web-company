/** CMS overview: concise operational metrics, deep visitor geo-analytics, paginated audit feed, and publishing routines. */
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Activity, ArrowUpRight, BarChart3, Box, Clock3, ExternalLink, Eye, FileText, Globe2, Inbox, Laptop, LayoutDashboard, MapPin, Monitor, Plus, ShieldCheck, Smartphone, Tablet, TrendingUp, UserCheck, UsersRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { CMS_ROUTES } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAdminLocale, useT } from "@/admin/i18n";
import { Badge, Card, CardHead, EmptyState, LoadingState, PageHead, Pagination, StatCard, btn } from "@/studio/ui";

const activityIcon = (type: string) =>
  type.startsWith("user.")
    ? UsersRound
    : type.startsWith("site_content.")
      ? FileText
      : type.startsWith("product.")
        ? Box
        : Activity;

const formatWhen = (date: Date, intlLocale: string) =>
  new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

const formatDetailedTime = (date: Date, intlLocale: string) =>
  new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));

/** Splits a translated phrase on its `{name}` placeholders and slots in React nodes (e.g. bold numbers). */
const withNodes = (text: string, nodes: Record<string, ReactNode>): ReactNode[] =>
  text.split(/(\{\w+\})/).map((part, i) => {
    const match = /^\{(\w+)\}$/.exec(part);
    return <Fragment key={i}>{match && match[1] in nodes ? nodes[match[1]] : part}</Fragment>;
  });

const deviceIcon = (type: string | null) => {
  if (type === "Mobile") return Smartphone;
  if (type === "Tablet") return Tablet;
  return Laptop;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const t = useT();
  const { locale } = useAdminLocale();
  const intlLocale = locale === "en" ? "en-GB" : "id-ID";
  const isAdmin = user?.role === "admin";
  const [, navigate] = useLocation();
  const dashboardQuery = trpc.registry.admin.dashboard.useQuery(undefined, { enabled: isAdmin });
  const inboxCounts = trpc.registry.admin.submissions.counts.useQuery(undefined, { enabled: isAdmin });
  const dashboard = dashboardQuery.data;
  const metrics = dashboard?.metrics;
  const visitorAnalytics = dashboard?.visitorAnalytics;

  // Pagination for Recent Activity (Default 5 items per page)
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(5);

  const recentActivity = dashboard?.recentActivity ?? [];
  const totalActivityItems = recentActivity.length;
  const totalActivityPages = Math.ceil(totalActivityItems / activityPageSize) || 1;

  const paginatedActivity = useMemo(() => {
    const start = (activityPage - 1) * activityPageSize;
    return recentActivity.slice(start, start + activityPageSize);
  }, [recentActivity, activityPage, activityPageSize]);

  // Pagination for Live Visitor Feed (Default 5 items per page)
  const [visitorFeedPage, setVisitorFeedPage] = useState(1);
  const [visitorFeedPageSize, setVisitorFeedPageSize] = useState(5);

  const recentVisitors = visitorAnalytics?.recentVisitors ?? [];
  const totalVisitorItems = recentVisitors.length;
  const totalVisitorPages = Math.ceil(totalVisitorItems / visitorFeedPageSize) || 1;

  const paginatedVisitors = useMemo(() => {
    const start = (visitorFeedPage - 1) * visitorFeedPageSize;
    return recentVisitors.slice(start, start + visitorFeedPageSize);
  }, [recentVisitors, visitorFeedPage, visitorFeedPageSize]);

  // Maximum value for bar chart normalization
  const maxViews = useMemo(() => {
    if (!visitorAnalytics?.dailyTrends?.length) return 10;
    const max = Math.max(...visitorAnalytics.dailyTrends.map((d) => d.views));
    return max > 0 ? max : 10;
  }, [visitorAnalytics]);

  // Device Percentages
  const totalDeviceViews = useMemo(() => {
    if (!visitorAnalytics?.deviceBreakdown) return 1;
    const { desktop, mobile, tablet } = visitorAnalytics.deviceBreakdown;
    return desktop + mobile + tablet || 1;
  }, [visitorAnalytics]);

  return (
    <>
      <PageHead
        title={t("Ringkasan")}
        description={t("Ringkasan statistik produk, metrik geografis pengunjung (kota, IP, perangkat), dan log aktivitas tim.")}
        actions={
          <>
            <a href="/" target="_blank" rel="noreferrer" className={btn("ghost")}>
              <ExternalLink aria-hidden="true" /> {t("Lihat Website Publik")}
            </a>
            <Link href={CMS_ROUTES.content} className={btn()}>
              <FileText aria-hidden="true" /> {t("Edit Site Copy")}
            </Link>
            <Link href={CMS_ROUTES.productNew} className={btn("primary")}>
              <Plus aria-hidden="true" /> {t("Add product")}
            </Link>
          </>
        }
      />

      {dashboardQuery.isLoading || !metrics ? (
        <Card>
          <LoadingState>{t("Memuat ringkasan dashboard…")}</LoadingState>
        </Card>
      ) : (
        <>
          {/* Metric summary */}
          <div className="hq-stats three">
            <StatCard icon={Box} hue="blue" label={t("Products")} value={metrics.products} sub={t("Total produk terdaftar")} href={CMS_ROUTES.products} onNavigate={navigate} />
            <StatCard icon={LayoutDashboard} hue="green" label={t("Published")} value={metrics.publishedProducts} sub={t("Tampil di publik")} href={CMS_ROUTES.products} onNavigate={navigate} />
            <StatCard icon={FileText} hue="neutral" label={t("Drafts")} value={metrics.draftProducts} sub={t("Draf privat")} href={CMS_ROUTES.products} onNavigate={navigate} />
            <StatCard icon={ShieldCheck} hue="teal" label={t("Administrators")} value={metrics.administrators} sub={t("Akun admin aktif")} href={CMS_ROUTES.users} onNavigate={navigate} />
            <StatCard icon={UsersRound} hue="violet" label={t("Pending accounts")} value={metrics.pendingUsers} sub={t("Menunggu persetujuan")} tone={metrics.pendingUsers > 0 ? "warning" : undefined} href={CMS_ROUTES.users} onNavigate={navigate} />
            <StatCard icon={Inbox} hue="amber" label={t("Pesan masuk")} value={inboxCounts.data?.unread ?? 0} sub={t("Belum dibaca")} tone={(inboxCounts.data?.unread ?? 0) > 0 ? "warning" : undefined} href={CMS_ROUTES.inbox} onNavigate={navigate} />
          </div>

          {/* Visitor & traffic analytics */}
          {visitorAnalytics && (
            <section className="mt-6" aria-labelledby="visitor-analytics">
              <div className="hq-section-head">
                <div className="min-w-0">
                  <h2 id="visitor-analytics">{t("Visitor & Geo-Analytics")}</h2>
                  <p>{t("Lalu Lintas & Demografi Pengunjung")}</p>
                </div>
                <Badge tone="success" dot pulse>
                  {t("Live GeoIP Tracking")}
                </Badge>
              </div>

              <div className="hq-stats">
                <StatCard icon={Eye} hue="blue" label={t("Total Kunjungan")} value={visitorAnalytics.totalViews.toLocaleString(intlLocale)} sub={t("Akumulasi tayangan seluruh halaman")} />
                <StatCard icon={UserCheck} hue="green" label={t("Pengunjung Unik")} value={visitorAnalytics.uniqueVisitors.toLocaleString(intlLocale)} sub={t("Total individual unique visitors")} />
                <StatCard icon={TrendingUp} hue="teal" label={t("Kunjungan Hari Ini")} value={visitorAnalytics.todayViews.toLocaleString(intlLocale)} sub={t("{count} pengunjung unik hari ini", { count: visitorAnalytics.todayUniques })} />
                <StatCard icon={Globe2} hue="violet" label={t("Pelacakan Lokasi")} value={t("Aktif")} sub={t("Kota, Negara, IP & Device")} />
              </div>

              {visitorAnalytics.totalViews === 0 ? (
                <Card>
                  <EmptyState
                    icon={Globe2}
                    title={t("Belum Ada Kunjungan Publik")}
                    action={
                      <a href="/" target="_blank" rel="noreferrer" className={btn("primary", "sm")}>
                        {t("Buka Website Publik untuk Uji Tracking")} <ExternalLink aria-hidden="true" />
                      </a>
                    }
                  >
                    {t("Sistem pelacakan real-time sudah aktif. Data statistik, grafik tren 7 hari, asal kota pengunjung, dan log IP akan otomatis tercatat dan muncul saat pengunjung membuka website publik.")}
                  </EmptyState>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {/* Daily trend */}
                    <Card className="lg:col-span-2">
                      <CardHead icon={BarChart3} hue="blue" title={t("Tren Kunjungan 7 Hari Terakhir")} sub={t("Volume page views dan pengunjung unik")} as="h3" />
                      <div className="hq-card-body">
                        <div className="hq-bars">
                          {visitorAnalytics.dailyTrends.map((trend) => {
                            const heightPct = Math.max(Math.round((trend.views / maxViews) * 100), 8);
                            const day =
                              locale === "en"
                                ? new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(trend.date))
                                : trend.label;
                            return (
                              <div key={trend.date} className="hq-bar" tabIndex={0} aria-label={`${day}: ${t("{views} views ({uniques} unik)", { views: trend.views, uniques: trend.uniques })}`}>
                                <span className="hq-bar-tip">{t("{views} views ({uniques} unik)", { views: trend.views, uniques: trend.uniques })}</span>
                                <span className="hq-bar-track">
                                  <i style={{ height: `${heightPct}%` }} />
                                </span>
                                <span className="hq-bar-label">{day}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>

                    {/* Devices & browsers */}
                    <Card>
                      <CardHead icon={Monitor} hue="teal" title={t("Perangkat & Browser")} sub={t("Distribusi teknologi pengunjung")} as="h3" />
                      <div className="hq-card-body flex flex-col gap-3">
                        {([
                          [Laptop, t("Desktop"), visitorAnalytics.deviceBreakdown.desktop, "accent"],
                          [Smartphone, t("Mobile Phone"), visitorAnalytics.deviceBreakdown.mobile, "teal"],
                          [Tablet, t("Tablet"), visitorAnalytics.deviceBreakdown.tablet, "violet"],
                        ] as const).map(([DeviceIcon, label, views, color]) => {
                          const pct = Math.round(((views || 0) / totalDeviceViews) * 100);
                          return (
                            <div key={label}>
                              <div className="flex items-center justify-between text-[12.5px]">
                                <span className="flex items-center gap-1.5 font-medium text-[var(--hq-text-primary)]">
                                  <DeviceIcon size={14} aria-hidden="true" /> {label}
                                </span>
                                <span className="hq-tnum hq-muted">{pct}%</span>
                              </div>
                              <div className={`hq-progress ${color} mt-1.5`}>
                                <i style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        <div className="border-t border-[var(--hq-border-subtle)] pt-3">
                          <span className="hq-overline">{t("Browser Teratas")}</span>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {visitorAnalytics.browserBreakdown.map((b) => (
                              <Badge key={b.browser} tone="outline">
                                {b.browser}: <span className="hq-tnum">{b.views}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {/* Top cities */}
                    <Card>
                      <CardHead icon={MapPin} hue="violet" title={t("Lokasi Kota Pengunjung")} sub={t("Asal geografis kota & wilayah terbanyak")} as="h3" />
                      {visitorAnalytics.topCities.length === 0 ? (
                        <EmptyState icon={MapPin} title={t("Belum ada data lokasi tercatat.")} />
                      ) : (
                        visitorAnalytics.topCities.map((c, idx) => (
                          <div key={`${c.city}-${idx}`} className="hq-list-row">
                            <span className="hq-rank">{idx + 1}</span>
                            <span className="hq-t min-w-0 truncate">{c.city}</span>
                            <span className="hq-m">{c.country}</span>
                            <span className="ml-auto flex items-center gap-2">
                              <span className="hq-tnum hq-muted text-[12px]">{t("{views} views", { views: c.views })}</span>
                              <Badge tone="accent">{c.percentage}%</Badge>
                            </span>
                          </div>
                        ))
                      )}
                    </Card>

                    {/* Top pages */}
                    <Card>
                      <CardHead icon={Eye} hue="amber" title={t("Halaman Paling Populer")} sub={t("Top 5 URL yang paling sering diakses publik")} as="h3" />
                      {visitorAnalytics.topPages.length === 0 ? (
                        <EmptyState icon={Eye} title={t("Belum ada kunjungan tercatat.")} />
                      ) : (
                        visitorAnalytics.topPages.map((page, idx) => (
                          <div key={page.path} className="hq-list-row">
                            <span className="hq-rank">{idx + 1}</span>
                            <span className="hq-mono min-w-0 truncate text-[var(--hq-text-primary)]">{page.path}</span>
                            <span className="ml-auto shrink-0 text-[12px]">
                              <b className="hq-tnum font-medium text-[var(--hq-text-primary)]">{page.views}</b> <span className="hq-faint">{t("views")}</span>
                            </span>
                          </div>
                        ))
                      )}
                    </Card>
                  </div>

                  {/* Live visitor log */}
                  <Card className="mt-4">
                    <CardHead icon={Activity} hue="blue" title={t("Live Visitor Log (Detail Pengunjung)")} sub={t("Catatan riwayat kunjungan real-time dengan informasi IP Address, Kota, dan Perangkat.")} as="h3" />
                    <div className="hq-table-wrap">
                      <table className="hq-table">
                        <thead>
                          <tr>
                            <th>{t("Waktu")}</th>
                            <th>{t("IP Address")}</th>
                            <th>{t("Lokasi (Kota, Negara)")}</th>
                            <th>{t("Halaman Dikunjungi")}</th>
                            <th>{t("Perangkat & Browser")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedVisitors.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center">
                                {t("Belum ada data kunjungan.")}
                              </td>
                            </tr>
                          ) : (
                            paginatedVisitors.map((v) => {
                              const DevIcon = deviceIcon(v.deviceType);
                              return (
                                <tr key={v.id}>
                                  <td className="whitespace-nowrap hq-tnum">{formatDetailedTime(v.createdAt, intlLocale)}</td>
                                  <td className="whitespace-nowrap hq-mono strong">{v.ip || "127.0.0.1"}</td>
                                  <td className="whitespace-nowrap">
                                    <span className="flex items-center gap-1.5">
                                      <MapPin size={12} className="text-[var(--hq-text-tertiary)]" aria-hidden="true" />
                                      <span className="font-medium text-[var(--hq-text-primary)]">{v.city || "Jakarta"},</span> {v.country || "Indonesia"}
                                    </span>
                                  </td>
                                  <td>
                                    <code className="hq-code">{v.path}</code>
                                  </td>
                                  <td className="whitespace-nowrap">
                                    <span className="flex items-center gap-1.5">
                                      <DevIcon size={13} className="text-[var(--hq-text-tertiary)]" aria-hidden="true" />
                                      {v.deviceType || "Desktop"} · {v.browser || "Chrome"} ({v.os || "macOS"})
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      summary={withNodes(t("Menampilkan {from}–{to} dari {total} kunjungan log"), {
                        from: <b>{totalVisitorItems === 0 ? 0 : (visitorFeedPage - 1) * visitorFeedPageSize + 1}</b>,
                        to: <b>{Math.min(visitorFeedPage * visitorFeedPageSize, totalVisitorItems)}</b>,
                        total: <b>{totalVisitorItems}</b>,
                      })}
                      page={visitorFeedPage}
                      pages={totalVisitorPages}
                      pageSize={visitorFeedPageSize}
                      onPage={setVisitorFeedPage}
                      onPageSize={(size) => {
                        setVisitorFeedPageSize(size);
                        setVisitorFeedPage(1);
                      }}
                    />
                  </Card>
                </>
              )}
            </section>
          )}

          {/* Recent activity + quick access */}
          <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardHead icon={Clock3} hue="violet" title={t("Recent activity")} sub={t("Log riwayat perubahan produk, konten, dan akun.")} />
              {recentActivity.length === 0 ? (
                <EmptyState icon={Clock3} title={t("Belum ada aktivitas.")}>
                  {t("Perubahan produk, konten situs, dan role pengguna akan otomatis tercatat di sini.")}
                </EmptyState>
              ) : (
                <>
                  {paginatedActivity.map((activity) => {
                    const Icon = activityIcon(activity.eventType);
                    return (
                      <article className="hq-list-row" key={activity.id}>
                        <span className="hq-fi" aria-hidden="true">
                          <Icon size={12} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="hq-t truncate">{activity.summary}</div>
                          <div className="hq-m">
                            {activity.actorName || activity.actorOpenId} · {formatWhen(activity.createdAt, intlLocale)}
                          </div>
                        </div>
                        <code className="hq-code hidden sm:inline-flex">{activity.eventType}</code>
                      </article>
                    );
                  })}
                  <Pagination
                    summary={withNodes(t("Menampilkan {from}–{to} dari {total} aktivitas"), {
                      from: <b>{totalActivityItems === 0 ? 0 : (activityPage - 1) * activityPageSize + 1}</b>,
                      to: <b>{Math.min(activityPage * activityPageSize, totalActivityItems)}</b>,
                      total: <b>{totalActivityItems}</b>,
                    })}
                    page={activityPage}
                    pages={totalActivityPages}
                    pageSize={activityPageSize}
                    onPage={setActivityPage}
                    onPageSize={(size) => {
                      setActivityPageSize(size);
                      setActivityPage(1);
                    }}
                  />
                </>
              )}
            </Card>

            <Card as="div" className="self-start">
              <CardHead icon={LayoutDashboard} hue="teal" title={t("Akses Cepat CMS")} />
              {([
                [CMS_ROUTES.products, t("Katalog Produk Registry"), Box],
                [CMS_ROUTES.inbox, t("Kotak Masuk Kontak"), Inbox],
                [CMS_ROUTES.content, t("Site Content & Copy Editor"), FileText],
                [CMS_ROUTES.users, t("Manajemen User & Peran"), UsersRound],
              ] as const).map(([href, label, Icon]) => (
                <Link key={href} href={href} className="hq-list-row">
                  <Icon size={15} className="text-[var(--hq-text-tertiary)]" aria-hidden="true" />
                  <span className="hq-t flex-1">{label}</span>
                  <ArrowUpRight size={14} className="text-[var(--hq-text-tertiary)]" aria-hidden="true" />
                </Link>
              ))}
            </Card>
          </section>
        </>
      )}
    </>
  );
}
