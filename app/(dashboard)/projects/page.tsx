"use client";

import type { ReactNode } from "react";

import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useProjects } from "@/lib/hooks/useProjects";
import { SignInButton, useOrganization, useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const CODE_PATTERN = /^[A-Za-z0-9_-]{0,20}$/;

const sanitizePlainText = (value: string) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();

const sanitizeProjectCode = (value: string) => sanitizePlainText(value);

export default function ProjectsPage() {
  const router = useRouter();
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const { organization } = useOrganization();
  const { projects, loading, error, createProject } = useProjects();
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const shouldShowAuthPrompt = userLoaded && !isSignedIn;

  useEffect(() => {
    if (!isCreatingProject) {
      setFormError(null);
    }
  }, [isCreatingProject]);

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
      setFormError(
        `Project name must be ${MAX_NAME_LENGTH} characters or fewer.`
      );
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
      const newProject = await createProject({
        name,
        description: description || undefined,
        code: code || undefined,
      });

      // Close dialog and navigate immediately after successful project creation
      if (newProject) {
        setIsCreatingProject(false);
        router.push(`/projects/${newProject.id}`);
      }
    } catch (err) {
      // Only show error if the project itself failed to create
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to create the project. Please try again."
      );
    }
  };

  let content: ReactNode;

  if (!userLoaded) {
    content = (
      <section className="flex min-h-[200px] items-center justify-center rounded-lg border bg-white">
        <LoadingSpinner label="Checking your account..." />
      </section>
    );
  } else if (shouldShowAuthPrompt) {
    content = (
      <section className="flex flex-col items-center gap-4 rounded-lg border bg-white px-6 py-12 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Sign in to view your projects
        </h2>
        <p className="max-w-xl text-gray-600">
          Log in with your Lexicon Flow account to access the projects that your
          team is collaborating on.
        </p>
        <SignInButton>
          <Button size="lg">Sign in</Button>
        </SignInButton>
      </section>
    );
  } else if (!organization) {
    content = (
      <section className="flex flex-col items-center gap-4 rounded-lg border bg-white px-6 py-12 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Select an organization to continue
        </h2>
        <p className="max-w-xl text-gray-600">
          Choose an organization from the dashboard to access its projects. Once
          selected, the full list of associated projects will appear here.
        </p>
      </section>
    );
  } else if (error) {
    content = (
      <section className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center">
        <h2 className="text-xl font-semibold text-red-700">Unable to load projects</h2>
        <p className="mt-2 text-red-600">{error}</p>
      </section>
    );
  } else if (loading && projects.length === 0) {
    content = (
      <section className="flex min-h-[200px] items-center justify-center rounded-lg border bg-white">
        <LoadingSpinner label="Loading projects..." />
      </section>
    );
  } else if (projects.length === 0) {
    content = (
      <section className="flex flex-col items-center gap-4 rounded-lg border bg-white px-6 py-12 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">No projects yet</h2>
        <p className="max-w-xl text-gray-600">
          Projects that you create or are invited to will appear here. Head to the
          dashboard to create your first project.
        </p>
      </section>
    );
  } else {
    content = (
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} className="h-full" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Projects</h1>
              <p className="text-gray-600">
                Explore all of your SCADA projects. Select a project card to view its
                detailed dashboard.
              </p>
            </div>
            {organization && (
              <Button
                onClick={() => setIsCreatingProject(true)}
                size="sm"
                className="self-center sm:self-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            )}
          </header>

          {content}
        </div>
      </main>

      {/* Create Project Dialog */}
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
