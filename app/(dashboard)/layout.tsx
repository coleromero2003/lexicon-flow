import { DashboardLayoutClient } from "./layout-client";

// Server Component layout for dashboard
// Suspense boundaries are handled at the root level (app/layout.tsx)
// and individual route levels (loading.tsx files)
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
