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
        <section className="mb-8 grid gap-6 border-b-2 border-[#102239] pb-8 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#f05a43]">
              Workshop CMS / Overview
            </span>
            <h1 className="mt-2 font-[DM_Serif_Display] text-5xl leading-[.9] tracking-tight text-[#102239]">
              Dashboard &amp; <em className="text-[#f05a43]">Overview.</em>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Ringkasan statistik produk, metrik geografis pengunjung (kota, IP, perangkat), dan log aktivitas tim.
            </p>
          </div>
          <div className="flex flex-wrap content-end gap-3">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 bg-[#102239] px-4 py-3 text-xs font-extrabold text-[#fffdf8] transition-transform duration-150 hover:-translate-y-0.5"
            >
              Add product <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/admin/content"
              className="inline-flex items-center gap-2 border border-[#102239] bg-white px-4 py-3 text-xs font-extrabold text-[#102239] transition-transform duration-150 hover:-translate-y-0.5"
            >
              Edit Site Copy <FileText size={14} />
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-3 text-xs font-extrabold text-slate-700 transition-transform duration-150 hover:-translate-y-0.5"
            >
              Lihat Website Publik <ExternalLink size={14} />
            </a>
          </div>
        </section>

        {dashboardQuery.isLoading || !metrics ? (
          <div className="flex items-center gap-2 py-24 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat ringkasan dashboard…
          </div>
        ) : (
          <>
            {/* Metric Summary Cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard icon={Box} label="Products" value={metrics.products} copy="Total produk terdaftar" />
              <StatCard
                icon={LayoutDashboard}
                label="Published"
                value={metrics.publishedProducts}
                copy="Tampil di publik"
                tone="navy"
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
                tone="coral"
              />
            </section>

            {/* Visitor & Traffic Analytics Section */}
            {visitorAnalytics && (
              <section className="mt-9">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#f05a43]">
                      Lalu Lintas &amp; Demografi Pengunjung
                    </span>
                    <h2 className="font-[DM_Serif_Display] text-3xl text-[#102239]">Visitor &amp; Geo-Analytics</h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live GeoIP Tracking
                  </span>
                </div>

                {/* 4 Visitor Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <article className="border border-slate-900/15 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-[10px] font-extrabold uppercase tracking-[.12em]">Total Kunjungan</span>
                      <Eye size={16} className="text-[#102239]" />
                    </div>
                    <strong className="mt-3 block font-[DM_Serif_Display] text-3xl text-[#102239]">
                      {visitorAnalytics.totalViews.toLocaleString("id-ID")}
                    </strong>
                    <p className="mt-1 text-[11px] text-slate-500">Akumulasi tayangan seluruh halaman</p>
                  </article>

                  <article className="border border-slate-900/15 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-[10px] font-extrabold uppercase tracking-[.12em]">Pengunjung Unik</span>
                      <UserCheck size={16} className="text-[#4d7c5a]" />
                    </div>
                    <strong className="mt-3 block font-[DM_Serif_Display] text-3xl text-[#102239]">
                      {visitorAnalytics.uniqueVisitors.toLocaleString("id-ID")}
                    </strong>
                    <p className="mt-1 text-[11px] text-slate-500">Total individual unique visitors</p>
                  </article>

                  <article className="border border-slate-900/15 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-[10px] font-extrabold uppercase tracking-[.12em]">Kunjungan Hari Ini</span>
                      <TrendingUp size={16} className="text-[#f05a43]" />
                    </div>
                    <strong className="mt-3 block font-[DM_Serif_Display] text-3xl text-[#f05a43]">
                      {visitorAnalytics.todayViews.toLocaleString("id-ID")}
                    </strong>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {visitorAnalytics.todayUniques} pengunjung unik hari ini
                    </p>
                  </article>

                  <article className="border border-slate-900/15 bg-[#102239] p-4 text-[#fffdf8] shadow-sm">
                    <div className="flex items-center justify-between text-white/70">
                      <span className="text-[10px] font-extrabold uppercase tracking-[.12em]">Pelacakan Lokasi</span>
                      <Globe2 size={16} className="text-[#ff826e]" />
                    </div>
                    <strong className="mt-3 block font-[DM_Serif_Display] text-3xl text-[#fffdf8]">Aktif</strong>
                    <p className="mt-1 text-[11px] text-white/70">Kota, Negara, IP &amp; Device</p>
                  </article>
                </div>

                {visitorAnalytics.totalViews === 0 ? (
                  <div className="mt-6 border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                    <Globe2 className="mx-auto h-8 w-8 text-[#f05a43]" />
                    <h3 className="mt-4 font-[DM_Serif_Display] text-2xl text-[#102239]">Belum Ada Kunjungan Publik</h3>
                    <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                      Sistem pelacakan real-time sudah aktif. Data statistik, grafik tren 7 hari, asal kota pengunjung, dan log IP akan otomatis tercatat dan muncul saat pengunjung membuka website publik.
                    </p>
                    <div className="mt-5">
                      <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-[#102239] px-4 py-2.5 text-xs font-extrabold text-[#fffdf8] hover:opacity-90"
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
                      <div className="border border-slate-900/15 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-[DM_Serif_Display] text-xl text-[#102239]">Tren Kunjungan 7 Hari Terakhir</h3>
                        <p className="text-[11px] text-slate-500">Volume page views dan pengunjung unik</p>
                      </div>
                      <BarChart3 size={18} className="text-slate-400" />
                    </div>

                    <div className="mt-6 flex h-40 items-end gap-3 pt-4 sm:gap-6">
                      {visitorAnalytics.dailyTrends.map((trend) => {
                        const heightPct = Math.max(Math.round((trend.views / maxViews) * 100), 8);
                        return (
                          <div key={trend.date} className="group relative flex flex-1 flex-col items-center gap-2">
                            <div className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded bg-[#102239] px-2 py-1 text-[10px] font-bold text-white shadow group-hover:block">
                              {trend.views} views ({trend.uniques} unik)
                            </div>
                            <div className="w-full max-w-[42px] rounded-t bg-slate-100 p-0.5">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className="w-full rounded-t bg-[#f05a43] transition-all duration-300 group-hover:bg-[#102239]"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{trend.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Device & Browser Distribution */}
                  <div className="border border-slate-900/15 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-[DM_Serif_Display] text-xl text-[#102239]">Perangkat &amp; Browser</h3>
                        <p className="text-[11px] text-slate-500">Distribusi teknologi pengunjung</p>
                      </div>
                      <Monitor size={18} className="text-slate-400" />
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-[#102239]">
                          <span className="flex items-center gap-1.5"><Laptop size={13} /> Desktop</span>
                          <span>{Math.round(((visitorAnalytics.deviceBreakdown.desktop || 0) / totalDeviceViews) * 100)}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full bg-slate-100">
                          <div
                            style={{ width: `${Math.round(((visitorAnalytics.deviceBreakdown.desktop || 0) / totalDeviceViews) * 100)}%` }}
                            className="h-full bg-[#102239]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-[#102239]">
                          <span className="flex items-center gap-1.5"><Smartphone size={13} /> Mobile Phone</span>
                          <span>{Math.round(((visitorAnalytics.deviceBreakdown.mobile || 0) / totalDeviceViews) * 100)}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full bg-slate-100">
                          <div
                            style={{ width: `${Math.round(((visitorAnalytics.deviceBreakdown.mobile || 0) / totalDeviceViews) * 100)}%` }}
                            className="h-full bg-[#f05a43]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-[#102239]">
                          <span className="flex items-center gap-1.5"><Tablet size={13} /> Tablet</span>
                          <span>{Math.round(((visitorAnalytics.deviceBreakdown.tablet || 0) / totalDeviceViews) * 100)}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full bg-slate-100">
                          <div
                            style={{ width: `${Math.round(((visitorAnalytics.deviceBreakdown.tablet || 0) / totalDeviceViews) * 100)}%` }}
                            className="h-full bg-[#4d7c5a]"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-400">Browser Teratas</span>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {visitorAnalytics.browserBreakdown.map((b) => (
                            <span key={b.browser} className="inline-block bg-[#f6f0e6] px-2 py-1 text-[10px] font-bold text-[#102239]">
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
                  <div className="border border-slate-900/15 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-[DM_Serif_Display] text-xl text-[#102239]">Lokasi Kota Pengunjung</h3>
                        <p className="text-[11px] text-slate-500">Asal geografis kota &amp; wilayah terbanyak</p>
                      </div>
                      <MapPin size={18} className="text-[#f05a43]" />
                    </div>

                    <div className="mt-3 divide-y divide-slate-100">
                      {visitorAnalytics.topCities.length === 0 ? (
                        <p className="py-6 text-center text-xs text-slate-400">Belum ada data lokasi tercatat.</p>
                      ) : (
                        visitorAnalytics.topCities.map((c, idx) => (
                          <div key={`${c.city}-${idx}`} className="flex items-center justify-between py-2.5 text-xs">
                            <div className="flex items-center gap-2 overflow-hidden pr-2">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#f6f0e6] text-[10px] font-extrabold text-[#102239]">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-[#102239]">{c.city}</span>
                              <span className="text-[10px] text-slate-400">({c.country})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-[#102239]">{c.views} views</span>
                              <span className="rounded bg-[#fff0e9] px-1.5 py-0.5 text-[10px] font-extrabold text-[#f05a43]">
                                {c.percentage}%
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Top Visited Pages */}
                  <div className="border border-slate-900/15 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-[DM_Serif_Display] text-xl text-[#102239]">Halaman Paling Populer</h3>
                        <p className="text-[11px] text-slate-500">Top 5 URL yang paling sering diakses publik</p>
                      </div>
                      <Eye size={18} className="text-slate-400" />
                    </div>

                    <div className="mt-3 divide-y divide-slate-100">
                      {visitorAnalytics.topPages.length === 0 ? (
                        <p className="py-6 text-center text-xs text-slate-400">Belum ada kunjungan tercatat.</p>
                      ) : (
                        visitorAnalytics.topPages.map((page, idx) => (
                          <div key={page.path} className="flex items-center justify-between py-2.5 text-xs">
                            <div className="flex items-center gap-2 overflow-hidden pr-2">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-extrabold text-[#102239]">
                                {idx + 1}
                              </span>
                              <span className="truncate font-bold text-[#102239]">{page.path}</span>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="font-extrabold text-[#f05a43]">{page.views}</span>{" "}
                              <span className="text-[10px] text-slate-400">views</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Visitor Feed (Detailed Table with IP, City, Device, Time) */}
                <div className="mt-6 overflow-hidden border border-slate-900/15 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/10 px-5 py-4">
                    <div>
                      <h3 className="font-[DM_Serif_Display] text-2xl text-[#102239]">Live Visitor Log (Detail Pengunjung)</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Catatan riwayat kunjungan real-time dengan informasi IP Address, Kota, dan Perangkat.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">Tampilkan:</span>
                      <select
                        value={visitorFeedPageSize}
                        onChange={(e) => {
                          setVisitorFeedPageSize(Number(e.target.value));
                          setVisitorFeedPage(1);
                        }}
                        className="border border-slate-300 bg-[#fffdf8] px-2 py-1 text-xs font-bold text-[#102239] outline-none"
                      >
                        <option value={5}>5 / hal</option>
                        <option value={10}>10 / hal</option>
                        <option value={20}>20 / hal</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-900/10 bg-[#faf8f5] text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500">
                        <tr>
                          <th className="py-3 pl-5 pr-3">Waktu</th>
                          <th className="px-3 py-3">IP Address</th>
                          <th className="px-3 py-3">Lokasi (Kota, Negara)</th>
                          <th className="px-3 py-3">Halaman Dikunjungi</th>
                          <th className="px-3 py-3">Perangkat &amp; Browser</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedVisitors.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              Belum ada data kunjungan.
                            </td>
                          </tr>
                        ) : (
                          paginatedVisitors.map((v) => {
                            const DevIcon = deviceIcon(v.deviceType);
                            return (
                              <tr key={v.id} className="transition-colors hover:bg-[#faf7f2]">
                                <td className="whitespace-nowrap py-3 pl-5 pr-3 font-semibold text-slate-500">
                                  {formatDetailedTime(v.createdAt)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] font-bold text-[#102239]">
                                  {v.ip || "127.0.0.1"}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 font-bold text-[#102239]">
                                  <span className="flex items-center gap-1.5">
                                    <MapPin size={12} className="text-[#f05a43]" />
                                    {v.city || "Jakarta"}, <span className="font-normal text-slate-500">{v.country || "Indonesia"}</span>
                                  </span>
                                </td>
                                <td className="px-3 py-3 font-medium text-[#102239]">
                                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px]">
                                    {v.path}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                                  <span className="flex items-center gap-1.5">
                                    <DevIcon size={13} className="text-slate-400" />
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
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/10 bg-[#faf8f5] px-5 py-3 text-xs text-slate-600">
                    <div>
                      Menampilkan{" "}
                      <b className="text-[#102239]">
                        {totalVisitorItems === 0 ? 0 : (visitorFeedPage - 1) * visitorFeedPageSize + 1}
                      </b>
                      –
                      <b className="text-[#102239]">
                        {Math.min(visitorFeedPage * visitorFeedPageSize, totalVisitorItems)}
                      </b>{" "}
                      dari <b className="text-[#102239]">{totalVisitorItems}</b> kunjungan log
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={visitorFeedPage <= 1}
                        onClick={() => setVisitorFeedPage((p) => Math.max(p - 1, 1))}
                        className="inline-flex h-7 items-center gap-1 border border-slate-300 bg-white px-2.5 text-xs font-bold text-[#102239] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft size={13} /> Prev
                      </button>

                      <span className="px-2 text-xs font-semibold text-slate-600">
                        Hal <b className="text-[#102239]">{visitorFeedPage}</b> / {totalVisitorPages}
                      </span>

                      <button
                        type="button"
                        disabled={visitorFeedPage >= totalVisitorPages}
                        onClick={() => setVisitorFeedPage((p) => Math.min(p + 1, totalVisitorPages))}
                        className="inline-flex h-7 items-center gap-1 border border-slate-300 bg-white px-2.5 text-xs font-bold text-[#102239] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
              <div className="overflow-hidden border border-slate-900/15 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/10 px-5 py-4">
                  <div>
                    <h2 className="font-[DM_Serif_Display] text-3xl text-[#102239]">Recent activity</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Log riwayat perubahan produk, konten, dan akun.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">Tampilkan:</span>
                    <select
                      value={activityPageSize}
                      onChange={(e) => {
                        setActivityPageSize(Number(e.target.value));
                        setActivityPage(1);
                      }}
                      className="border border-slate-300 bg-[#fffdf8] px-2 py-1 text-xs font-bold text-[#102239] outline-none"
                    >
                      <option value={5}>5 / hal</option>
                      <option value={10}>10 / hal</option>
                      <option value={20}>20 / hal</option>
                    </select>
                  </div>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="p-12 text-center">
                    <Clock3 className="mx-auto h-7 w-7 text-[#f05a43]" />
                    <h3 className="mt-4 font-[DM_Serif_Display] text-2xl text-[#102239]">Belum ada aktivitas.</h3>
                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">
                      Perubahan produk, konten situs, dan role pengguna akan otomatis tercatat di sini.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="divide-y divide-slate-900/10">
                      {paginatedActivity.map((activity) => {
                        const Icon = activityIcon(activity.eventType);
                        return (
                          <article
                            className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#faf7f2]"
                            key={activity.id}
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f6f0e6] text-[#102239]">
                              <Icon size={15} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-[#102239]">{activity.summary}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {activity.actorName || activity.actorOpenId}{" "}
                                <span className="mx-1 text-slate-300">•</span> {formatWhen(activity.createdAt)}
                              </p>
                            </div>
                            <span className="hidden text-[9px] font-extrabold uppercase tracking-[.1em] text-slate-400 sm:block">
                              {activity.eventType.replace(".", " · ")}
                            </span>
                          </article>
                        );
                      })}
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/10 bg-[#faf8f5] px-5 py-3 text-xs text-slate-600">
                      <div>
                        Menampilkan{" "}
                        <b className="text-[#102239]">
                          {totalActivityItems === 0 ? 0 : (activityPage - 1) * activityPageSize + 1}
                        </b>
                        –
                        <b className="text-[#102239]">
                          {Math.min(activityPage * activityPageSize, totalActivityItems)}
                        </b>{" "}
                        dari <b className="text-[#102239]">{totalActivityItems}</b> aktivitas
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={activityPage <= 1}
                          onClick={() => setActivityPage((p) => Math.max(p - 1, 1))}
                          className="inline-flex h-7 items-center gap-1 border border-slate-300 bg-white px-2.5 text-xs font-bold text-[#102239] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft size={13} /> Prev
                        </button>

                        <span className="px-2 text-xs font-semibold text-slate-600">
                          Hal <b className="text-[#102239]">{activityPage}</b> / {totalActivityPages}
                        </span>

                        <button
                          type="button"
                          disabled={activityPage >= totalActivityPages}
                          onClick={() => setActivityPage((p) => Math.min(p + 1, totalActivityPages))}
                          className="inline-flex h-7 items-center gap-1 border border-slate-300 bg-white px-2.5 text-xs font-bold text-[#102239] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                <div className="border border-slate-900/15 bg-white p-5 shadow-sm">
                  <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">
                    Akses Cepat CMS
                  </span>
                  <div className="mt-3 divide-y divide-slate-100 text-xs">
                    <Link
                      href="/admin/products"
                      className="flex items-center justify-between py-2.5 font-bold text-[#102239] transition-colors hover:text-[#f05a43]"
                    >
                      <span>Katalog Produk Registry</span>
                      <ArrowUpRight size={13} className="text-slate-400" />
                    </Link>
                    <Link
                      href="/admin/content"
                      className="flex items-center justify-between py-2.5 font-bold text-[#102239] transition-colors hover:text-[#f05a43]"
                    >
                      <span>Site Content &amp; Copy Editor</span>
                      <ArrowUpRight size={13} className="text-slate-400" />
                    </Link>
                    <Link
                      href="/admin/users"
                      className="flex items-center justify-between py-2.5 font-bold text-[#102239] transition-colors hover:text-[#f05a43]"
                    >
                      <span>Manajemen User &amp; Peran</span>
                      <ArrowUpRight size={13} className="text-slate-400" />
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
  tone?: "paper" | "navy" | "green" | "coral";
}) {
  const styles =
    tone === "navy"
      ? "border-[#102239] bg-[#102239] text-[#fffdf8]"
      : tone === "green"
        ? "border-[#4d7c5a] bg-[#e8efe5] text-[#183d27]"
        : tone === "coral"
          ? "border-[#f05a43] bg-[#f05a43] text-[#102239]"
          : "border-slate-900/15 bg-white text-[#102239]";
  return (
    <article className={`border p-4 ${styles}`}>
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-[.13em] opacity-70">{label}</span>
        <Icon size={17} />
      </div>
      <strong className="mt-4 block font-[DM_Serif_Display] text-4xl leading-none">{value}</strong>
      <p className="mt-2 text-xs leading-5 opacity-70">{copy}</p>
    </article>
  );
}
