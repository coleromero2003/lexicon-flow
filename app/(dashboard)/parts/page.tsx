"use client";

import { Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PartsTable } from "@/components/parts-table";
import { useParts } from "@/lib/hooks/useParts";
import { PageContainer } from "@/components/ui/page-container";
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
import { PageErrorState } from "@/components/ui/page-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export default function PartsPage() {
  const { parts, loading, error } = useParts();

  if (loading) {
    return <PageLoadingSkeleton statsCount={5} />;
  }

  if (error) {
    return <PageErrorState message={error} />;
  }

  // Calculate stats
  const totalParts = parts.length;
  const totalQuantity = parts.reduce((sum, part) => sum + part.quantity, 0);
  const orderedParts = parts.filter(p => p.ordered).length;
  const receivedParts = parts.filter(p => p.received).length;
  const deliveredParts = parts.filter(p => p.delivered).length;

  return (
    <PageContainer>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-600" />
            <span>Parts</span>
          </div>
        }
        description="Manage all parts across all projects in your organization."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total Parts"
          value={totalParts}
          variant="compact"
        />
        <StatCard
          label="Total Quantity"
          value={totalQuantity}
          variant="compact"
        />
        <StatCard
          label="Ordered"
          value={orderedParts}
          variant="compact"
        />
        <StatCard
          label="Received"
          value={receivedParts}
          variant="compact"
        />
        <StatCard
          label="Delivered"
          value={deliveredParts}
          variant="compact"
        />
      </div>

        {/* Parts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Parts</CardTitle>
            <CardDescription>
              View and manage parts across all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PartsTable showProjectColumn={true} showObjectColumn={true} />
          </CardContent>
        </Card>
    </PageContainer>
  );
}
