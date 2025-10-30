"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganization, useUser } from "@clerk/nextjs";
import { SupabaseClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NoOrganizationState } from "@/components/ui/no-organization-state";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { objectService, projectService } from "@/lib/services";
import { Project, ScadaObject } from "@/lib/supabase/models";
import {
  ListTree,
  Search,
  Plus,
  Filter,
} from "lucide-react";

export default function ObjectsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectIdNum = Number(projectId);
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();
  const { supabase } = useSupabase();

  const [project, setProject] = useState<Project | null>(null);
  const [objects, setObjects] = useState<ScadaObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (userLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isSignedIn, userLoaded, router]);

  useEffect(() => {
    if (!supabase || !organization || Number.isNaN(projectIdNum)) {
      return;
    }

    let isMounted = true;

    async function loadData(client: SupabaseClient) {
      try {
        setLoading(true);
        setError(null);

        const [projectData, objectData] = await Promise.all([
          projectService.getProjectById(client, projectIdNum),
          objectService.getObjectsByProject(client, projectIdNum),
        ]);

        if (!isMounted) return;

        setProject(projectData);
        setObjects(objectData);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load objects.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData(supabase);

    return () => {
      isMounted = false;
    };
  }, [supabase, organization, projectIdNum]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredObjects = useMemo(() => {
    if (!normalizedQuery) {
      return objects;
    }
    return objects.filter((obj) =>
      `${obj.title} ${obj.description_md ?? ""}`.toLowerCase().includes(normalizedQuery)
    );
  }, [objects, normalizedQuery]);

  const hasSearch = normalizedQuery.length > 0;

  if (!userLoaded || !isSignedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64" />
        </main>
      </div>
    );
  }

  if (!organization) {
    return <NoOrganizationState />;
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error ? "Error loading objects" : "Project not found"}
            </h2>
            <p className="text-gray-600">{error || "We couldn't find the requested project."}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Objects for {project.name}
              </h1>
              <p className="text-gray-600">
                Manage SCADA objects and their relationships.
              </p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Object
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search objects..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Objects</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {filteredObjects.length}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Urgent</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {filteredObjects.filter((o) => o.priority === "urgent").length}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {filteredObjects.filter((o) => o.priority === "high").length}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Medium Priority</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {filteredObjects.filter((o) => o.priority === "medium").length}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Objects List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ListTree className="h-5 w-5 text-emerald-500" /> SCADA Objects
            </CardTitle>
            <CardDescription>
              All objects in this project. Click on an object to view details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredObjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredObjects.map((object) => (
                  <Link
                    key={object.id}
                    href={`/projects/${projectId}/objects/${object.id}`}
                    className="block rounded-lg border bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">{object.title}</h3>
                        {object.description_md && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-3">
                            {object.description_md}
                          </p>
                        )}
                        <div className="mt-2">
                          <PriorityBadge priority={object.priority} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Updated {new Date(object.updated_at).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListTree className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {hasSearch ? "No objects match your search" : "No objects yet"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {hasSearch
                    ? "Try a different keyword to find objects."
                    : "Create your first SCADA object to get started."}
                </p>
                {!hasSearch && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Object
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
