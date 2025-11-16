"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganization } from "@clerk/nextjs";
import { SupabaseClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { objectService, projectService } from "@/lib/services";
import { trackScadaOperation } from "@/lib/sentry";
import { Project, ScadaObject, ObjectPriority } from "@/lib/supabase/models";
import {
  ListTree,
  Plus,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { PageContainer } from "@/components/ui/page-container";
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
import { PageErrorState } from "@/components/ui/page-error-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { sanitizePlainText } from "@/lib/utils/validation";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;

export default function ObjectsClientPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectIdNum = Number(projectId);
  const { isSignedIn, userLoaded } = useAuthRedirect();
  const { organization } = useOrganization();
  const { supabase } = useSupabase();

  const [project, setProject] = useState<Project | null>(null);
  const [objects, setObjects] = useState<ScadaObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingObject, setIsCreatingObject] = useState(false);
  const [isSubmittingObject, setIsSubmittingObject] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

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

  const handleCreateObject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return;

    const formData = new FormData(e.currentTarget);
    const rawTitle = (formData.get("title") as string) || "";
    const rawDescription = (formData.get("description") as string) || "";
    const priority = (formData.get("priority") as ObjectPriority) || "medium";

    // Sanitize inputs
    const title = sanitizePlainText(rawTitle);
    const description = sanitizePlainText(rawDescription);

    // Validate inputs
    if (!title) {
      toast.error("Title is required");
      return;
    }

    if (title.length > MAX_TITLE_LENGTH) {
      toast.error(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
      return;
    }

    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      toast.error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`);
      return;
    }

    setIsSubmittingObject(true);
    try {
      const newObject = await objectService.createObject(supabase, {
        project_id: projectIdNum,
        title,
        description_md: description || null,
        priority,
        workflow_id: null,
        step_id: null,
        assignee: [],
        due_date: null,
        sort_order: objects.length,
        metadata: null,
      });

      // Track successful creation
      trackScadaOperation(
        "object_create",
        projectIdNum.toString(),
        true,
        { objectId: newObject.id }
      );

      setObjects((prev) => [...prev, newObject]);
      toast.success("Object created successfully");

      // Explicitly reset the form
      formRef.current?.reset();

      setIsCreatingObject(false);
    } catch (err) {
      console.error("Failed to create object:", err);

      // Track failed creation
      trackScadaOperation(
        "object_create",
        projectIdNum.toString(),
        false,
        { error: err instanceof Error ? err.message : "Unknown error" }
      );

      // Show actual error message to user
      const errorMessage = err instanceof Error ? err.message : "Failed to create object";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingObject(false);
    }
  };

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
    return <PageLoadingSkeleton statsCount={3} />;
  }

  if (!organization) {
    return <NoOrganizationState />;
  }

  if (error || !project) {
    return (
      <PageErrorState
        title={error ? "Error loading objects" : "Project not found"}
        message={error || "We couldn't find the requested project."}
        onRetry={() => router.push("/dashboard")}
        retryLabel="Back to Dashboard"
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Objects for ${project.name}`}
        description="Manage SCADA objects and their relationships."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm" onClick={() => setIsCreatingObject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Object
            </Button>
          </>
        }
      />

      {/* Search Bar */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search objects..."
        className="mb-6"
      />

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
                  <Button onClick={() => setIsCreatingObject(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Object
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Create Object Dialog */}
      <Dialog open={isCreatingObject} onOpenChange={setIsCreatingObject}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Object</DialogTitle>
            <p className="text-sm text-gray-600">
              Add a new SCADA object to this project
            </p>
          </DialogHeader>
          <form ref={formRef} className="space-y-4" onSubmit={handleCreateObject}>
            <div className="space-y-2">
              <Label htmlFor="object-title">Title *</Label>
              <Input
                id="object-title"
                name="title"
                placeholder="Enter object title"
                required
                disabled={isSubmittingObject}
                maxLength={MAX_TITLE_LENGTH}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="object-description">Description</Label>
              <Textarea
                id="object-description"
                name="description"
                placeholder="Enter object description"
                rows={3}
                disabled={isSubmittingObject}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="object-priority">Priority</Label>
              <Select name="priority" defaultValue="medium" disabled={isSubmittingObject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatingObject(false)}
                disabled={isSubmittingObject}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingObject}>
                {isSubmittingObject ? "Creating..." : "Create Object"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
