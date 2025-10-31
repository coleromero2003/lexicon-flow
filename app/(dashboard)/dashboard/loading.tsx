import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pb-10 pt-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-40 mt-4 sm:mt-0" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-16" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-16" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-16" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-16" />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-10 w-full lg:max-w-md" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
