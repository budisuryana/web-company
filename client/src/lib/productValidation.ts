/** Client-side mirror of the Product Registry’s required-input contract, used to keep invalid drafts from reaching tRPC. */
export type ProductFormValues = {
  name: string; slug: string; shortDescription: string; fullDescription: string; heroHeadline: string; problem: string; solution: string; outcome: string; category: string; capabilitiesText: string; targetUsers: string; demoUrl: string; workflowText: string;
};

const requiredFields: Array<[keyof ProductFormValues, string]> = [
  ["name", "Product name"], ["slug", "Slug"], ["category", "Product category"], ["shortDescription", "Short description"], ["fullDescription", "Full description"], ["heroHeadline", "Hero headline"], ["problem", "Problem"], ["solution", "Solution"], ["outcome", "Outcome"], ["targetUsers", "Target users"],
];

export function validateProductForm(form: ProductFormValues) {
  const errors: Partial<Record<keyof ProductFormValues, string>> = {};
  requiredFields.forEach(([field, label]) => { if (!form[field].trim()) errors[field] = `${label} is required.`; });
  if (form.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) errors.slug = "Use lowercase letters, numbers, and hyphens only.";
  if (!form.capabilitiesText.split("\n").some((item) => item.trim())) errors.capabilitiesText = "Add at least one key capability.";
  if (!form.workflowText.split("\n").some((item) => item.trim())) errors.workflowText = "Add at least one workflow step.";
  if (form.demoUrl.trim()) { try { new URL(form.demoUrl.trim()); } catch { errors.demoUrl = "Enter a valid URL, including https://."; } }
  return errors;
}
