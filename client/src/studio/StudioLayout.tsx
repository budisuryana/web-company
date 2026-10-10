/**
 * The single CMS layout route: appearance, the access gate and the shell mount once for every
 * /studio screen, so navigating between CMS pages swaps only the page — the sidebar, top bar and
 * their state stay put. Access rules are AdminGuard's, unchanged.
 */
import type { ReactNode } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AdminGuard from "@/pages/AdminGuard";
import { StudioThemeProvider } from "./theme";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <StudioThemeProvider>
      <AdminGuard>
        <DashboardLayout>{children}</DashboardLayout>
      </AdminGuard>
    </StudioThemeProvider>
  );
}
