/** Product Registry editor: validates required product content locally before the protected CMS mutation runs. */
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, BadgeCheck, BookOpen, Image as ImageIcon, ImagePlus, Languages, ListChecks, Loader2, OctagonAlert, Save, Star, Trash2, UploadCloud } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { CMS_BASE_PATH, CMS_ROUTES } from "@/const";
import { trpc } from "@/lib/trpc";
import { submitProductIfValid } from "@/lib/productValidation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ConfirmModal from "@/components/ConfirmModal";
import ProductTranslationsPanel, { translationProblems, type ProductCta } from "@/components/ProductTranslations";
import type { ProductTranslations } from "@shared/i18n/products";
import { useT, type Translate } from "@/admin/i18n";
import { ADMIN_PHRASES, type AdminPhrase } from "@/admin/phrases";
import { Badge, Button, Card, CardHead, LoadingState, PageHead, btn } from "@/studio/ui";

type EditorForm = {
  name: string; slug: string; shortDescription: string; fullDescription: string; heroHeadline: string; problem: string; solution: string; outcome: string; category: string;
  productStatus: "active" | "planned" | "retired"; publicationStatus: "draft" | "published"; capabilitiesText: string; targetUsers: string; demoUrl: string; workflowText: string;
  featured: boolean; displayOrder: number; logoUrl: string | null; logoKey: string | null; coverUrl: string | null; coverKey: string | null;
};

const blankForm: EditorForm = { name: "", slug: "", shortDescription: "", fullDescription: "", heroHeadline: "", problem: "", solution: "", outcome: "", category: "", productStatus: "active", publicationStatus: "draft", capabilitiesText: "", targetUsers: "", demoUrl: "", workflowText: "", featured: false, displayOrder: 99, logoUrl: null, logoKey: null, coverUrl: null, coverKey: null };

const FIELD_TAB: Partial<Record<keyof EditorForm, string>> = { name: "identity", slug: "identity", category: "identity", displayOrder: "identity", productStatus: "identity", publicationStatus: "identity", shortDescription: "story", fullDescription: "story", heroHeadline: "story", problem: "story", solution: "story", outcome: "story", capabilitiesText: "capabilities", targetUsers: "capabilities", demoUrl: "capabilities", workflowText: "capabilities" };

function toForm(product: any): EditorForm {
  return { name: product.name, slug: product.slug, shortDescription: product.shortDescription, fullDescription: product.fullDescription, heroHeadline: product.heroHeadline, problem: product.problem, solution: product.solution, outcome: product.outcome, category: product.category, productStatus: product.productStatus, publicationStatus: product.publicationStatus, capabilitiesText: product.capabilities.join("\n"), targetUsers: product.targetUsers, demoUrl: product.demoUrl ?? "", workflowText: product.workflowSteps.map((step: { title: string; copy: string }) => `${step.title} | ${step.copy}`).join("\n"), featured: product.featured, displayOrder: product.displayOrder, logoUrl: product.logoUrl, logoKey: product.logoKey, coverUrl: product.coverUrl, coverKey: product.coverKey };
}

/** Translates a message when it is a known admin phrase (local validation, file errors); server messages pass through unchanged. */
function translateMessage(t: Translate, message: string) {
  return message in ADMIN_PHRASES ? t(message as AdminPhrase) : message;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("File could not be read.")); reader.readAsDataURL(file); });
}

export default function AdminProductEditor() {
  const { user } = useAuth();
  const t = useT();
  const isAdmin = user?.role === "admin";
  const [, params] = useRoute(`${CMS_BASE_PATH}/products/:id`);
  const [, navigate] = useLocation();
  const id = params?.id ?? "new";
  const isNew = id === "new";
  const productQuery = trpc.registry.admin.byId.useQuery({ id }, { enabled: !isNew && isAdmin });
  const utils = trpc.useUtils();
  const [form, setForm] = useState<EditorForm>(blankForm);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof EditorForm, string>>>({});
  const [activeTab, setActiveTab] = useState("identity");
  const [translations, setTranslations] = useState<ProductTranslations>({});
  const [primaryCta, setPrimaryCta] = useState<ProductCta>(null);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmLabel: t("Hapus"),
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!productQuery.data) return;
    setForm(toForm(productQuery.data));
    setTranslations(productQuery.data.translations ?? {});
    setPrimaryCta(productQuery.data.primaryCta ?? null);
  }, [productQuery.data]);

  const create = trpc.registry.admin.create.useMutation({
    onSuccess: (product) => { toast.success(t("Product created as a registry record.")); void utils.registry.admin.list.invalidate(); if (product) navigate(CMS_ROUTES.productEdit(product.id)); },
    onError: (error) => { const slugError = error.message.toLowerCase().includes("slug"); if (slugError) { setActiveTab("identity"); setValidationErrors((current) => ({ ...current, slug: error.message })); } toast.error(slugError ? error.message : t("Product could not be created. Check the required fields and try again.")); },
  });
  const update = trpc.registry.admin.update.useMutation({
    onSuccess: () => { toast.success(t("Product changes saved.")); void utils.registry.admin.list.invalidate(); void productQuery.refetch(); },
    onError: (error) => { const slugError = error.message.toLowerCase().includes("slug"); if (slugError) { setActiveTab("identity"); setValidationErrors((current) => ({ ...current, slug: error.message })); } toast.error(slugError ? error.message : t("Product could not be saved. Check the required fields and try again.")); },
  });
  const remove = trpc.registry.admin.remove.useMutation({
    onSuccess: () => {
      toast.success(t("Produk berhasil dihapus."));
      void utils.registry.admin.list.invalidate();
      setConfirmModal((prev) => ({ ...prev, open: false }));
      navigate(CMS_ROUTES.products);
    },
    onError: (error) => {
      toast.error(error.message);
      setConfirmModal((prev) => ({ ...prev, open: false }));
    },
  });
  const upload = trpc.registry.media.upload.useMutation({ onSuccess: () => { toast.success(t("Image uploaded.")); void productQuery.refetch(); void utils.registry.admin.list.invalidate(); }, onError: (error) => toast.error(error.message) });
  const deleteScreenshot = trpc.registry.media.removeScreenshot.useMutation({
    onSuccess: () => {
      toast.success(t("Screenshot berhasil dihapus."));
      void productQuery.refetch();
      setConfirmModal((prev) => ({ ...prev, open: false }));
    },
    onError: (error) => {
      toast.error(error.message);
      setConfirmModal((prev) => ({ ...prev, open: false }));
    },
  });
  const reorderScreenshots = trpc.registry.media.reorderScreenshots.useMutation({ onSuccess: () => void productQuery.refetch(), onError: (error) => toast.error(error.message) });
  const busy = create.isPending || update.isPending || upload.isPending || remove.isPending;

  const payload = useMemo(() => ({
    name: form.name.trim(), slug: form.slug.trim(), shortDescription: form.shortDescription.trim(), fullDescription: form.fullDescription.trim(), heroHeadline: form.heroHeadline.trim(), problem: form.problem.trim(), solution: form.solution.trim(), outcome: form.outcome.trim(), category: form.category.trim(), productStatus: form.productStatus, publicationStatus: form.publicationStatus, logoUrl: form.logoUrl, logoKey: form.logoKey, coverUrl: form.coverUrl, coverKey: form.coverKey,
    capabilities: form.capabilitiesText.split("\n").map((item) => item.trim()).filter(Boolean), targetUsers: form.targetUsers.trim(), demoUrl: form.demoUrl.trim(), workflowSteps: form.workflowText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => { const [title, ...copy] = line.split("|"); return { title: title.trim(), copy: copy.join("|").trim() || "Add a short explanation." }; }), featured: form.featured, displayOrder: Number(form.displayOrder) || 0,
    translations, primaryCta,
  }), [form, translations, primaryCta]);

  const setField = <K extends keyof EditorForm>(field: K, value: EditorForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; });
  };
  const save = () => {
    if (Object.keys(translationProblems(translations)).length) {
      setActiveTab("translations");
      toast.error(t("Perbaiki kolom EN / ID yang ditandai merah sebelum menyimpan."));
      return;
    }
    const result = submitProductIfValid(form, () => { if (isNew) create.mutate(payload); else update.mutate({ id, product: payload }); });
    setValidationErrors(result.errors);
    if (!result.submitted) {
      const nextTab = Object.keys(result.errors).map((key) => FIELD_TAB[key as keyof EditorForm]).find(Boolean);
      if (nextTab) setActiveTab(nextTab);
      toast.error(t("Complete the highlighted required fields before saving."));
    }
  };
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, assetType: "logo" | "cover" | "screenshot") => {
    const file = event.target.files?.[0];
    if (!file || isNew) return;
    try { const dataUrl = await fileToDataUrl(file); upload.mutate({ productId: id, assetType, fileName: file.name, contentType: file.type, dataUrl, alt: `${form.name} ${assetType}` }); }
    catch (error) { toast.error(error instanceof Error ? translateMessage(t, error.message) : t("Upload failed.")); }
    finally { event.target.value = ""; }
  };
  const screenshots = productQuery.data?.screenshots ?? [];
  const moveScreenshot = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= screenshots.length) return; const next = [...screenshots]; [next[index], next[target]] = [next[target], next[index]]; reorderScreenshots.mutate({ productId: id, ids: next.map((screenshot) => screenshot.id) }); };

  const requestDelete = () => setConfirmModal({
    open: true,
    title: t("Hapus Produk?"),
    description: t('Apakah Anda yakin ingin menghapus produk "{name}" dari Product Registry? Data yang sudah dihapus tidak dapat dipulihkan.', { name: form.name }),
    confirmLabel: t("Hapus Produk"),
    onConfirm: () => remove.mutate({ id }),
  });
  const requestScreenshotDelete = (screenshotId: string) => setConfirmModal({
    open: true,
    title: t("Hapus Screenshot?"),
    description: t("Apakah Anda yakin ingin menghapus screenshot ini dari galeri produk?"),
    confirmLabel: t("Hapus Screenshot"),
    onConfirm: () => deleteScreenshot.mutate({ id: screenshotId }),
  });
  const statusBadges = !isNew && (
    <>
      <Badge tone={form.publicationStatus === "published" ? "success" : "neutral"} dot>{form.publicationStatus === "published" ? t("Published") : t("Draft")}</Badge>
      {form.featured && <Badge tone="warning" icon={Star}>{t("Featured")}</Badge>}
    </>
  );

  return <>
    <PageHead
      title={isNew ? t("Add New Product") : t("Edit Product Details")}
      description={isNew ? t("New product") : t("Editing: {name}", { name: form.name || t("Product") })}
      actions={<>
        {statusBadges}
        <Link href={CMS_ROUTES.products} className={btn("ghost")}><ArrowLeft aria-hidden="true" /> {t("Product Registry")}</Link>
        {!isNew && <Button variant="danger" icon={Trash2} disabled={remove.isPending} onClick={requestDelete}>{t("Delete product")}</Button>}
      </>}
    />
    {Object.keys(validationErrors).length > 0 && <div role="alert" className="hq-banner err mb-4"><OctagonAlert aria-hidden="true" /><span><b className="font-semibold">{t("Before saving:")}</b> {t("complete the required fields highlighted below. Nothing has been sent to the server yet.")}</span></div>}
    {!isNew && productQuery.isLoading ? <Card><LoadingState>{t("Loading product…")}</LoadingState></Card> : <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
      <TabsList className="hq-tabs">
        <TabsTrigger value="identity" className="hq-tab"><BadgeCheck aria-hidden="true" className="size-4" />{t("Identity & visibility")}</TabsTrigger>
        <TabsTrigger value="story" className="hq-tab"><BookOpen aria-hidden="true" className="size-4" />{t("Story & positioning")}</TabsTrigger>
        <TabsTrigger value="translations" className="hq-tab"><Languages aria-hidden="true" className="size-4" />{t("Konten EN / ID")}</TabsTrigger>
        <TabsTrigger value="capabilities" className="hq-tab"><ListChecks aria-hidden="true" className="size-4" />{t("Capabilities & audience")}</TabsTrigger>
        {!isNew && <TabsTrigger value="assets" className="hq-tab"><ImageIcon aria-hidden="true" className="size-4" />{t("Visual assets")}</TabsTrigger>}
      </TabsList>

      <TabsContent value="identity">
        <Card>
          <CardHead icon={BadgeCheck} hue="blue" title={t("Identity & visibility")} sub={t("Nama publik produk, slug URL, kategori, dan status publikasi.")}
            right={<label className="hq-check"><input type="checkbox" checked={form.featured} onChange={(event) => setField("featured", event.target.checked)} /> {t("Featured product")}</label>} />
          <div className="hq-card-body grid gap-4 md:grid-cols-2">
            <Field required label={t("Product name")} error={validationErrors.name}><input className="hq-input" aria-invalid={Boolean(validationErrors.name)} value={form.name} onChange={(event) => { setField("name", event.target.value); if (isNew) setField("slug", event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} placeholder={t("e.g. Operations Hub")} /></Field>
            <Field required label={t("Slug")} error={validationErrors.slug}><input className="hq-input hq-mono" aria-invalid={Boolean(validationErrors.slug)} value={form.slug} onChange={(event) => setField("slug", event.target.value.toLowerCase())} placeholder="operations-hub" /></Field>
            <Field required label={t("Product category")} error={validationErrors.category}><input className="hq-input" aria-invalid={Boolean(validationErrors.category)} value={form.category} onChange={(event) => setField("category", event.target.value)} placeholder={t("Work management")} /></Field>
            <Field label={t("Display order")}><input className="hq-input hq-tnum" type="number" min="0" value={form.displayOrder} onChange={(event) => setField("displayOrder", Number(event.target.value))} /></Field>
            <Field label={t("Product status")}><select className="hq-select" value={form.productStatus} onChange={(event) => setField("productStatus", event.target.value as EditorForm["productStatus"])}><option value="active">{t("Active")}</option><option value="planned">{t("Planned")}</option><option value="retired">{t("Retired")}</option></select></Field>
            <Field label={t("Public visibility")}><select className="hq-select" value={form.publicationStatus} onChange={(event) => setField("publicationStatus", event.target.value as EditorForm["publicationStatus"])}><option value="draft">{t("Draft — private")}</option><option value="published">{t("Published — public")}</option></select></Field>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="story">
        <Card>
          <CardHead icon={BookOpen} hue="teal" title={t("Story & positioning")} sub={t("Copy dan narasi produk yang tampil pada portofolio dan halaman detail.")} />
          <div className="hq-card-body grid gap-4">
            <Field required label={t("Short description")} error={validationErrors.shortDescription}><textarea className="hq-input" aria-invalid={Boolean(validationErrors.shortDescription)} rows={2} value={form.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} /></Field>
            <Field required label={t("Full description")} error={validationErrors.fullDescription}><textarea className="hq-input" aria-invalid={Boolean(validationErrors.fullDescription)} rows={3} value={form.fullDescription} onChange={(event) => setField("fullDescription", event.target.value)} /></Field>
            <Field required label={t("Hero headline")} error={validationErrors.heroHeadline}><textarea className="hq-input" aria-invalid={Boolean(validationErrors.heroHeadline)} rows={2} value={form.heroHeadline} onChange={(event) => setField("heroHeadline", event.target.value)} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field required label={t("Problem")} error={validationErrors.problem}><textarea className="hq-input" aria-invalid={Boolean(validationErrors.problem)} rows={5} value={form.problem} onChange={(event) => setField("problem", event.target.value)} /></Field>
              <Field required label={t("Solution")} error={validationErrors.solution}><textarea className="hq-input" aria-invalid={Boolean(validationErrors.solution)} rows={5} value={form.solution} onChange={(event) => setField("solution", event.target.value)} /></Field>
            </div>
            <Field required label={t("Outcome")} error={validationErrors.outcome}><textarea className="hq-input" aria-invalid={Boolean(validationErrors.outcome)} rows={2} value={form.outcome} onChange={(event) => setField("outcome", event.target.value)} /></Field>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="translations"><ProductTranslationsPanel source={{ slug: payload.slug, name: payload.name, category: payload.category, shortDescription: payload.shortDescription, fullDescription: payload.fullDescription, heroHeadline: payload.heroHeadline, problem: payload.problem, solution: payload.solution, outcome: payload.outcome, targetUsers: payload.targetUsers, capabilities: payload.capabilities, workflowSteps: payload.workflowSteps }} demoUrl={form.demoUrl} translations={translations} primaryCta={primaryCta} onChange={setTranslations} onCtaChange={setPrimaryCta} /></TabsContent>

      <TabsContent value="capabilities">
        <Card>
          <CardHead icon={ListChecks} hue="violet" title={t("Capabilities & audience")} sub={t("Daftar kapabilitas utama, target audiens, alur workflow, dan URL aplikasi produk.")} />
          <div className="hq-card-body grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field required label={t("Key capabilities — one per line")} error={validationErrors.capabilitiesText}><textarea className="hq-input" aria-invalid={Boolean(validationErrors.capabilitiesText)} rows={7} value={form.capabilitiesText} onChange={(event) => setField("capabilitiesText", event.target.value)} placeholder={t(`Reusable templates\nStructured fields`)} /></Field>
              <Field required label={t("Who it is for")} error={validationErrors.targetUsers}><textarea className="hq-input" aria-invalid={Boolean(validationErrors.targetUsers)} rows={7} value={form.targetUsers} onChange={(event) => setField("targetUsers", event.target.value)} /></Field>
            </div>
            <Field label={t('URL aplikasi produk — dipakai tombol "Coba [produk]"')} error={validationErrors.demoUrl}><input className="hq-input hq-mono" aria-invalid={Boolean(validationErrors.demoUrl)} value={form.demoUrl} onChange={(event) => setField("demoUrl", event.target.value)} placeholder="https://…" /></Field>
            <Field required label={t("How it works — one step per line: Title | Explanation")} error={validationErrors.workflowText}><textarea className="hq-input" aria-invalid={Boolean(validationErrors.workflowText)} rows={7} value={form.workflowText} onChange={(event) => setField("workflowText", event.target.value)} placeholder={t(`Plan | Set the direction.\nBuild | Move the work forward.`)} /></Field>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="assets">{!isNew && <Card>
        <CardHead icon={ImageIcon} hue="amber" title={t("Visual assets")} sub={t("File logo, cover, dan screenshot disimpan dengan aman dan terhubung ke produk ini.")}
          right={<label className={btn("default", "sm")}><ImagePlus aria-hidden="true" /> {t("Add screenshot")}<input type="file" accept="image/*" onChange={(event) => void handleUpload(event, "screenshot")} /></label>} />
        <div className="hq-card-body">
          <div className="grid gap-4 md:grid-cols-2">
            <AssetUpload label={t("Product logo")} preview={productQuery.data?.logoUrl ?? null} onChange={(event) => void handleUpload(event, "logo")} />
            <AssetUpload label={t("Cover image")} preview={productQuery.data?.coverUrl ?? null} onChange={(event) => void handleUpload(event, "cover")} />
          </div>
          {screenshots.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-2">{screenshots.map((screenshot, index) => <div key={screenshot.id} className="hq-shot">
            <img src={screenshot.url} alt={screenshot.alt || t("Product screenshot")} />
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="hq-faint text-[12px]">{t("Screenshot {number}", { number: index + 1 })}</span>
              <div className="flex gap-1">
                <Button size="sm" iconOnly icon={ArrowUp} disabled={index === 0} onClick={() => moveScreenshot(index, -1)} aria-label={t("Move up")} />
                <Button size="sm" iconOnly icon={ArrowDown} disabled={index === screenshots.length - 1} onClick={() => moveScreenshot(index, 1)} aria-label={t("Move down")} />
                <Button size="sm" iconOnly variant="danger" icon={Trash2} onClick={() => requestScreenshotDelete(screenshot.id)} aria-label={t("Hapus Screenshot")} />
              </div>
            </div>
          </div>)}</div>}
        </div>
      </Card>}</TabsContent>

      <div className="hq-savebar">
        <span className="hq-faint hidden text-[12px] sm:inline">{isNew ? t("New product") : t("Editing: {name}", { name: form.name || t("Product") })}</span>
        <Link href={CMS_ROUTES.products} className={btn("ghost", "md", "ml-auto")}>{t("Cancel")}</Link>
        <Button variant="primary" disabled={busy} onClick={save}>{busy ? <Loader2 className="hq-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}{isNew ? t("Create product") : t("Save product")}</Button>
      </div>
    </Tabs>}

    <ConfirmModal
      open={confirmModal.open}
      onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
      title={confirmModal.title}
      description={confirmModal.description}
      confirmLabel={confirmModal.confirmLabel}
      cancelLabel={t("Batal")}
      variant="danger"
      isPending={busy}
      onConfirm={confirmModal.onConfirm}
    />
  </>;
}

function Field({ label, children, error, required = false }: { label: string; children: React.ReactNode; error?: string; required?: boolean }) {
  const t = useT();
  return <label className="hq-field"><span className="hq-label">{label}{required && <span className="hq-req" aria-hidden="true">*</span>}</span>{children}{error && <span className="hq-error"><OctagonAlert aria-hidden="true" />{translateMessage(t, error)}</span>}</label>;
}

function AssetUpload({ label, preview, onChange }: { label: string; preview: string | null; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  const t = useT();
  return <div className="hq-asset"><span className="hq-label">{label}</span>{preview ? <img src={preview} alt={label} /> : <p className="hq-hint">{t("No file has been uploaded.")}</p>}<label className={btn("default", "sm")}><UploadCloud aria-hidden="true" /> {t("Upload image")}<input type="file" accept="image/*" onChange={onChange} /></label></div>;
}
