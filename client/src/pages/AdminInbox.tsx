/** CMS inbox: enquiries submitted from the public contact form, with triage and reply-by-email. */
import { useMemo, useState } from "react";
import { Archive, CalendarDays, Inbox, Mail, MailOpen, RotateCcw, Search, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { enGB, id as idLocale } from "date-fns/locale";
import { useAdminLocale, useT } from "@/admin/i18n";
import type { AdminPhrase } from "@/admin/phrases";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHead, StatCard, type Tone } from "@/studio/ui";

type Filter = "new" | "read" | "archived" | "all";

const FILTERS: Array<{ key: Filter; label: AdminPhrase }> = [
  { key: "new", label: "Belum dibaca" },
  { key: "read", label: "Sudah dibaca" },
  { key: "archived", label: "Diarsipkan" },
  { key: "all", label: "Semua" },
];

const STATUS_TONE: Record<string, Tone> = { new: "warning", read: "success", archived: "neutral" };
const STATUS_LABEL: Record<string, AdminPhrase> = { new: "Baru", read: "Dibaca", archived: "Arsip" };


export default function AdminInbox() {
  const { user } = useAuth();
  const t = useT();
  const { locale } = useAdminLocale();
  const isAdmin = user?.role === "admin";
  const [filter, setFilter] = useState<Filter>("new");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const utils = trpc.useUtils();
  const listQuery = trpc.registry.admin.submissions.list.useQuery(
    filter === "all" ? {} : { status: filter },
    { enabled: isAdmin },
  );
  const countsQuery = trpc.registry.admin.submissions.counts.useQuery(undefined, { enabled: isAdmin });

  const refresh = () => {
    void utils.registry.admin.submissions.list.invalidate();
    void utils.registry.admin.submissions.counts.invalidate();
  };
  const setStatus = trpc.registry.admin.submissions.setStatus.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
  });
  const remove = trpc.registry.admin.submissions.remove.useMutation({
    onSuccess: () => {
      refresh();
      toast.success(t("Pesan dihapus."));
      setPendingDelete(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const rows = listQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      `${row.name} ${row.email} ${row.company ?? ""} ${row.message}`.toLowerCase().includes(term),
    );
  }, [rows, search]);

  const counts = countsQuery.data;

  return (
    <>
      <PageHead
        title={t("Kotak Masuk")}
        description={t("Setiap pesan yang dikirim melalui halaman Kontak tersimpan di sini. Tandai sudah dibaca atau arsipkan setelah ditindaklanjuti.")}
      />
      {counts && (
        <div className="hq-stats">
          <StatCard icon={Mail} hue="amber" label={t("Belum dibaca")} value={counts.unread} tone={counts.unread > 0 ? "warning" : undefined} />
          <StatCard icon={CalendarDays} hue="blue" label={t("7 hari terakhir")} value={counts.lastSevenDays} />
        </div>
      )}

      <Card>
        <div className="hq-toolbar">
          <div className="hq-chips" role="group" aria-label={t("Kotak Masuk")}>
            {FILTERS.map((item) => (
              <button key={item.key} type="button" className="hq-chip" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>
                {t(item.label)}
                {item.key === "new" && counts?.unread ? <span className="hq-n">{counts.unread}</span> : null}
              </button>
            ))}
          </div>
          <span className="hq-input-icon ml-auto w-full md:w-72">
            <Search aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Cari nama, email, atau isi pesan…")} aria-label={t("Cari nama, email, atau isi pesan…")} className="hq-input" />
          </span>
        </div>

        {listQuery.isLoading ? (
          <LoadingState>{t("Memuat pesan…")}</LoadingState>
        ) : listQuery.isError ? (
          <ErrorState onRetry={() => void listQuery.refetch()}>{listQuery.error.message}</ErrorState>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Inbox} title={search.trim() ? t("Tidak ada pesan yang cocok.") : t("Belum ada pesan di kategori ini.")}>
            {t("Pesan baru dari halaman Kontak akan muncul di sini secara otomatis.")}
          </EmptyState>
        ) : (
          <ul className="hq-msgs">
            {filtered.map((row) => (
              <li key={row.id} className={`hq-msg ${row.status === "new" ? "unread" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="hq-avatar muted" aria-hidden="true">{row.name.trim().charAt(0).toUpperCase() || "?"}</span>
                    <strong className="hq-msg-name">{row.name}</strong>
                    {STATUS_LABEL[row.status] && <Badge tone={STATUS_TONE[row.status]} dot={row.status === "new"}>{t(STATUS_LABEL[row.status])}</Badge>}
                    {row.company && <span className="hq-faint text-[12px]">· {row.company}</span>}
                  </div>
                  <span className="hq-faint hq-tnum text-[12px]">
                    {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true, locale: locale === "en" ? enGB : idLocale })}
                  </span>
                </div>
                <a href={`mailto:${row.email}?subject=${encodeURIComponent(`Balasan untuk ${row.name}`)}`} className="hq-link hq-mono mt-1 inline-flex items-center gap-1.5">
                  <Mail size={12} aria-hidden="true" /> {row.email}
                </a>
                <p className="hq-msg-body">{row.message}</p>
                <div className="flex flex-wrap gap-1.5">
                  {row.status !== "read" && (
                    <Button size="sm" icon={MailOpen} disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: row.id, status: "read" })}>
                      {t("Tandai dibaca")}
                    </Button>
                  )}
                  {row.status !== "archived" && (
                    <Button size="sm" icon={Archive} disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: row.id, status: "archived" })}>
                      {t("Arsipkan")}
                    </Button>
                  )}
                  {row.status !== "new" && (
                    <Button size="sm" icon={RotateCcw} disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: row.id, status: "new" })}>
                      {t("Kembalikan ke baru")}
                    </Button>
                  )}
                  <Button size="sm" variant="danger" icon={Trash2} onClick={() => setPendingDelete({ id: row.id, name: row.name })}>
                    {t("Hapus")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => { if (!next) setPendingDelete(null); }}
        title={t("Hapus pesan ini?")}
        description={t("Pesan dari {name} akan dihapus permanen dan tidak bisa dikembalikan.", { name: pendingDelete?.name ?? "" })}
        confirmLabel={t("Hapus permanen")}
        cancelLabel={t("Batal")}
        variant="danger"
        isPending={remove.isPending}
        onConfirm={() => pendingDelete && remove.mutate({ id: pendingDelete.id })}
      />
    </>
  );
}
