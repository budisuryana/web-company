/** Product Registry editor: validates required product content locally before the protected CMS mutation runs. */
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ImagePlus, Loader2, Save, Trash2, UploadCloud } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import AdminGuard from "@/pages/AdminGuard";
import { trpc } from "@/lib/trpc";
import { validateProductForm } from "@/lib/productValidation";
import { toast } from "sonner";

type EditorForm = {
  name: string; slug: string; shortDescription: string; fullDescription: string; heroHeadline: string; problem: string; solution: string; outcome: string; category: string;
  productStatus: "active" | "planned" | "retired"; publicationStatus: "draft" | "published"; capabilitiesText: string; targetUsers: string; demoUrl: string; workflowText: string;
  featured: boolean; displayOrder: number; logoUrl: string | null; logoKey: string | null; coverUrl: string | null; coverKey: string | null;
};

const blankForm: EditorForm = { name: "", slug: "", shortDescription: "", fullDescription: "", heroHeadline: "", problem: "", solution: "", outcome: "", category: "", productStatus: "active", publicationStatus: "draft", capabilitiesText: "", targetUsers: "", demoUrl: "", workflowText: "", featured: false, displayOrder: 99, logoUrl: null, logoKey: null, coverUrl: null, coverKey: null };

function toForm(product: any): EditorForm {
  return { name: product.name, slug: product.slug, shortDescription: product.shortDescription, fullDescription: product.fullDescription, heroHeadline: product.heroHeadline, problem: product.problem, solution: product.solution, outcome: product.outcome, category: product.category, productStatus: product.productStatus, publicationStatus: product.publicationStatus, capabilitiesText: product.capabilities.join("\n"), targetUsers: product.targetUsers, demoUrl: product.demoUrl ?? "", workflowText: product.workflowSteps.map((step: { title: string; copy: string }) => `${step.title} | ${step.copy}`).join("\n"), featured: product.featured, displayOrder: product.displayOrder, logoUrl: product.logoUrl, logoKey: product.logoKey, coverUrl: product.coverUrl, coverKey: product.coverKey };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("File could not be read.")); reader.readAsDataURL(file); });
}

export default function AdminProductEditor() {
  const [, params] = useRoute("/admin/products/:id");
  const [, navigate] = useLocation();
  const id = params?.id ?? "new";
  const isNew = id === "new";
  const productQuery = trpc.registry.admin.byId.useQuery({ id }, { enabled: !isNew });
  const utils = trpc.useUtils();
  const [form, setForm] = useState<EditorForm>(blankForm);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof EditorForm, string>>>({});

  useEffect(() => { if (productQuery.data) setForm(toForm(productQuery.data)); }, [productQuery.data]);

  const create = trpc.registry.admin.create.useMutation({
    onSuccess: (product) => { toast.success("Product created as a registry record."); void utils.registry.admin.list.invalidate(); if (product) navigate(`/admin/products/${product.id}`); },
    onError: () => toast.error("Product could not be saved. Check the required fields and try again."),
  });
  const update = trpc.registry.admin.update.useMutation({
    onSuccess: () => { toast.success("Product changes saved."); void utils.registry.admin.list.invalidate(); void productQuery.refetch(); },
    onError: () => toast.error("Product could not be saved. Check the required fields and try again."),
  });
  const remove = trpc.registry.admin.remove.useMutation({
    onSuccess: () => { toast.success("Product deleted."); void utils.registry.admin.list.invalidate(); navigate("/admin/products"); },
    onError: (error) => toast.error(error.message),
  });
  const upload = trpc.registry.media.upload.useMutation({ onSuccess: () => { toast.success("Image uploaded."); void productQuery.refetch(); void utils.registry.admin.list.invalidate(); }, onError: (error) => toast.error(error.message) });
  const deleteScreenshot = trpc.registry.media.removeScreenshot.useMutation({ onSuccess: () => { toast.success("Screenshot removed."); void productQuery.refetch(); }, onError: (error) => toast.error(error.message) });
  const reorderScreenshots = trpc.registry.media.reorderScreenshots.useMutation({ onSuccess: () => void productQuery.refetch(), onError: (error) => toast.error(error.message) });
  const busy = create.isPending || update.isPending || upload.isPending;

  const payload = useMemo(() => ({
    name: form.name.trim(), slug: form.slug.trim(), shortDescription: form.shortDescription.trim(), fullDescription: form.fullDescription.trim(), heroHeadline: form.heroHeadline.trim(), problem: form.problem.trim(), solution: form.solution.trim(), outcome: form.outcome.trim(), category: form.category.trim(), productStatus: form.productStatus, publicationStatus: form.publicationStatus, logoUrl: form.logoUrl, logoKey: form.logoKey, coverUrl: form.coverUrl, coverKey: form.coverKey,
    capabilities: form.capabilitiesText.split("\n").map((item) => item.trim()).filter(Boolean), targetUsers: form.targetUsers.trim(), demoUrl: form.demoUrl.trim(), workflowSteps: form.workflowText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => { const [title, ...copy] = line.split("|"); return { title: title.trim(), copy: copy.join("|").trim() || "Add a short explanation." }; }), featured: form.featured, displayOrder: Number(form.displayOrder) || 0,
  }), [form]);

  const setField = <K extends keyof EditorForm>(field: K, value: EditorForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; });
  };
  const save = () => {
    const errors = validateProductForm(form);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) { toast.error("Complete the highlighted required fields before saving."); return; }
    if (isNew) create.mutate(payload); else update.mutate({ id, product: payload });
  };
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, assetType: "logo" | "cover" | "screenshot") => {
    const file = event.target.files?.[0];
    if (!file || isNew) return;
    try { const dataUrl = await fileToDataUrl(file); upload.mutate({ productId: id, assetType, fileName: file.name, contentType: file.type, dataUrl, alt: `${form.name} ${assetType}` }); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed."); }
    finally { event.target.value = ""; }
  };
  const screenshots = productQuery.data?.screenshots ?? [];
  const moveScreenshot = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= screenshots.length) return; const next = [...screenshots]; [next[index], next[target]] = [next[target], next[index]]; reorderScreenshots.mutate({ productId: id, ids: next.map((screenshot) => screenshot.id) }); };

  return <AdminGuard><div className="mx-auto max-w-5xl"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><Link href="/admin/products" className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500"><ArrowLeft size={14} /> Product Registry</Link><span className="mt-5 block text-[10px] font-extrabold uppercase tracking-[.16em] text-[#f05a43]">{isNew ? "New product" : `Editing ${form.name || "product"}`}</span><h1 className="mt-2 font-[DM_Serif_Display] text-5xl leading-none tracking-tight text-[#102239]">{isNew ? "Add a useful product." : "Shape the public record."}</h1></div>{!isNew && <button disabled={remove.isPending} type="button" onClick={() => { if (window.confirm(`Delete ${form.name}? This cannot be undone.`)) remove.mutate({ id }); }} className="inline-flex items-center gap-2 border border-red-300 px-3 py-2 text-xs font-extrabold text-red-700"><Trash2 size={14} /> Delete product</button>}</div>
    {Object.keys(validationErrors).length > 0 && <div role="alert" className="mb-6 border-l-4 border-[#f05a43] bg-[#fff0e9] px-4 py-3 text-sm text-[#8b2c20]"><b className="font-extrabold">Before saving:</b> complete the required fields highlighted below. Nothing has been sent to the server yet.</div>}
    {!isNew && productQuery.isLoading ? <div className="flex items-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading product…</div> : <div className="space-y-6"><section className="border-t-2 border-[#102239] bg-white p-6 shadow-sm"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-[DM_Serif_Display] text-3xl text-[#102239]">Identity & visibility</h2><p className="mt-1 text-xs text-slate-500">The product’s public name, URL, state, and placement.</p></div><label className="flex items-center gap-2 text-xs font-extrabold text-[#102239]"><input type="checkbox" checked={form.featured} onChange={(event) => setField("featured", event.target.checked)} /> Featured product</label></div><div className="grid gap-5 md:grid-cols-2"><Field required label="Product name" error={validationErrors.name}><input aria-invalid={Boolean(validationErrors.name)} value={form.name} onChange={(event) => { setField("name", event.target.value); if (isNew) setField("slug", event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} placeholder="e.g. Operations Hub" /></Field><Field required label="Slug" error={validationErrors.slug}><input aria-invalid={Boolean(validationErrors.slug)} value={form.slug} onChange={(event) => setField("slug", event.target.value.toLowerCase())} placeholder="operations-hub" /></Field><Field required label="Product category" error={validationErrors.category}><input aria-invalid={Boolean(validationErrors.category)} value={form.category} onChange={(event) => setField("category", event.target.value)} placeholder="Work management" /></Field><Field label="Display order"><input type="number" min="0" value={form.displayOrder} onChange={(event) => setField("displayOrder", Number(event.target.value))} /></Field><Field label="Product status"><select value={form.productStatus} onChange={(event) => setField("productStatus", event.target.value as EditorForm["productStatus"])}><option value="active">Active</option><option value="planned">Planned</option><option value="retired">Retired</option></select></Field><Field label="Public visibility"><select value={form.publicationStatus} onChange={(event) => setField("publicationStatus", event.target.value as EditorForm["publicationStatus"])}><option value="draft">Draft — private</option><option value="published">Published — public</option></select></Field></div></section>
      <section className="border border-slate-900/15 bg-white p-6 shadow-sm"><h2 className="font-[DM_Serif_Display] text-3xl text-[#102239]">Story & positioning</h2><p className="mt-1 text-xs text-slate-500">This copy appears in the portfolio and the product detail narrative.</p><div className="mt-6 grid gap-5"><Field required label="Short description" error={validationErrors.shortDescription}><textarea aria-invalid={Boolean(validationErrors.shortDescription)} rows={2} value={form.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} /></Field><Field required label="Full description" error={validationErrors.fullDescription}><textarea aria-invalid={Boolean(validationErrors.fullDescription)} rows={3} value={form.fullDescription} onChange={(event) => setField("fullDescription", event.target.value)} /></Field><Field required label="Hero headline" error={validationErrors.heroHeadline}><textarea aria-invalid={Boolean(validationErrors.heroHeadline)} rows={2} value={form.heroHeadline} onChange={(event) => setField("heroHeadline", event.target.value)} /></Field><div className="grid gap-5 md:grid-cols-2"><Field required label="Problem" error={validationErrors.problem}><textarea aria-invalid={Boolean(validationErrors.problem)} rows={5} value={form.problem} onChange={(event) => setField("problem", event.target.value)} /></Field><Field required label="Solution" error={validationErrors.solution}><textarea aria-invalid={Boolean(validationErrors.solution)} rows={5} value={form.solution} onChange={(event) => setField("solution", event.target.value)} /></Field></div><Field required label="Outcome" error={validationErrors.outcome}><textarea aria-invalid={Boolean(validationErrors.outcome)} rows={2} value={form.outcome} onChange={(event) => setField("outcome", event.target.value)} /></Field></div></section>
      <section className="border border-slate-900/15 bg-white p-6 shadow-sm"><h2 className="font-[DM_Serif_Display] text-3xl text-[#102239]">Capabilities & audience</h2><div className="mt-6 grid gap-5 md:grid-cols-2"><Field required label="Key capabilities — one per line" error={validationErrors.capabilitiesText}><textarea aria-invalid={Boolean(validationErrors.capabilitiesText)} rows={7} value={form.capabilitiesText} onChange={(event) => setField("capabilitiesText", event.target.value)} placeholder={"Reusable templates\nStructured fields"} /></Field><Field required label="Who it is for" error={validationErrors.targetUsers}><textarea aria-invalid={Boolean(validationErrors.targetUsers)} rows={7} value={form.targetUsers} onChange={(event) => setField("targetUsers", event.target.value)} /></Field></div><Field label="Demo or product URL" error={validationErrors.demoUrl}><input aria-invalid={Boolean(validationErrors.demoUrl)} value={form.demoUrl} onChange={(event) => setField("demoUrl", event.target.value)} placeholder="https://…" /></Field><Field required label="How it works — one step per line: Title | Explanation" error={validationErrors.workflowText}><textarea aria-invalid={Boolean(validationErrors.workflowText)} rows={7} value={form.workflowText} onChange={(event) => setField("workflowText", event.target.value)} placeholder={"Plan | Set the direction.\nBuild | Move the work forward."} /></Field></section>
      {!isNew && <section className="border border-slate-900/15 bg-white p-6 shadow-sm"><h2 className="font-[DM_Serif_Display] text-3xl text-[#102239]">Visual assets</h2><p className="mt-1 text-xs text-slate-500">Files are stored securely and their ordered references are owned by this product record.</p><div className="mt-6 grid gap-5 md:grid-cols-2"><AssetUpload label="Product logo" preview={productQuery.data?.logoUrl ?? null} onChange={(event) => void handleUpload(event, "logo")} /><AssetUpload label="Cover image" preview={productQuery.data?.coverUrl ?? null} onChange={(event) => void handleUpload(event, "cover")} /></div><div className="mt-6"><label className="inline-flex cursor-pointer items-center gap-2 bg-[#e8efe5] px-4 py-3 text-xs font-extrabold text-[#102239]"><ImagePlus size={15} /> Add screenshot<input className="hidden" type="file" accept="image/*" onChange={(event) => void handleUpload(event, "screenshot")} /></label><div className="mt-4 grid gap-3 md:grid-cols-2">{screenshots.map((screenshot, index) => <div key={screenshot.id} className="overflow-hidden border border-slate-900/15 bg-[#f8f5ef]"><img src={screenshot.url} alt={screenshot.alt || "Product screenshot"} className="h-40 w-full object-cover" /><div className="flex items-center justify-between gap-2 p-3"><span className="text-xs font-bold text-slate-500">Screenshot {index + 1}</span><div className="flex gap-1"><button disabled={index === 0} type="button" onClick={() => moveScreenshot(index, -1)} className="grid h-7 w-7 place-items-center border border-slate-900/15 disabled:opacity-30"><ArrowUp size={13} /></button><button disabled={index === screenshots.length - 1} type="button" onClick={() => moveScreenshot(index, 1)} className="grid h-7 w-7 place-items-center border border-slate-900/15 disabled:opacity-30"><ArrowDown size={13} /></button><button type="button" onClick={() => { if (window.confirm("Remove this screenshot?")) deleteScreenshot.mutate({ id: screenshot.id }); }} className="grid h-7 w-7 place-items-center border border-red-200 text-red-700"><Trash2 size={13} /></button></div></div></div>)}</div></div></section>}
      <div className="mt-2 flex justify-end gap-3 border border-slate-900/15 bg-[#f6f0e6] p-3"><Link href="/admin/products" className="px-4 py-3 text-xs font-extrabold text-[#102239]">Cancel</Link><button disabled={busy} type="button" onClick={save} className="inline-flex items-center gap-2 bg-[#102239] px-5 py-3 text-xs font-extrabold text-white disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={15} />}{isNew ? "Create product" : "Save product"}</button></div>
    </div>}</div></AdminGuard>;
}

function Field({ label, children, error, required = false }: { label: string; children: React.ReactNode; error?: string; required?: boolean }) {
  return <label className="block text-xs font-extrabold text-[#102239]"><span className="mb-2 block">{label}{required && <span className="ml-1 text-[#d24634]" aria-hidden="true">*</span>}</span><div className={`${error ? "[&_input]:border-[#d24634] [&_textarea]:border-[#d24634]" : ""} [&_input]:w-full [&_input]:border [&_input]:border-slate-900/20 [&_input]:bg-[#fffdf8] [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_select]:w-full [&_select]:border [&_select]:border-slate-900/20 [&_select]:bg-[#fffdf8] [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:border [&_textarea]:border-slate-900/20 [&_textarea]:bg-[#fffdf8] [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-sm`}>{children}</div>{error && <p className="mt-1.5 text-xs font-semibold text-[#b63b2b]">{error}</p>}</label>;
}

function AssetUpload({ label, preview, onChange }: { label: string; preview: string | null; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <div className="border border-dashed border-slate-900/25 bg-[#f8f5ef] p-4"><span className="text-xs font-extrabold text-[#102239]">{label}</span>{preview ? <img src={preview} alt={label} className="mt-3 h-36 w-full object-cover" /> : <p className="mt-2 text-xs leading-5 text-slate-500">No file has been uploaded.</p>}<label className="mt-3 inline-flex cursor-pointer items-center gap-2 border border-[#102239] px-3 py-2 text-xs font-extrabold text-[#102239]"><UploadCloud size={14} /> Upload image<input className="hidden" type="file" accept="image/*" onChange={onChange} /></label></div>;
}
