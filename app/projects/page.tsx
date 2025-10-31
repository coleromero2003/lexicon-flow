"use client";

import type { ReactNode } from "react";

import Navbar from "@/components/navbar";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useProjects } from "@/lib/hooks/useProjects";
import { SignInButton, useOrganization, useUser } from "@clerk/nextjs";

export default function ProjectsPage() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const { organization } = useOrganization();
  const { projects, loading, error } = useProjects();

  const shouldShowAuthPrompt = userLoaded && !isSignedIn;

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
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-col gap-2 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Projects</h1>
            <p className="text-gray-600">
              Explore all of your SCADA projects. Select a project card to view its
              detailed dashboard.
            </p>
          </header>

          {content}
        </div>
      </main>
    </div>
  );
}
