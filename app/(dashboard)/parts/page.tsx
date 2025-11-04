"use client";

import { Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PartsTable } from "@/components/parts-table";
import { useParts } from "@/lib/hooks/useParts";

export default function PartsPage() {
  const { parts, loading, error } = useParts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center text-red-600">Error: {error}</div>
        </main>
      </div>
    );
  }

  // Calculate stats
  const totalParts = parts.length;
  const totalQuantity = parts.reduce((sum, part) => sum + part.quantity, 0);
  const orderedParts = parts.filter(p => p.ordered).length;
  const receivedParts = parts.filter(p => p.received).length;
  const deliveredParts = parts.filter(p => p.delivered).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Parts</h1>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Manage all parts across all projects in your organization.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Parts</CardDescription>
              <CardTitle className="text-3xl">{totalParts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Quantity</CardDescription>
              <CardTitle className="text-3xl">{totalQuantity}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Ordered</CardDescription>
              <CardTitle className="text-3xl">{orderedParts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Received</CardDescription>
              <CardTitle className="text-3xl">{receivedParts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Delivered</CardDescription>
              <CardTitle className="text-3xl">{deliveredParts}</CardTitle>
            </CardHeader>
          </Card>
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
      </main>
    </div>
  );
}
