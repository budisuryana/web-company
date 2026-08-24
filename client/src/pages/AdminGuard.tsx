/** CMS access guard: only the project owner/admin may reach the management views, while the public website stays open. */
import type { ReactNode } from "react";
import { Link } from "wouter";
import { ShieldAlert } from "lucide-react";
import { startLogin } from "@/const";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f6f0e6] text-sm font-bold text-[#102239]">Loading CMS…</div>;
  if (!user) return <div className="grid min-h-screen place-items-center bg-[#f6f0e6] p-6"><div className="max-w-sm text-center"><span className="mb-4 inline-flex rounded-full bg-[#f05a43] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#102239]">Workshop CMS</span><h1 className="font-[DM_Serif_Display] text-5xl leading-none text-[#102239]">Sign in to manage the product registry.</h1><button type="button" onClick={() => startLogin()} className="mt-7 bg-[#102239] px-5 py-3 text-sm font-extrabold text-white">Sign in</button></div></div>;
  if (user.role !== "admin") return <div className="grid min-h-screen place-items-center bg-[#f6f0e6] p-6"><div className="max-w-sm text-center"><ShieldAlert className="mx-auto mb-5 h-9 w-9 text-[#f05a43]" /><h1 className="font-[DM_Serif_Display] text-5xl leading-none text-[#102239]">This workspace is reserved for admins.</h1><p className="mt-4 text-sm leading-6 text-slate-600">Ask the project owner to grant your account administrator access before changing the public registry.</p><Link href="/" className="mt-7 inline-flex bg-[#102239] px-5 py-3 text-sm font-extrabold text-white">Return to website</Link></div></div>;
  return <DashboardLayout>{children}</DashboardLayout>;
}
