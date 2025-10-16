"use client";

import { useOrganization } from "@clerk/nextjs";
import { projectService, workflowService, stepService } from "../services";
import { useEffect, useState } from "react";
import { Project } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useProjects() {
  const { organization } = useOrganization();
  const { supabase } = useSupabase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, supabase]);

  async function loadProjects() {
    if (!organization) return;

    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjects(supabase!);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  async function createProject(projectData: {
    name: string;
    description?: string;
    code?: string;
    status?: string;
  }) {
    if (!organization) throw new Error("Organization not found");
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      console.log("Creating project with data:", {
        name: projectData.name,
        org_id: organization.id,
      });

      const newProject = await projectService.createProject(supabase, {
        name: projectData.name,
        description: projectData.description || null,
        code: projectData.code || null,
        status: projectData.status || "active",
        org_id: organization.id,
        start_date: null,
        end_date: null,
        metadata: {},
        client_lexicon_id: null,
      });

      console.log("Project created:", newProject);

      // Create default workflows with their steps for the new project
      const defaultWorkflows = [
        {
          name: "Instrumentation and Design",
          color: "#3b82f6",
          steps: [
            "To Start",
            "Specs Received",
            "Submittal",
            "Ordering",
            "Received",
            "Checkout",
            "Delivered",
          ],
        },
        {
          name: "Programming",
          color: "#10b981",
          steps: [
            "To Start",
            "IO List",
            "Hardware Setup",
            "Control Narrative",
            "Loop Checks",
            "Tests",
            "Complete",
          ],
        },
        {
          name: "Object Management",
          color: "#f59e0b",
          steps: ["Available", "Checked Out"],
        },
      ];

      console.log("Creating workflows for project:", newProject.id);

      // Create workflows and their steps sequentially
      for (const wf of defaultWorkflows) {
        const workflow = await workflowService.createWorkflow(supabase, {
          name: wf.name,
          project_id: newProject.id,
          description: null,
          color: wf.color,
        });

        // Create steps for this workflow
        await Promise.all(
          wf.steps.map((stepTitle, index) =>
            stepService.createStep(supabase, {
              workflow_id: workflow.id,
              title: stepTitle,
              position: index,
            })
          )
        );
      }

      console.log("Workflows and steps created successfully");
      setProjects((prev) => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      console.error("Error in createProject:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create project.";
      setError(errorMessage);
      throw err;
    }
  }

  async function updateProject(
    projectId: number,
    updates: {
      name?: string;
      description?: string;
      code?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    if (!organization) throw new Error("Organization not found");
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      const updatedProject = await projectService.updateProject(
        supabase,
        projectId,
        updates
      );

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updatedProject : p))
      );

      return updatedProject;
    } catch (err) {
      console.error("Error in updateProject:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update project.";
      setError(errorMessage);
      throw err;
    }
  }

  async function deleteProject(projectId: number) {
    if (!organization) throw new Error("Organization not found");
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      await projectService.deleteProject(supabase, projectId);

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error("Error in deleteProject:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete project.";
      setError(errorMessage);
      throw err;
    }
  }

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    reload: loadProjects,
  };
}
