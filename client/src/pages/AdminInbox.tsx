/** CMS inbox: enquiries submitted from the public contact form, with triage and reply-by-email. */
import { useMemo, useState } from "react";
import { Archive, Inbox, Loader2, Mail, MailOpen, RotateCcw, Search, Trash2 } from "lucide-react";
import AdminGuard from "@/pages/AdminGuard";
import ConfirmModal from "@/components/ConfirmModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type Filter = "new" | "read" | "archived" | "all";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "new", label: "Belum dibaca" },
  { key: "read", label: "Sudah dibaca" },
  { key: "archived", label: "Diarsipkan" },
  { key: "all", label: "Semua" },
];

const STATUS_STYLE: Record<string, string> = {
  new: "bg-[var(--yellow-10)] text-[var(--ink)]",
  read: "bg-[var(--green-5)] text-[var(--green-60)]",
  archived: "bg-[var(--cool-5)] text-[var(--cool-60)]",
};
const STATUS_LABEL: Record<string, string> = { new: "Baru", read: "Dibaca", archived: "Arsip" };

const actionClass =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--ink)] transition-colors hover:bg-[var(--purple-5)] disabled:opacity-40";

export default function AdminInbox() {
  const { user } = useAuth();
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
      toast.success("Pesan dihapus.");
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
    <AdminGuard>
      <div className="w-full">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--accent)]">Kotak Masuk</span>
            <h1 className="mt-1 admin-display text-3xl leading-tight text-[var(--ink)]">Pesan dari Formulir Kontak</h1>
            <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
              Setiap pesan yang dikirim melalui halaman Kontak tersimpan di sini. Tandai sudah dibaca atau arsipkan setelah ditindaklanjuti.
            </p>
          </div>
          {counts && (
            <div className="flex gap-3">
              <div className="admin-card border border-[var(--yellow-30)] bg-[var(--yellow-10)] px-4 py-3">
                <span className="block text-[9px] font-extrabold uppercase tracking-[.13em] opacity-70">Belum dibaca</span>
                <strong className="mt-1 block admin-display text-2xl leading-none">{counts.unread}</strong>
              </div>
              <div className="admin-card border border-[var(--line)] bg-white px-4 py-3">
                <span className="block text-[9px] font-extrabold uppercase tracking-[.13em] text-[var(--ink-soft)]">7 hari terakhir</span>
                <strong className="mt-1 block admin-display text-2xl leading-none text-[var(--ink)]">{counts.lastSevenDays}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="admin-card overflow-hidden border border-[var(--line)] bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] p-4">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] transition-colors ${
                    filter === item.key
                      ? "bg-[var(--ink)] text-[var(--lightest)]"
                      : "border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--purple-5)]"
                  }`}
                >
                  {item.label}
                  {item.key === "new" && counts?.unread ? ` (${counts.unread})` : ""}
                </button>
              ))}
            </div>
            <label className="ml-auto flex h-9 min-w-[210px] flex-1 items-center gap-2 rounded-full border border-[var(--line-strong)] px-3 md:max-w-xs">
              <Search size={14} className="text-[var(--cool-40)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, email, atau isi pesan…"
                className="w-full bg-transparent text-sm text-[var(--ink)] outline-none"
              />
            </label>
          </div>

          {listQuery.isLoading ? (
            <div className="flex items-center gap-2 p-10 text-sm text-[var(--ink-soft)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat pesan…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox size={26} className="mx-auto text-[var(--cool-20)]" />
              <h3 className="mt-4 admin-display text-2xl text-[var(--ink)]">
                {search.trim() ? "Tidak ada pesan yang cocok." : "Belum ada pesan di kategori ini."}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[var(--ink-soft)]">
                Pesan baru dari halaman Kontak akan muncul di sini secara otomatis.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {filtered.map((row) => (
                <li key={row.id} className={`p-5 ${row.status === "new" ? "bg-[var(--yellow-10)]/25" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-base font-extrabold tracking-tight text-[var(--ink)]">{row.name}</strong>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.1em] ${STATUS_STYLE[row.status]}`}>
                          {STATUS_LABEL[row.status]}
                        </span>
                        {row.company && (
                          <span className="text-[11px] font-bold text-[var(--ink-soft)]">· {row.company}</span>
                        )}
                      </div>
                      <a
                        href={`mailto:${row.email}?subject=${encodeURIComponent(`Balasan untuk ${row.name}`)}`}
                        className="mt-1 inline-flex items-center gap-1.5 font-[family-name:var(--mono)] text-xs text-[var(--accent)] hover:underline"
                      >
                        <Mail size={12} /> {row.email}
                      </a>
                    </div>
                    <span className="font-[family-name:var(--mono)] text-[11px] text-[var(--cool-40)]">
                      {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true, locale: idLocale })}
                    </span>
                  </div>

                  <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[var(--ink-soft)]">{row.message}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {row.status !== "read" && (
                      <button type="button" disabled={setStatus.isPending} className={actionClass} onClick={() => setStatus.mutate({ id: row.id, status: "read" })}>
                        <MailOpen size={13} /> Tandai dibaca
                      </button>
                    )}
                    {row.status !== "archived" && (
                      <button type="button" disabled={setStatus.isPending} className={actionClass} onClick={() => setStatus.mutate({ id: row.id, status: "archived" })}>
                        <Archive size={13} /> Arsipkan
                      </button>
                    )}
                    {row.status !== "new" && (
                      <button type="button" disabled={setStatus.isPending} className={actionClass} onClick={() => setStatus.mutate({ id: row.id, status: "new" })}>
                        <RotateCcw size={13} /> Kembalikan ke baru
                      </button>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--red-30)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--red-50)] transition-colors hover:bg-[var(--red-30)] hover:text-[var(--ink)]"
                      onClick={() => setPendingDelete({ id: row.id, name: row.name })}
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => { if (!next) setPendingDelete(null); }}
        title="Hapus pesan ini?"
        description={`Pesan dari ${pendingDelete?.name ?? ""} akan dihapus permanen dan tidak bisa dikembalikan.`}
        confirmLabel="Hapus permanen"
        variant="danger"
        isPending={remove.isPending}
        onConfirm={() => pendingDelete && remove.mutate({ id: pendingDelete.id })}
      />
    </AdminGuard>
  );
}
