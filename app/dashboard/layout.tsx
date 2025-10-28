"use client";

import { useMemo, type ReactNode } from "react";
import { useOrganization } from "@clerk/nextjs";

import { PlanProvider } from "@/lib/contexts/PlanContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { organization } = useOrganization();

  const { hasProPlan, hasEnterprisePlan } = useMemo(() => {
    const metadata = organization?.publicMetadata as
      | Record<string, unknown>
      | undefined;
    const planValue = metadata?.plan;
    const plan = typeof planValue === "string" ? planValue.toLowerCase() : "";

    const hasPro = plan === "pro_user" || plan === "enterprise_user";
    const hasEnterprise = plan === "enterprise_user";

    return {
      hasProPlan: hasPro,
      hasEnterprisePlan: hasEnterprise,
    };
  }, [organization]);

  return (
    <PlanProvider hasProPlan={hasProPlan} hasEnterprisePlan={hasEnterprisePlan}>
      {children}
    </PlanProvider>
  );
}
