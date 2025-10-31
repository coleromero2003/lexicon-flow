import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ObjectLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Skeleton className="h-8 w-32 mb-4" />

        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-10 w-96 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-44" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
