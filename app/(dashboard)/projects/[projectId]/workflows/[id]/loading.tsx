import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function WorkflowLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-9 w-96 mb-2" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-6 lg:overflow-x-auto lg:pb-6 space-y-4 lg:space-y-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full lg:flex-shrink-0 lg:w-80">
              <Card className="bg-white rounded-lg shadow-sm border">
                <div className="p-3 sm:p-4 border-b">
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="p-2 space-y-3">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <Skeleton key={j} className="h-32" />
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
