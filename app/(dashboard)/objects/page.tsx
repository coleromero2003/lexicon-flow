"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganization } from "@clerk/nextjs";
import { SupabaseClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NoOrganizationState } from "@/components/ui/no-organization-state";
import { PriorityBadge } from "@/components/ui/priority-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { objectService, projectService } from "@/lib/services";
import { Project, ScadaObject, ObjectPriority } from "@/lib/supabase/models";
import {
  ListTree,
  Filter,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { PageContainer } from "@/components/ui/page-container";
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
import { PageErrorState } from "@/components/ui/page-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";

type ObjectWithProject = ScadaObject & {
  projects?: {
    id: number;
    name: string;
  };
};

export default function AllObjectsPage() {
  const router = useRouter();
  const { isSignedIn, userLoaded } = useAuthRedirect();
  const { organization } = useOrganization();
  const { supabase } = useSupabase();

  const [objects, setObjects] = useState<ObjectWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<ObjectPriority | "all">("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!supabase || !organization) {
      return;
    }

    let isMounted = true;

    async function loadData(client: SupabaseClient) {
      try {
        setLoading(true);
        setError(null);

        const [objectData, projectData] = await Promise.all([
          objectService.getObjectsByOrganization(client),
          projectService.getProjects(client),
        ]);

        if (!isMounted) return;

        setObjects(objectData as ObjectWithProject[]);
        setProjects(projectData);
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
  }, [supabase, organization]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredObjects = useMemo(() => {
    let filtered = objects;

    // Apply search filter
    if (normalizedQuery) {
      filtered = filtered.filter((obj) =>
        `${obj.title} ${obj.description_md ?? ""}`.toLowerCase().includes(normalizedQuery)
      );
    }

    // Apply priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter((obj) => obj.priority === filterPriority);
    }

    // Apply project filter
    if (filterProject !== "all") {
      filtered = filtered.filter((obj) => obj.project_id === Number(filterProject));
    }

    return filtered;
  }, [objects, normalizedQuery, filterPriority, filterProject]);

  const hasSearch = normalizedQuery.length > 0;
  const hasActiveFilters = filterPriority !== "all" || filterProject !== "all";

  const clearFilters = () => {
    setFilterPriority("all");
    setFilterProject("all");
    setSearchQuery("");
  };

  if (!userLoaded || !isSignedIn) {
    return null;
  }

  if (loading) {
    return <PageLoadingSkeleton statsCount={4} />;
  }

  if (!organization) {
    return <NoOrganizationState />;
  }

  if (error) {
    return (
      <PageErrorState
        title="Error loading objects"
        message={error}
        onRetry={() => router.push("/dashboard")}
        retryLabel="Back to Dashboard"
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="All Objects"
        description="View and manage all SCADA objects across your organization."
        actions={
          <>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </>
        }
      />

      {/* Search Bar */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search objects by title or description..."
        className="mb-4"
      />

          {/* Filters */}
          {showFilters && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Filters</CardTitle>
                <CardDescription>
                  Filter objects by priority and project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="filter-priority">Priority</Label>
                    <Select
                      value={filterPriority}
                      onValueChange={(value) => setFilterPriority(value as ObjectPriority | "all")}
                    >
                      <SelectTrigger id="filter-priority">
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-project">Project</Label>
                    <Select
                      value={filterProject}
                      onValueChange={setFilterProject}
                    >
                      <SelectTrigger id="filter-project">
                        <SelectValue placeholder="All projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
              <CardDescription className="text-2xl font-semibold text-red-600">
                {filteredObjects.filter((o) => o.priority === "urgent").length}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
              <CardDescription className="text-2xl font-semibold text-orange-600">
                {filteredObjects.filter((o) => o.priority === "high").length}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Projects</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {new Set(filteredObjects.map((o) => o.project_id)).size}
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
              All objects across your organization. Click on an object to view details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredObjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredObjects.map((object) => (
                  <Link
                    key={object.id}
                    href={`/projects/${object.project_id}/objects/${object.id}`}
                    className="block rounded-lg border bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900">{object.title}</h3>
                        </div>
                        {object.projects && (
                          <Badge variant="outline" className="mb-2 text-xs">
                            {object.projects.name}
                          </Badge>
                        )}
                        {object.description_md && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
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
                  {hasSearch || hasActiveFilters ? "No objects match your criteria" : "No objects yet"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {hasSearch || hasActiveFilters
                    ? "Try adjusting your search or filters to find objects."
                    : "Objects will appear here as they are created in projects."}
                </p>
                {(hasSearch || hasActiveFilters) && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
    </PageContainer>
  );
}
