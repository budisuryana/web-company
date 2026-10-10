/** CMS user management: searchable, role-filtered approval controls for identities that have signed in. */
import { useMemo, useState } from "react";
import { Check, Clock3, Crown, Search, ShieldCheck, ShieldOff, UserRoundPlus, UsersRound } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ConfirmModal from "@/components/ConfirmModal";
import { useAdminLocale, useT } from "@/admin/i18n";
import { Badge, Button, Card, CardHead, EmptyState, ErrorState, LoadingState, PageHead, StatCard } from "@/studio/ui";

type RoleFilter = "all" | "admin" | "user" | "owner";

const initials = (name: string | null, email: string | null, openId: string) =>
  (name || email || openId)
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

const dateLabel = (value: Date, intlLocale: string) =>
  new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const t = useT();
  const { locale } = useAdminLocale();
  const intlLocale = locale === "en" ? "en-GB" : "id-ID";
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
    confirmLabel: t("Konfirmasi"),
  });

  const setRole = trpc.registry.admin.users.setRole.useMutation({
    onSuccess: (user) => {
      toast.success(
        user.role === "admin"
          ? t("{name} kini menjadi administrator.", { name: user.name || user.email || t("Pengguna") })
          : t("Hak akses administrator {name} telah dicabut.", { name: user.name || user.email || t("Pengguna") })
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
        title: t("Jadikan Administrator?"),
        description: t(
          "Apakah Anda yakin ingin memberikan hak akses Administrator kepada {label}? Pengguna ini akan dapat mengelola katalog produk, mengubah konten website, dan mengelola hak akses akun tim lain.",
          { label }
        ),
        confirmLabel: t("Jadikan Admin"),
        variant: "primary",
      });
    } else {
      setConfirmModal({
        open: true,
        openId,
        role: "user",
        title: t("Cabut Hak Akses Admin?"),
        description: t(
          "Apakah Anda yakin ingin mencabut hak akses Administrator dari {label}? Akun ini tidak akan dapat lagi mengakses panel CMS Workshop Collective.",
          { label }
        ),
        confirmLabel: t("Cabut Akses Admin"),
        variant: "danger",
      });
    }
  };

  return (
    <>
      <PageHead title={t("Manajemen Pengguna")} description={t("Kelola akun pengguna yang terdaftar, berikan peran Administrator, atau sesuaikan hak akses CMS dengan aman.")} />

      <div className="hq-stats three">
        <StatCard icon={UsersRound} hue="blue" label={t("Known accounts")} value={users.length} sub={t("Total akun terdaftar")} />
        <StatCard icon={ShieldCheck} hue="teal" label={t("Administrators")} value={administrators.length} sub={t("Akses admin aktif")} />
        <StatCard icon={Clock3} hue="amber" label={t("Awaiting approval")} value={pendingUsers.length} sub={t("Menunggu persetujuan")} tone={pendingUsers.length > 0 ? "warning" : undefined} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <CardHead
            icon={UsersRound}
            hue="blue"
            title={t("Daftar Pengguna & Izin")}
            sub={t("Pengguna dengan role admin memiliki kontrol penuh terhadap CMS Workshop.")}
          />
          <div className="hq-toolbar">
            <span className="hq-input-icon w-full sm:w-64">
              <Search aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Cari nama atau email...")} aria-label={t("Cari nama atau email...")} className="hq-input" />
            </span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)} aria-label={t("Peran")} className="hq-select w-auto min-w-[160px]">
              <option value="all">{t("Semua Akun")}</option>
              <option value="admin">{t("Administrator")}</option>
              <option value="user">{t("User Biasa")}</option>
              <option value="owner">{t("Project Owner")}</option>
            </select>
          </div>

          {usersQuery.isLoading ? (
            <LoadingState>{t("Memuat daftar akun…")}</LoadingState>
          ) : usersQuery.isError ? (
            <ErrorState onRetry={() => void usersQuery.refetch()}>{usersQuery.error.message}</ErrorState>
          ) : filteredUsers.length === 0 ? (
            <EmptyState icon={UserRoundPlus} title={t("Tidak ada akun yang sesuai.")}>
              {t("Bersihkan kolom pencarian atau ganti filter role di atas.")}
            </EmptyState>
          ) : (
            <div className="hq-table-wrap">
              <table className="hq-table hq-users">
                <thead>
                  <tr>
                    <th>{t("Pengguna")}</th>
                    <th>{t("Peran")}</th>
                    <th>{t("Terakhir login")}</th>
                    <th className="num">{t("Aksi")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const label = user.name || user.username || user.email || t("Akun Tanpa Nama");
                    const isSelf = user.openId === currentUser?.openId;
                    const canDemote = user.role === "admin" && !user.isProjectOwner && !isSelf && administrators.length > 1;

                    return (
                      <tr key={user.openId}>
                        <td>
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className={`hq-avatar ${user.role === "admin" ? "" : "muted"}`} aria-hidden="true">
                              {initials(user.name, user.email, user.openId)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate font-medium text-[var(--hq-text-primary)]">{label}</span>
                                {user.isProjectOwner && <Badge tone="warning" icon={Crown}>{t("Owner")}</Badge>}
                                {isSelf && <Badge tone="outline">{t("Anda")}</Badge>}
                              </div>
                              <div className="hq-faint truncate text-[12px]">{user.email || t("Tanpa email")}</div>
                              <div className="hq-faint hq-mono truncate text-[11px]">{user.openId}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge tone={user.role === "admin" ? "success" : "neutral"} icon={user.role === "admin" ? ShieldCheck : Clock3}>
                            {user.role === "admin" ? t("Administrator") : t("Standard User")}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap hq-tnum">{dateLabel(user.lastSignedIn, intlLocale)}</td>
                        <td className="num">
                          {user.role === "user" ? (
                            <Button size="sm" variant="primary" icon={Check} disabled={setRole.isPending} onClick={() => promptRoleChange(user.openId, "admin", label)}>
                              {t("Jadikan Admin")}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              icon={ShieldOff}
                              disabled={!canDemote || setRole.isPending}
                              onClick={() => promptRoleChange(user.openId, "user", label)}
                              title={!canDemote ? t("Owner, akun Anda sendiri, dan admin terakhir tidak dapat dicabut.") : t("Cabut hak akses administrator")}
                            >
                              {t("Cabut Admin")}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card as="div">
          <CardHead icon={ShieldCheck} hue="violet" title={t("Alur Perizinan")} as="h3" />
          <ol className="hq-steps">
            <li><span>01</span>{t("Akun admin dapat mengelola semua produk dan konten situs.")}</li>
            <li><span>02</span>{t("Cari dan atur hak akses akun melalui tabel di bawah.")}</li>
            <li><span>03</span>{t("Akun pemilik (Owner) dan akun aktif terlindungi dari pencabutan.")}</li>
          </ol>
        </Card>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={t("Batal")}
        variant={confirmModal.variant}
        isPending={setRole.isPending}
        onConfirm={() => {
          setRole.mutate({
            openId: confirmModal.openId,
            role: confirmModal.role,
          });
        }}
      />
    </>
  );
}
