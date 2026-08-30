/** CMS user management: searchable, role-filtered approval controls for identities that have signed in. */
import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock3,
  Crown,
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import AdminGuard from "@/pages/AdminGuard";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ConfirmModal from "@/components/ConfirmModal";

type RoleFilter = "all" | "admin" | "user" | "owner";

const initials = (name: string | null, email: string | null, openId: string) =>
  (name || email || openId)
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

const dateLabel = (value: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const usersQuery = trpc.registry.admin.users.list.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    openId: string;
    role: "admin" | "user";
    title: string;
    description: string;
    variant: "danger" | "primary";
    confirmLabel: string;
  }>({
    open: false,
    openId: "",
    role: "user",
    title: "",
    description: "",
    variant: "primary",
    confirmLabel: "Konfirmasi",
  });

  const setRole = trpc.registry.admin.users.setRole.useMutation({
    onSuccess: (user) => {
      toast.success(
        user.role === "admin"
          ? `${user.name || user.email || "Pengguna"} kini menjadi administrator.`
          : `Hak akses administrator ${user.name || user.email || "Pengguna"} telah dicabut.`
      );
      void utils.registry.admin.users.list.invalidate();
      void utils.registry.admin.dashboard.invalidate();
      setConfirmModal((prev) => ({ ...prev, open: false }));
    },
    onError: (error) => {
      toast.error(error.message);
      setConfirmModal((prev) => ({ ...prev, open: false }));
    },
  });

  const users = usersQuery.data ?? [];
  const administrators = users.filter((user) => user.role === "admin");
  const pendingUsers = users.filter((user) => user.role === "user");
  const query = search.trim().toLowerCase();

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch =
          !query ||
          [user.name, user.email, user.openId, user.username]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query);
        const matchesRole =
          roleFilter === "all" || (roleFilter === "owner" ? user.isProjectOwner : user.role === roleFilter);
        return matchesSearch && matchesRole;
      }),
    [query, roleFilter, users]
  );

  const promptRoleChange = (openId: string, role: "admin" | "user", label: string) => {
    if (role === "admin") {
      setConfirmModal({
        open: true,
        openId,
        role: "admin",
        title: "Jadikan Administrator?",
        description: `Apakah Anda yakin ingin memberikan hak akses Administrator kepada ${label}? Pengguna ini akan dapat mengelola katalog produk, mengubah konten website, dan mengelola hak akses akun tim lain.`,
        confirmLabel: "Jadikan Admin",
        variant: "primary",
      });
    } else {
      setConfirmModal({
        open: true,
        openId,
        role: "user",
        title: "Cabut Hak Akses Admin?",
        description: `Apakah Anda yakin ingin mencabut hak akses Administrator dari ${label}? Akun ini tidak akan dapat lagi mengakses panel CMS Workshop Collective.`,
        confirmLabel: "Cabut Akses Admin",
        variant: "danger",
      });
    }
  };

  return (
    <AdminGuard>
      <div className="w-full">
        {/* Header */}
        <div className="mb-9 grid gap-6 border-b-2 border-[var(--ink)] pb-8 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--accent)]">
              Kontrol Akses
            </span>
            <h1 className="mt-2 admin-display text-3xl sm:text-4xl leading-tight tracking-tight text-[var(--ink)]">
              User &amp; <em className="text-[var(--accent)]">Access Management.</em>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
              Kelola akun pengguna yang terdaftar, berikan peran Administrator, atau sesuaikan hak akses CMS dengan aman.
            </p>
          </div>
          <aside className="admin-card border border-[var(--line)] bg-[var(--ink)] p-5 text-[var(--warm-2)]">
            <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--purple-30)]">
              Alur Perizinan
            </span>
            <ol className="mt-4 space-y-3 text-xs leading-5 text-white/75">
              <li>
                <b className="mr-2 text-[var(--purple-30)]">01</b>Akun admin dapat mengelola semua produk dan konten situs.
              </li>
              <li>
                <b className="mr-2 text-[var(--purple-30)]">02</b>Cari dan atur hak akses akun melalui tabel di bawah.
              </li>
              <li>
                <b className="mr-2 text-[var(--purple-30)]">03</b>Akun pemilik (Owner) dan akun aktif terlindungi dari pencabutan.
              </li>
            </ol>
          </aside>
        </div>

        {/* Metric Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Metric icon={UsersRound} label="Known accounts" value={users.length} copy="Total akun terdaftar" />
          <Metric
            icon={ShieldCheck}
            label="Administrators"
            value={administrators.length}
            copy="Akses admin aktif"
            tone="ink"
          />
          <Metric
            icon={Clock3}
            label="Awaiting approval"
            value={pendingUsers.length}
            copy="Menunggu persetujuan"
            tone={(pendingUsers.length) > 0 ? "alert" : "paper"}
          />
        </div>

        {/* Table Section */}
        <section className="overflow-hidden admin-card border border-[var(--line)] bg-white shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
            <div>
              <h2 className="admin-display text-3xl text-[var(--ink)]">Daftar Pengguna &amp; Izin</h2>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                Pengguna dengan role admin memiliki kontrol penuh terhadap CMS Workshop.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cool-40)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama atau email..."
                  className="w-56 admin-card border border-[var(--line)] bg-[var(--card)] py-2 pl-9 pr-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="relative">
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                  className="appearance-none admin-card border border-[var(--line)] bg-[var(--card)] py-2 pl-3 pr-8 text-xs font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="all">Semua Akun</option>
                  <option value="admin">Administrator</option>
                  <option value="user">User Biasa</option>
                  <option value="owner">Project Owner</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cool-40)]" />
              </label>
            </div>
          </div>

          {usersQuery.isLoading ? (
            <div className="flex items-center gap-2 p-9 text-sm text-[var(--ink-soft)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat daftar akun…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 text-center">
              <UserRoundPlus className="mx-auto h-8 w-8 text-[var(--accent)]" />
              <h3 className="mt-4 admin-display text-2xl text-[var(--ink)]">Tidak ada akun yang sesuai.</h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[var(--ink-soft)]">
                Bersihkan kolom pencarian atau ganti filter role di atas.
              </p>
            </div>
          ) : (
            <div>
              {filteredUsers.map((user) => {
                const label = user.name || user.username || user.email || "Akun Tanpa Nama";
                const isSelf = user.openId === currentUser?.openId;
                const canDemote = user.role === "admin" && !user.isProjectOwner && !isSelf && administrators.length > 1;

                return (
                  <article
                    key={user.openId}
                    className="grid gap-4 border-b border-[var(--line)] px-5 py-4 last:border-b-0 md:grid-cols-[auto_1fr_auto] md:items-center"
                  >
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-full text-sm font-extrabold ${
                        user.role === "admin" ? "bg-[var(--ink)] text-[var(--lightest)]" : "bg-[var(--green-5)] text-[var(--green-60)]"
                      }`}
                    >
                      {initials(user.name, user.email, user.openId)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-[var(--ink)]">{label}</h3>
                        {user.isProjectOwner && (
                          <span className="inline-flex items-center gap-1 bg-[var(--purple-5)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[var(--purple-60)]">
                            <Crown size={10} fill="currentColor" /> Owner
                          </span>
                        )}
                        {isSelf && (
                          <span className="bg-[var(--cool-5)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[var(--ink-soft)]">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--ink-soft)]">
                        {user.email || "Tanpa email"} <span className="mx-1 text-[var(--cool-20)]">•</span> Terakhir login{" "}
                        {dateLabel(user.lastSignedIn)}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-[var(--cool-40)]">{user.openId}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] ${
                          user.role === "admin" ? "bg-[var(--green-5)] text-[var(--green-60)]" : "bg-[var(--cool-5)] text-[var(--ink-soft)]"
                        }`}
                      >
                        {user.role === "admin" ? <ShieldCheck size={12} /> : <Clock3 size={12} />}
                        {user.role === "admin" ? "Administrator" : "Standard User"}
                      </span>

                      {user.role === "user" ? (
                        <button
                          disabled={setRole.isPending}
                          type="button"
                          onClick={() => promptRoleChange(user.openId, "admin", label)}
                          className="inline-flex items-center gap-1.5 bg-[var(--ink)] px-3 py-2 text-xs font-extrabold text-[var(--lightest)] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          <Check size={13} /> Jadikan Admin
                        </button>
                      ) : (
                        <button
                          disabled={!canDemote || setRole.isPending}
                          type="button"
                          onClick={() => promptRoleChange(user.openId, "user", label)}
                          title={
                            !canDemote
                              ? "Owner, akun Anda sendiri, dan admin terakhir tidak dapat dicabut."
                              : "Cabut hak akses administrator"
                          }
                          className="inline-flex items-center gap-1.5 border border-[var(--line-strong)] px-3 py-2 text-xs font-extrabold text-[var(--ink)] transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <ShieldOff size={13} /> Cabut Admin
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Custom Confirmation Modal */}
        <ConfirmModal
          open={confirmModal.open}
          onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          cancelLabel="Batal"
          variant={confirmModal.variant}
          isPending={setRole.isPending}
          onConfirm={() => {
            setRole.mutate({
              openId: confirmModal.openId,
              role: confirmModal.role,
            });
          }}
        />
      </div>
    </AdminGuard>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  copy,
  tone = "paper",
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
  copy: string;
  tone?: "paper" | "ink" | "alert";
}) {
  const styles =
    tone === "ink"
      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--lightest)]"
      : tone === "alert"
        ? "border-[var(--yellow-30)] bg-[var(--yellow-10)] text-[var(--ink)]"
        : "border-[var(--line)] bg-white text-[var(--ink)]";
  return (
    <div className={`admin-card border p-4 ${styles}`}>
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-[.13em] opacity-70">{label}</span>
        <Icon size={17} />
      </div>
      <strong className="mt-4 block admin-display text-4xl leading-none">{value}</strong>
      <p className="mt-2 text-xs leading-5 opacity-70">{copy}</p>
    </div>
  );
}
