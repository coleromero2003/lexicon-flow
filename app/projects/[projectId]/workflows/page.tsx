"use client";

import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWorkflows } from "@/lib/hooks/useWorkflows";
import { projectService } from "@/lib/services";
import { Workflow } from "@/lib/supabase/models";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { useOrganization } from "@clerk/nextjs";
import {
  Filter,
  Grid3x3,
  List,
  Plus,
  Search,
  Share2,
  Workflow as WorkflowIcon,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function WorkflowsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectIdNum = parseInt(projectId, 10);
  const { organization } = useOrganization();
  const { supabase } = useSupabase();
  const { createWorkflow, workflows, error } = useWorkflows(projectIdNum);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>("");

  const [filters, setFilters] = useState({
    search: "",
  });

  useEffect(() => {
    async function loadProject() {
      if (projectIdNum && supabase) {
        try {
          const project = await projectService.getProjectById(
            supabase,
            projectIdNum
          );
          setProjectName(project.name);
        } catch (err) {
          console.error("Failed to load project:", err);
        }
      }
    }
    loadProject();
  }, [projectIdNum, supabase]);

  const filteredWorkflows = workflows.filter((workflow: Workflow) => {
    const matchesSearch = workflow.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  function clearFilters() {
    setFilters({
      search: "",
    });
  }

  const handleCreateWorkflow = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const color = formData.get("color") as string;

    if (name.trim()) {
      await createWorkflow({ name, description, color: color || "#3b82f6" });
      setIsCreatingWorkflow(false);
    }
  };

  if (error) {
    return (
      <div>
        <h2> Error loading workflows</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Organization Selected
            </h2>
            <p className="text-gray-600">
              Please select or create an organization to manage workflows.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 space-y-4">
          <Button
            variant="ghost"
            className="mb-0 w-fit"
            onClick={() => router.push("/projects")}
          >
            <ArrowLeft className="mr-2" />
            Back to Projects
          </Button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Workflows for {projectName} 🔄
              </h1>
              <p className="text-gray-600">
                Manage your workflows and their steps.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/projects/${projectId}/graph`}>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  System graph
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Workflows
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {workflows.length}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <WorkflowIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Recent Activity
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {
                      workflows.filter((workflow) => {
                        const updatedAt = new Date(workflow.updated_at);
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        return updatedAt > oneWeekAgo;
                      }).length
                    }
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  📊
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflows */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Workflows
              </h2>
              <p className="text-gray-600">Manage your workflow processes</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 rounded bg-white border p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
              >
                <Filter />
                Filter
              </Button>

              <Button onClick={() => setIsCreatingWorkflow(true)}>
                <Plus />
                Create Workflow
              </Button>
            </div>
          </div>
          {/* Search Bar */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search workflows..."
              className="pl-10"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>

          {/* Workflows Grid/List */}
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <WorkflowIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No workflows yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first workflow to organize your tasks
              </p>
              <Button onClick={() => setIsCreatingWorkflow(true)}>
                <Plus />
                Create Workflow
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredWorkflows.map((workflow) => (
                <Link
                  href={`/projects/${projectId}/workflows/${workflow.id}`}
                  key={workflow.id}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-4 h-4 rounded`}
                          style={{ backgroundColor: workflow.color }}
                        />
                        <Badge className="text-xs" variant="secondary">
                          New
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg mb-2 group-hover:text-blue-600 transition-colors">
                        {workflow.name}
                      </CardTitle>
                      <CardDescription className="text-sm mb-4">
                        {workflow.description || "No description"}
                      </CardDescription>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
                        <span>
                          Created{" "}
                          {new Date(workflow.created_at).toLocaleDateString()}
                        </span>
                        <span>
                          Updated{" "}
                          {new Date(workflow.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              <Card
                className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer group"
                onClick={() => setIsCreatingWorkflow(true)}
              >
                <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                  <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                  <p className="text-sm sm:text-base text-gray-600 group-hover:text-blue-600 font-medium">
                    Create new workflow
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div>
              {filteredWorkflows.map((workflow, key) => (
                <div key={key} className={key > 0 ? "mt-4" : ""}>
                  <Link
                    href={`/projects/${projectId}/workflows/${workflow.id}`}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-4 h-4 rounded`}
                            style={{ backgroundColor: workflow.color }}
                          />
                          <Badge className="text-xs" variant="secondary">
                            New
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg mb-2 group-hover:text-blue-600 transition-colors">
                          {workflow.name}
                        </CardTitle>
                        <CardDescription className="text-sm mb-4">
                          {workflow.description || "No description"}
                        </CardDescription>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
                          <span>
                            Created{" "}
                            {new Date(workflow.created_at).toLocaleDateString()}
                          </span>
                          <span>
                            Updated{" "}
                            {new Date(workflow.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}

              <Card
                className="mt-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer group"
                onClick={() => setIsCreatingWorkflow(true)}
              >
                <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                  <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                  <p className="text-sm sm:text-base text-gray-600 group-hover:text-blue-600 font-medium">
                    Create new workflow
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Filter Workflows</DialogTitle>
            <p className="text-sm text-gray-600">
              Filter workflows by name.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                id="search"
                placeholder="Search workflow names..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between pt-4 space-y-2 sm:space-y-0 sm:space-x-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={() => setIsFilterOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Workflow Dialog */}
      <Dialog
        open={isCreatingWorkflow}
        onOpenChange={setIsCreatingWorkflow}
      >
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <p className="text-sm text-gray-600">
              Add a new workflow to organize your tasks
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateWorkflow}>
            <div className="space-y-2">
              <Label>Workflow Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter workflow name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter workflow description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {[
                  "#3b82f6",
                  "#10b981",
                  "#f59e0b",
                  "#ef4444",
                  "#8b5cf6",
                  "#ec4899",
                  "#6366f1",
                  "#6b7280",
                  "#f97316",
                  "#14b8a6",
                  "#06b6d4",
                  "#10b981",
                ].map((color, key) => (
                  <input
                    key={key}
                    type="radio"
                    name="color"
                    value={color}
                    defaultChecked={key === 0}
                    className="sr-only peer"
                    id={`color-${key}`}
                  />
                ))}
                {[
                  "#3b82f6",
                  "#10b981",
                  "#f59e0b",
                  "#ef4444",
                  "#8b5cf6",
                  "#ec4899",
                  "#6366f1",
                  "#6b7280",
                  "#f97316",
                  "#14b8a6",
                  "#06b6d4",
                  "#10b981",
                ].map((color, key) => (
                  <label
                    key={key}
                    htmlFor={`color-${key}`}
                    className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-gray-900"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatingWorkflow(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Workflow</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
