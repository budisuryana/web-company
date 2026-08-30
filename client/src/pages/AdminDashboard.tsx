/** CMS overview: concise operational metrics, deep visitor geo-analytics, paginated audit feed, and publishing routines. */
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Box,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Eye,
  FileText,
  Inbox,
  Globe2,
  Laptop,
  LayoutDashboard,
  Loader2,
  MapPin,
  Monitor,
  ShieldCheck,
  Smartphone,
  Tablet,
  TrendingUp,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "wouter";
import AdminGuard from "@/pages/AdminGuard";
import { useAuth } from "@/_core/hooks/useAuth";
import { CMS_ROUTES } from "@/const";
import { trpc } from "@/lib/trpc";

const activityIcon = (type: string) =>
  type.startsWith("user.")
    ? UsersRound
    : type.startsWith("site_content.")
      ? FileText
      : type.startsWith("product.")
        ? Box
        : Activity;

const formatWhen = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

const formatDetailedTime = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));

const deviceIcon = (type: string | null) => {
  if (type === "Mobile") return Smartphone;
  if (type === "Tablet") return Tablet;
  return Laptop;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
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
    <AdminGuard>
      <div className="w-full">
        {/* Header Section */}
        <section className="mb-8 grid gap-6 border-b-2 border-[var(--ink)] pb-8 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--accent)]">
              Workshop CMS / Overview
            </span>
            <h1 className="mt-2 admin-display text-3xl sm:text-4xl leading-tight tracking-tight text-[var(--ink)]">
              Dashboard &amp; <em className="text-[var(--accent)]">Overview.</em>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
              Ringkasan statistik produk, metrik geografis pengunjung (kota, IP, perangkat), dan log aktivitas tim.
            </p>
          </div>
          <div className="flex flex-wrap content-end gap-3">
            <Link
              href={CMS_ROUTES.productNew}
              className="inline-flex items-center gap-2 bg-[var(--ink)] px-4 py-3 text-xs font-extrabold text-[var(--lightest)] transition-transform duration-150 hover:-translate-y-0.5"
            >
              Add product <ArrowUpRight size={14} />
            </Link>
            <Link
              href={CMS_ROUTES.content}
              className="inline-flex items-center gap-2 border border-[var(--ink)] bg-white px-4 py-3 text-xs font-extrabold text-[var(--ink)] transition-transform duration-150 hover:-translate-y-0.5"
            >
              Edit Site Copy <FileText size={14} />
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-[var(--line-strong)] bg-white px-4 py-3 text-xs font-extrabold text-[var(--ink)] transition-transform duration-150 hover:-translate-y-0.5"
            >
              Lihat Website Publik <ExternalLink size={14} />
            </a>
          </div>
        </section>

        {dashboardQuery.isLoading || !metrics ? (
          <div className="flex items-center gap-2 py-24 text-sm text-[var(--ink-soft)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat ringkasan dashboard…
          </div>
        ) : (
          <>
            {/* Metric Summary Cards */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard icon={Box} label="Products" value={metrics.products} copy="Total produk terdaftar" />
              <StatCard
                icon={LayoutDashboard}
                label="Published"
                value={metrics.publishedProducts}
                copy="Tampil di publik"
                tone="ink"
              />
              <StatCard icon={FileText} label="Drafts" value={metrics.draftProducts} copy="Draf privat" />
              <StatCard
                icon={ShieldCheck}
                label="Administrators"
                value={metrics.administrators}
                copy="Akun admin aktif"
                tone="green"
              />
              <StatCard
                icon={UsersRound}
                label="Pending accounts"
                value={metrics.pendingUsers}
                copy="Menunggu persetujuan"
                tone={metrics.pendingUsers > 0 ? "alert" : "paper"}
              />
              <StatCard
                icon={Inbox}
                label="Pesan masuk"
                value={inboxCounts.data?.unread ?? 0}
                copy="Belum dibaca"
                tone={(inboxCounts.data?.unread ?? 0) > 0 ? "alert" : "paper"}
              />
            </section>

            {/* Visitor & Traffic Analytics Section */}
            {visitorAnalytics && (
              <section className="mt-9">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">
                      Lalu Lintas &amp; Demografi Pengunjung
                    </span>
                    <h2 className="admin-display text-3xl text-[var(--ink)]">Visitor &amp; Geo-Analytics</h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live GeoIP Tracking
                  </span>
                </div>

                {/* 4 Visitor Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <article className="admin-card border border-[var(--line)] bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-[var(--ink-soft)]">
                      <span className="text-[10px] font-extrabold uppercase tracking-[.12em]">Total Kunjungan</span>
                      <Eye size={16} className="text-[var(--ink)]" />
                    </div>
                    <strong className="mt-3 block admin-display text-3xl text-[var(--ink)]">
                      {visitorAnalytics.totalViews.toLocaleString("id-ID")}
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--ink-soft)]">Akumulasi tayangan seluruh halaman</p>
                  </article>

                  <article className="admin-card border border-[var(--line)] bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-[var(--ink-soft)]">
                      <span className="text-[10px] font-extrabold uppercase tracking-[.12em]">Pengunjung Unik</span>
                      <UserCheck size={16} className="text-[var(--green-50)]" />
                    </div>
                    <strong className="mt-3 block admin-display text-3xl text-[var(--ink)]">
                      {visitorAnalytics.uniqueVisitors.toLocaleString("id-ID")}
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--ink-soft)]">Total individual unique visitors</p>
                  </article>

                  <article className="admin-card border border-[var(--line)] bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-[var(--ink-soft)]">
                      <span className="text-[10px] font-extrabold uppercase tracking-[.12em]">Kunjungan Hari Ini</span>
                      <TrendingUp size={16} className="text-[var(--accent)]" />
                    </div>
                    <strong className="mt-3 block admin-display text-3xl text-[var(--accent)]">
                      {visitorAnalytics.todayViews.toLocaleString("id-ID")}
                    </strong>
                    <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                      {visitorAnalytics.todayUniques} pengunjung unik hari ini
                    </p>
                  </article>

                  <article className="admin-card border border-[var(--line)] bg-[var(--ink)] p-4 text-[var(--lightest)] shadow-sm">
                    <div className="flex items-center justify-between text-white/70">
                      <span className="text-[10px] font-extrabold uppercase tracking-[.12em]">Pelacakan Lokasi</span>
                      <Globe2 size={16} className="text-[var(--purple-30)]" />
                    </div>
                    <strong className="mt-3 block admin-display text-3xl text-[var(--lightest)]">Aktif</strong>
                    <p className="mt-1 text-[11px] text-white/70">Kota, Negara, IP &amp; Device</p>
                  </article>
                </div>

                {visitorAnalytics.totalViews === 0 ? (
                  <div className="mt-6 border border-dashed border-[var(--line-strong)] bg-white p-10 text-center shadow-sm">
                    <Globe2 className="mx-auto h-8 w-8 text-[var(--accent)]" />
                    <h3 className="mt-4 admin-display text-2xl text-[var(--ink)]">Belum Ada Kunjungan Publik</h3>
                    <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[var(--ink-soft)]">
                      Sistem pelacakan real-time sudah aktif. Data statistik, grafik tren 7 hari, asal kota pengunjung, dan log IP akan otomatis tercatat dan muncul saat pengunjung membuka website publik.
                    </p>
                    <div className="mt-5">
                      <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-[var(--ink)] px-4 py-2.5 text-xs font-extrabold text-[var(--lightest)] hover:opacity-90"
                      >
                        Buka Website Publik untuk Uji Tracking <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Top Cities, Top Pages, Device Breakdown & Trends Grid */}
                    <div className="mt-4 grid gap-6 lg:grid-cols-3">
                      {/* Daily Trend Visual Chart */}
                      <div className="admin-card border border-[var(--line)] bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                      <div>
                        <h3 className="admin-display text-xl text-[var(--ink)]">Tren Kunjungan 7 Hari Terakhir</h3>
                        <p className="text-[11px] text-[var(--ink-soft)]">Volume page views dan pengunjung unik</p>
                      </div>
                      <BarChart3 size={18} className="text-[var(--cool-40)]" />
                    </div>

                    <div className="mt-6 flex h-40 gap-3 pt-4 sm:gap-6">
                      {visitorAnalytics.dailyTrends.map((trend) => {
                        const heightPct = Math.max(Math.round((trend.views / maxViews) * 100), 8);
                        return (
                          <div key={trend.date} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                            <div className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded bg-[var(--ink)] px-2 py-1 text-[10px] font-bold text-white shadow group-hover:block">
                              {trend.views} views ({trend.uniques} unik)
                            </div>
                            <div className="flex w-full max-w-[42px] flex-1 items-end rounded-t bg-[var(--cool-5)] p-0.5">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className="w-full rounded-t bg-[var(--accent)] transition-all duration-300 group-hover:bg-[var(--purple-60)]"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-[var(--ink-soft)]">{trend.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Device & Browser Distribution */}
                  <div className="admin-card border border-[var(--line)] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                      <div>
                        <h3 className="admin-display text-xl text-[var(--ink)]">Perangkat &amp; Browser</h3>
                        <p className="text-[11px] text-[var(--ink-soft)]">Distribusi teknologi pengunjung</p>
                      </div>
                      <Monitor size={18} className="text-[var(--cool-40)]" />
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-[var(--ink)]">
                          <span className="flex items-center gap-1.5"><Laptop size={13} /> Desktop</span>
                          <span>{Math.round(((visitorAnalytics.deviceBreakdown.desktop || 0) / totalDeviceViews) * 100)}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full bg-[var(--cool-5)]">
                          <div
                            style={{ width: `${Math.round(((visitorAnalytics.deviceBreakdown.desktop || 0) / totalDeviceViews) * 100)}%` }}
                            className="h-full bg-[var(--ink)]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-[var(--ink)]">
                          <span className="flex items-center gap-1.5"><Smartphone size={13} /> Mobile Phone</span>
                          <span>{Math.round(((visitorAnalytics.deviceBreakdown.mobile || 0) / totalDeviceViews) * 100)}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full bg-[var(--cool-5)]">
                          <div
                            style={{ width: `${Math.round(((visitorAnalytics.deviceBreakdown.mobile || 0) / totalDeviceViews) * 100)}%` }}
                            className="h-full bg-[var(--accent)]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-[var(--ink)]">
                          <span className="flex items-center gap-1.5"><Tablet size={13} /> Tablet</span>
                          <span>{Math.round(((visitorAnalytics.deviceBreakdown.tablet || 0) / totalDeviceViews) * 100)}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full bg-[var(--cool-5)]">
                          <div
                            style={{ width: `${Math.round(((visitorAnalytics.deviceBreakdown.tablet || 0) / totalDeviceViews) * 100)}%` }}
                            className="h-full bg-[var(--green-50)]"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--line)]">
                        <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[var(--cool-40)]">Browser Teratas</span>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {visitorAnalytics.browserBreakdown.map((b) => (
                            <span key={b.browser} className="inline-block bg-[var(--paper)] px-2 py-1 text-[10px] font-bold text-[var(--ink)]">
                              {b.browser}: {b.views}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cities & Top Pages 2-Column Grid */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {/* Top Cities in Indonesia & Global */}
                  <div className="admin-card border border-[var(--line)] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                      <div>
                        <h3 className="admin-display text-xl text-[var(--ink)]">Lokasi Kota Pengunjung</h3>
                        <p className="text-[11px] text-[var(--ink-soft)]">Asal geografis kota &amp; wilayah terbanyak</p>
                      </div>
                      <MapPin size={18} className="text-[var(--accent)]" />
                    </div>

                    <div className="mt-3 divide-y divide-[var(--line)]">
                      {visitorAnalytics.topCities.length === 0 ? (
                        <p className="py-6 text-center text-xs text-[var(--cool-40)]">Belum ada data lokasi tercatat.</p>
                      ) : (
                        visitorAnalytics.topCities.map((c, idx) => (
                          <div key={`${c.city}-${idx}`} className="flex items-center justify-between py-2.5 text-xs">
                            <div className="flex items-center gap-2 overflow-hidden pr-2">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[10px] font-extrabold text-[var(--ink)]">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-[var(--ink)]">{c.city}</span>
                              <span className="text-[10px] text-[var(--cool-40)]">({c.country})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-[var(--ink)]">{c.views} views</span>
                              <span className="rounded bg-[var(--purple-5)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--accent)]">
                                {c.percentage}%
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Top Visited Pages */}
                  <div className="admin-card border border-[var(--line)] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                      <div>
                        <h3 className="admin-display text-xl text-[var(--ink)]">Halaman Paling Populer</h3>
                        <p className="text-[11px] text-[var(--ink-soft)]">Top 5 URL yang paling sering diakses publik</p>
                      </div>
                      <Eye size={18} className="text-[var(--cool-40)]" />
                    </div>

                    <div className="mt-3 divide-y divide-[var(--line)]">
                      {visitorAnalytics.topPages.length === 0 ? (
                        <p className="py-6 text-center text-xs text-[var(--cool-40)]">Belum ada kunjungan tercatat.</p>
                      ) : (
                        visitorAnalytics.topPages.map((page, idx) => (
                          <div key={page.path} className="flex items-center justify-between py-2.5 text-xs">
                            <div className="flex items-center gap-2 overflow-hidden pr-2">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--cool-5)] text-[10px] font-extrabold text-[var(--ink)]">
                                {idx + 1}
                              </span>
                              <span className="truncate font-bold text-[var(--ink)]">{page.path}</span>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="font-extrabold text-[var(--accent)]">{page.views}</span>{" "}
                              <span className="text-[10px] text-[var(--cool-40)]">views</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Visitor Feed (Detailed Table with IP, City, Device, Time) */}
                <div className="mt-6 overflow-hidden admin-card border border-[var(--line)] bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
                    <div>
                      <h3 className="admin-display text-2xl text-[var(--ink)]">Live Visitor Log (Detail Pengunjung)</h3>
                      <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                        Catatan riwayat kunjungan real-time dengan informasi IP Address, Kota, dan Perangkat.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[var(--cool-40)]">Tampilkan:</span>
                      <select
                        value={visitorFeedPageSize}
                        onChange={(e) => {
                          setVisitorFeedPageSize(Number(e.target.value));
                          setVisitorFeedPage(1);
                        }}
                        className="border border-[var(--line-strong)] bg-[var(--card)] px-2 py-1 text-xs font-bold text-[var(--ink)] outline-none"
                      >
                        <option value={5}>5 / hal</option>
                        <option value={10}>10 / hal</option>
                        <option value={20}>20 / hal</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[var(--line)] bg-[var(--warm-2)] text-[10px] font-extrabold uppercase tracking-[.12em] text-[var(--ink-soft)]">
                        <tr>
                          <th className="py-3 pl-5 pr-3">Waktu</th>
                          <th className="px-3 py-3">IP Address</th>
                          <th className="px-3 py-3">Lokasi (Kota, Negara)</th>
                          <th className="px-3 py-3">Halaman Dikunjungi</th>
                          <th className="px-3 py-3">Perangkat &amp; Browser</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)]">
                        {paginatedVisitors.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-[var(--cool-40)]">
                              Belum ada data kunjungan.
                            </td>
                          </tr>
                        ) : (
                          paginatedVisitors.map((v) => {
                            const DevIcon = deviceIcon(v.deviceType);
                            return (
                              <tr key={v.id} className="transition-colors hover:bg-[var(--warm-2)]">
                                <td className="whitespace-nowrap py-3 pl-5 pr-3 font-semibold text-[var(--ink-soft)]">
                                  {formatDetailedTime(v.createdAt)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] font-bold text-[var(--ink)]">
                                  {v.ip || "127.0.0.1"}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 font-bold text-[var(--ink)]">
                                  <span className="flex items-center gap-1.5">
                                    <MapPin size={12} className="text-[var(--accent)]" />
                                    {v.city || "Jakarta"}, <span className="font-normal text-[var(--ink-soft)]">{v.country || "Indonesia"}</span>
                                  </span>
                                </td>
                                <td className="px-3 py-3 font-medium text-[var(--ink)]">
                                  <span className="rounded bg-[var(--cool-5)] px-2 py-0.5 font-mono text-[11px]">
                                    {v.path}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-[var(--ink-soft)]">
                                  <span className="flex items-center gap-1.5">
                                    <DevIcon size={13} className="text-[var(--cool-40)]" />
                                    {v.deviceType || "Desktop"} • {v.browser || "Chrome"} ({v.os || "macOS"})
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Visitor Feed Pagination Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--warm-2)] px-5 py-3 text-xs text-[var(--ink-soft)]">
                    <div>
                      Menampilkan{" "}
                      <b className="text-[var(--ink)]">
                        {totalVisitorItems === 0 ? 0 : (visitorFeedPage - 1) * visitorFeedPageSize + 1}
                      </b>
                      –
                      <b className="text-[var(--ink)]">
                        {Math.min(visitorFeedPage * visitorFeedPageSize, totalVisitorItems)}
                      </b>{" "}
                      dari <b className="text-[var(--ink)]">{totalVisitorItems}</b> kunjungan log
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={visitorFeedPage <= 1}
                        onClick={() => setVisitorFeedPage((p) => Math.max(p - 1, 1))}
                        className="inline-flex h-7 items-center gap-1 border border-[var(--line-strong)] bg-white px-2.5 text-xs font-bold text-[var(--ink)] transition-colors hover:bg-[var(--warm-2)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft size={13} /> Prev
                      </button>

                      <span className="px-2 text-xs font-semibold text-[var(--ink-soft)]">
                        Hal <b className="text-[var(--ink)]">{visitorFeedPage}</b> / {totalVisitorPages}
                      </span>

                      <button
                        type="button"
                        disabled={visitorFeedPage >= totalVisitorPages}
                        onClick={() => setVisitorFeedPage((p) => Math.min(p + 1, totalVisitorPages))}
                        className="inline-flex h-7 items-center gap-1 border border-[var(--line-strong)] bg-white px-2.5 text-xs font-bold text-[var(--ink)] transition-colors hover:bg-[var(--warm-2)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
                  </>
                )}
              </section>
            )}

            {/* Main Content: Recent Activity (with Pagination) + Quick Guide */}
            <section className="mt-9 grid gap-6 lg:grid-cols-[1.45fr_.55fr]">
              <div className="overflow-hidden admin-card border border-[var(--line)] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
                  <div>
                    <h2 className="admin-display text-3xl text-[var(--ink)]">Recent activity</h2>
                    <p className="mt-0.5 text-xs text-[var(--ink-soft)]">Log riwayat perubahan produk, konten, dan akun.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[var(--cool-40)]">Tampilkan:</span>
                    <select
                      value={activityPageSize}
                      onChange={(e) => {
                        setActivityPageSize(Number(e.target.value));
                        setActivityPage(1);
                      }}
                      className="border border-[var(--line-strong)] bg-[var(--card)] px-2 py-1 text-xs font-bold text-[var(--ink)] outline-none"
                    >
                      <option value={5}>5 / hal</option>
                      <option value={10}>10 / hal</option>
                      <option value={20}>20 / hal</option>
                    </select>
                  </div>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="p-12 text-center">
                    <Clock3 className="mx-auto h-7 w-7 text-[var(--accent)]" />
                    <h3 className="mt-4 admin-display text-2xl text-[var(--ink)]">Belum ada aktivitas.</h3>
                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[var(--ink-soft)]">
                      Perubahan produk, konten situs, dan role pengguna akan otomatis tercatat di sini.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="divide-y divide-[var(--line)]">
                      {paginatedActivity.map((activity) => {
                        const Icon = activityIcon(activity.eventType);
                        return (
                          <article
                            className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--warm-2)]"
                            key={activity.id}
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[var(--ink)]">
                              <Icon size={15} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-[var(--ink)]">{activity.summary}</p>
                              <p className="mt-0.5 text-[11px] text-[var(--ink-soft)]">
                                {activity.actorName || activity.actorOpenId}{" "}
                                <span className="mx-1 text-[var(--cool-20)]">•</span> {formatWhen(activity.createdAt)}
                              </p>
                            </div>
                            <span className="hidden text-[9px] font-extrabold uppercase tracking-[.1em] text-[var(--cool-40)] sm:block">
                              {activity.eventType.replace(".", " · ")}
                            </span>
                          </article>
                        );
                      })}
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--warm-2)] px-5 py-3 text-xs text-[var(--ink-soft)]">
                      <div>
                        Menampilkan{" "}
                        <b className="text-[var(--ink)]">
                          {totalActivityItems === 0 ? 0 : (activityPage - 1) * activityPageSize + 1}
                        </b>
                        –
                        <b className="text-[var(--ink)]">
                          {Math.min(activityPage * activityPageSize, totalActivityItems)}
                        </b>{" "}
                        dari <b className="text-[var(--ink)]">{totalActivityItems}</b> aktivitas
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={activityPage <= 1}
                          onClick={() => setActivityPage((p) => Math.max(p - 1, 1))}
                          className="inline-flex h-7 items-center gap-1 border border-[var(--line-strong)] bg-white px-2.5 text-xs font-bold text-[var(--ink)] transition-colors hover:bg-[var(--warm-2)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft size={13} /> Prev
                        </button>

                        <span className="px-2 text-xs font-semibold text-[var(--ink-soft)]">
                          Hal <b className="text-[var(--ink)]">{activityPage}</b> / {totalActivityPages}
                        </span>

                        <button
                          type="button"
                          disabled={activityPage >= totalActivityPages}
                          onClick={() => setActivityPage((p) => Math.min(p + 1, totalActivityPages))}
                          className="inline-flex h-7 items-center gap-1 border border-[var(--line-strong)] bg-white px-2.5 text-xs font-bold text-[var(--ink)] transition-colors hover:bg-[var(--warm-2)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar: Akses Cepat CMS */}
              <aside className="space-y-4">
                <div className="admin-card border border-[var(--line)] bg-white p-5 shadow-sm">
                  <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--cool-40)]">
                    Akses Cepat CMS
                  </span>
                  <div className="mt-3 divide-y divide-[var(--line)] text-xs">
                    <Link
                      href={CMS_ROUTES.products}
                      className="flex items-center justify-between py-2.5 font-bold text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                    >
                      <span>Katalog Produk Registry</span>
                      <ArrowUpRight size={13} className="text-[var(--cool-40)]" />
                    </Link>
                    <Link
                      href={CMS_ROUTES.inbox}
                      className="flex items-center justify-between py-2.5 font-bold text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                    >
                      <span>Kotak Masuk Kontak</span>
                      <ArrowUpRight size={13} className="text-[var(--cool-40)]" />
                    </Link>
                    <Link
                      href={CMS_ROUTES.content}
                      className="flex items-center justify-between py-2.5 font-bold text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                    >
                      <span>Site Content &amp; Copy Editor</span>
                      <ArrowUpRight size={13} className="text-[var(--cool-40)]" />
                    </Link>
                    <Link
                      href={CMS_ROUTES.users}
                      className="flex items-center justify-between py-2.5 font-bold text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                    >
                      <span>Manajemen User &amp; Peran</span>
                      <ArrowUpRight size={13} className="text-[var(--cool-40)]" />
                    </Link>
                  </div>
                </div>
              </aside>
            </section>
          </>
        )}
      </div>
    </AdminGuard>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  copy,
  tone = "paper",
}: {
  icon: typeof Box;
  label: string;
  value: number;
  copy: string;
  tone?: "paper" | "ink" | "green" | "alert";
}) {
  const styles =
    tone === "ink"
      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--lightest)]"
      : tone === "green"
        ? "border-[var(--green-50)] bg-[var(--green-5)] text-[var(--green-60)]"
        : tone === "alert"
          ? "border-[var(--yellow-30)] bg-[var(--yellow-10)] text-[var(--ink)]"
          : "border-[var(--line)] bg-white text-[var(--ink)]";
  return (
    <article className={`admin-card border p-4 ${styles}`}>
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-[.13em] opacity-70">{label}</span>
        <Icon size={17} />
      </div>
      <strong className="mt-4 block admin-display text-4xl leading-none">{value}</strong>
      <p className="mt-2 text-xs leading-5 opacity-70">{copy}</p>
    </article>
  );
}
