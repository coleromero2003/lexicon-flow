"use client";

import Navbar from "@/components/navbar";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageErrorBoundary } from "@/components/ui/page-error-boundary";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/lib/hooks/useProjects";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  BookOpen,
  Filter,
  FolderKanban,
  Grid3x3,
  List,
  Plus,
  Rocket,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const CODE_PATTERN = /^[A-Za-z0-9_-]{0,20}$/;

type Filters = {
  search: string;
  dateRange: {
    start: string | null;
    end: string | null;
  };
};

const createDefaultFilters = (): Filters => ({
  search: "",
  dateRange: {
    start: null,
    end: null,
  },
});

const sanitizePlainText = (value: string) =>
  value.replace(/<[^>]*>/g, "").replace(/[\r\n\t]+/g, " ").trim();

const sanitizeProjectCode = (value: string) => sanitizePlainText(value);

function DashboardErrorFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <EmptyState
          title="Something went wrong"
          description="We couldn&apos;t render your projects. Please refresh and try again."
          action={
            <Button onClick={() => window.location.reload()}>
              Reload page
            </Button>
          }
        />
      </main>
    </div>
  );
}

function ProjectsPageContent() {
  const router = useRouter();
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();
  const { createProject, projects, error, loading, reload } = useProjects();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(() => createDefaultFilters());

  useEffect(() => {
    if (userLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isSignedIn, userLoaded, router]);

  useEffect(() => {
    if (!isCreatingProject) {
      setFormError(null);
    }
  }, [isCreatingProject]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.name
        .toLowerCase()
        .includes(filters.search.toLowerCase());

      const matchesDateRange =
        (!filters.dateRange.start ||
          new Date(project.created_at) >= new Date(filters.dateRange.start)) &&
        (!filters.dateRange.end ||
          new Date(project.created_at) <= new Date(filters.dateRange.end));

      return matchesSearch && matchesDateRange;
    });
  }, [filters, projects]);

  if (!userLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner label="Loading your account..." />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  const handleClearFilters = () => {
    setFilters(createDefaultFilters());
  };

  const handleCreateProject = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const rawName = (formData.get("name") as string) || "";
    const rawDescription = (formData.get("description") as string) || "";
    const rawCode = (formData.get("code") as string) || "";

    const name = sanitizePlainText(rawName);
    const description = sanitizePlainText(rawDescription);
    const code = sanitizeProjectCode(rawCode);

    if (!name) {
      setFormError("A project name is required.");
      return;
    }

    if (name.length > MAX_NAME_LENGTH) {
      setFormError(`Project name must be ${MAX_NAME_LENGTH} characters or fewer.`);
      return;
    }

    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      setFormError(
        `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`
      );
      return;
    }

    if (code && !CODE_PATTERN.test(code)) {
      setFormError(
        "Project code can only include letters, numbers, underscores, and hyphens (max 20 characters)."
      );
      return;
    }

    try {
      await createProject({
        name,
        description: description || undefined,
        code: code || undefined,
      });
      event.currentTarget.reset();
      setIsCreatingProject(false);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to create the project. Please try again."
      );
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <EmptyState
            title="Unable to load projects"
            description={error}
            action={
              <Button onClick={() => void reload()} variant="outline">
                Retry loading projects
              </Button>
            }
          />
        </main>
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
              Please select or create an organization to manage projects.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const hasProjects = filteredProjects.length > 0;

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
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6 sm:mb-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                Projects for {organization.name}
              </h1>
              <p className="text-gray-600">
                Manage your SCADA projects and workflows.
              </p>
            </div>
            <Link href="/lexicon">
              <Button variant="outline" size="sm" className="mt-4 sm:mt-0">
                <BookOpen className="mr-2 h-4 w-4" />
                Manage Lexicon
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 sm:text-sm">
                    Total Projects
                  </p>
                  <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                    {projects.length}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                  <Rocket className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 sm:text-sm">
                    Active Filters
                  </p>
                  <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                    {filters.search || filters.dateRange.start || filters.dateRange.end
                      ? 1
                      : 0}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                  <Filter className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 sm:text-sm">
                    Grid View
                  </p>
                  <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                    {viewMode === "grid" ? "On" : "Off"}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                  <Grid3x3 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 sm:text-sm">
                    List View
                  </p>
                  <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                    {viewMode === "list" ? "On" : "Off"}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                  <List className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search projects..."
              className="pl-10"
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  search: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="mr-2 h-4 w-4" /> Grid view
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="mr-2 h-4 w-4" /> List view
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(true)}>
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
            <Button size="sm" onClick={() => setIsCreatingProject(true)}>
              <Plus className="mr-2 h-4 w-4" /> New project
            </Button>
          </div>
        </div>

        {loading && projects.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-gray-200">
            <LoadingSpinner label="Loading projects..." />
          </div>
        ) : !hasProjects ? (
          <div className="py-12 text-center">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No projects yet
            </h3>
            <p className="mb-4 text-gray-600">
              Create your first SCADA project to get started
            </p>
            <Button onClick={() => setIsCreatingProject(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="space-y-2">
                <ProjectCard project={project} />
              </div>
            ))}
            <Card
              className="group cursor-pointer border-2 border-dashed border-gray-300 transition-colors hover:border-blue-400"
              onClick={() => setIsCreatingProject(true)}
            >
              <CardContent className="flex min-h-[200px] h-full flex-col items-center justify-center p-4 sm:p-6">
                <Plus className="mb-2 h-6 w-6 text-gray-400 transition-colors group-hover:text-blue-600 sm:h-8 sm:w-8" />
                <p className="text-sm font-medium text-gray-600 transition-colors group-hover:text-blue-600 sm:text-base">
                  Create new project
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className={`space-y-2 ${index > 0 ? "mt-4" : ""}`}
              >
                <ProjectCard project={project} />
                <div className="flex flex-wrap gap-2">
                  <Link href={`/projects/${project.id}/workflows`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      Workflows
                    </Button>
                  </Link>
                  <Link href={`/projects/${project.id}/graph`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      Graph view
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            <Card
              className="mt-4 cursor-pointer border-2 border-dashed border-gray-300 transition-colors hover:border-blue-400"
              onClick={() => setIsCreatingProject(true)}
            >
              <CardContent className="flex min-h-[200px] h-full flex-col items-center justify-center p-4 sm:p-6">
                <Plus className="mb-2 h-6 w-6 text-gray-400 transition-colors group-hover:text-blue-600 sm:h-8 sm:w-8" />
                <p className="text-sm font-medium text-gray-600 transition-colors group-hover:text-blue-600 sm:text-base">
                  Create new project
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Filter Projects</DialogTitle>
            <p className="text-sm text-gray-600">
              Filter projects by name or date.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filter-search">Search</Label>
              <Input
                id="filter-search"
                placeholder="Search project names..."
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="filter-start" className="text-xs">
                    Start Date
                  </Label>
                  <Input
                    id="filter-start"
                    type="date"
                    value={filters.dateRange.start || ""}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          start: event.target.value || null,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="filter-end" className="text-xs">
                    End Date
                  </Label>
                  <Input
                    id="filter-end"
                    type="date"
                    value={filters.dateRange.end || ""}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          end: event.target.value || null,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-2 pt-4 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreatingProject}
        onOpenChange={(open) => {
          setIsCreatingProject(open);
          if (!open) {
            setFormError(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <p className="text-sm text-gray-600">
              Add a new SCADA project to your organization
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateProject}>
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                name="name"
                placeholder="Enter project name"
                required
                maxLength={MAX_NAME_LENGTH}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-code">Project Code</Label>
              <Input
                id="project-code"
                name="code"
                placeholder="e.g., PROJ-001"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                name="description"
                placeholder="Enter project description"
                rows={3}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatingProject(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <PageErrorBoundary fallback={<DashboardErrorFallback />}>
      <ProjectsPageContent />
    </PageErrorBoundary>
  );
}
