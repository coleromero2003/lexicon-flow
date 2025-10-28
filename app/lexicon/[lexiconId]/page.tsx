"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";
import { BookOpen, Calendar, ClipboardList, Layers, Link2 } from "lucide-react";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { lexiconService, objectService } from "@/lib/services";
import type { LexiconItem, ScadaObject } from "@/lib/supabase/models";

const typeLabelMap: Record<LexiconItem["type"], string> = {
  part: "Part",
  workflow_template: "Workflow Template",
  step_template: "Step Template",
  document: "Document",
  spec: "Specification",
  client: "Client",
};

export default function LexiconItemPage() {
  const params = useParams<{ lexiconId: string }>();
  const router = useRouter();
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();
  const { supabase } = useSupabase();

  const lexiconId = Number(params.lexiconId);

  const [item, setItem] = useState<LexiconItem | null>(null);
  const [linkedObjects, setLinkedObjects] = useState<ScadaObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isSignedIn, userLoaded, router]);

  useEffect(() => {
    if (!supabase || !organization) {
      return;
    }

    if (Number.isNaN(lexiconId)) {
      setError("Invalid lexicon item identifier");
      setLoading(false);
      return;
    }

    const supabaseClient = supabase;

    let isMounted = true;

    async function loadLexiconItem() {
      try {
        setLoading(true);
        setError(null);

        const [lexiconItem, objects] = await Promise.all([
          lexiconService.getLexiconItem(supabaseClient, lexiconId),
          objectService.getObjectsByLexicon(supabaseClient, lexiconId),
        ]);

        if (!isMounted) return;

        setItem(lexiconItem);
        setLinkedObjects(objects);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load lexicon item.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLexiconItem();

    return () => {
      isMounted = false;
    };
  }, [supabase, organization, lexiconId]);

  const attributeEntries = useMemo(() => {
    if (!item) return [] as Array<[string, unknown]>;
    return Object.entries(item.attributes || {});
  }, [item]);

  if (!userLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner label="Loading your account..." />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              No Organization Selected
            </h2>
            <p className="text-gray-600">
              Please select or create an organization to view lexicon items.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-64" />
        </main>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <CardTitle>Unable to load lexicon item</CardTitle>
              <CardDescription>{error ?? "We could not find the requested item."}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/lexicon">Back to lexicon</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const formattedCreated = new Date(item.created_at).toLocaleString();
  const formattedUpdated = new Date(item.updated_at).toLocaleString();
  const typeLabel = typeLabelMap[item.type];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/lexicon">Lexicon</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{item.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {item.name}
            </h1>
            <p className="mt-1 text-gray-600">
              Reusable {typeLabel.toLowerCase()} for {organization.name}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{typeLabel}</Badge>
              {item.sku && <Badge variant="outline">SKU: {item.sku}</Badge>}
              {item.manufacturer && (
                <Badge variant="outline">{item.manufacturer}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/lexicon">Back to Lexicon</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General information</CardTitle>
                <CardDescription>
                  Key metadata for this lexicon entry.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoTile
                    icon={<Layers className="h-4 w-4" />}
                    label="Type"
                    value={typeLabel}
                  />
                  <InfoTile
                    icon={<ClipboardList className="h-4 w-4" />}
                    label="Version"
                    value={`v${item.version}`}
                  />
                  <InfoTile
                    icon={<Calendar className="h-4 w-4" />}
                    label="Created"
                    value={formattedCreated}
                  />
                  <InfoTile
                    icon={<Calendar className="h-4 w-4" />}
                    label="Last updated"
                    value={formattedUpdated}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attributes &amp; notes</CardTitle>
                <CardDescription>
                  Structured metadata stored with this item.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attributeEntries.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-8 w-8" />}
                    title="No additional attributes"
                    description="Add notes or structured data to capture specifications for this item."
                  />
                ) : (
                  <div className="grid gap-4">
                    {attributeEntries.map(([key, value]) => (
                      <AttributeTile key={key} name={key} value={value} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Associated objects</CardTitle>
                <CardDescription>
                  Objects that reference this lexicon item.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linkedObjects.length === 0 ? (
                  <EmptyState
                    icon={<Link2 className="h-8 w-8" />}
                    title="No linked objects"
                    description="Objects that reference this item will appear here."
                  />
                ) : (
                  <div className="space-y-4">
                    {linkedObjects.map((object) => (
                      <div
                        key={object.id}
                        className="rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              {object.title}
                            </h3>
                            {object.description_md && (
                              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                {object.description_md}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">
                              Project #{object.project_id}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/projects/${object.project_id}/objects/${object.id}`}
                            >
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="rounded-md bg-blue-50 p-2 text-blue-600">{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function AttributeTile({
  name,
  value,
}: {
  name: string;
  value: unknown;
}) {
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) {
      return "—";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value.toString();
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      console.error("Failed to stringify attribute", err);
      return String(value);
    }
  }, [value]);

  const displayName = useMemo(() => name.replace(/_/g, " "), [name]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-gray-500">
        {displayName}
      </p>
      {typeof formattedValue === "string" && formattedValue.includes("\n") ? (
        <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
          {formattedValue}
        </pre>
      ) : (
        <p className="mt-2 text-sm text-gray-900">{formattedValue}</p>
      )}
    </div>
  );
}

