"use client";

import { useOrganization } from "@clerk/nextjs";
import {
  workflowService,
  stepService,
  objectService,
} from "../services";
import { useEffect, useState } from "react";
import { Workflow, StepWithObjects, ScadaObject } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useWorkflows(projectId: number) {
  const { organization } = useOrganization();
  const { supabase } = useSupabase();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && organization) {
      loadWorkflows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, organization, supabase]);

  async function loadWorkflows() {
    if (!projectId) return;
    if (!supabase) return; // Wait for Supabase client to be initialized

    try {
      setLoading(true);
      setError(null);
      const data = await workflowService.getWorkflowsByProject(
        supabase,
        projectId
      );
      setWorkflows(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load workflows."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createWorkflow(workflowData: {
    name: string;
    description?: string;
    color?: string;
  }) {
    if (!organization) throw new Error("Organization not found");
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      // Create the workflow
      const newWorkflow = await workflowService.createWorkflow(supabase, {
        name: workflowData.name,
        description: workflowData.description || null,
        color: workflowData.color || "#3b82f6",
        project_id: projectId,
      });

      // Create default steps for the new workflow
      const defaultSteps = ["To Do", "Working On", "Review", "Complete"];
      await Promise.all(
        defaultSteps.map((title, index) =>
          stepService.createStep(supabase, {
            title,
            workflow_id: newWorkflow.id,
            position: index,
          })
        )
      );

      setWorkflows((prev) => [newWorkflow, ...prev]);
      return newWorkflow;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create workflow."
      );
      throw err;
    }
  }

  return { workflows, loading, error, createWorkflow };
}

export function useWorkflow(workflowId: number) {
  const { supabase } = useSupabase();
  const { organization } = useOrganization();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<StepWithObjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workflowId && organization) {
      loadWorkflow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, organization, supabase]);

  async function loadWorkflow() {
    if (!workflowId) return;
    if (!supabase) return; // Wait for Supabase client to be initialized

    try {
      setLoading(true);
      setError(null);

      // Get workflow
      const workflowData = await workflowService.getWorkflow(
        supabase,
        workflowId
      );
      setWorkflow(workflowData);

      // Get steps for this workflow
      const stepsData = await stepService.getStepsByWorkflow(
        supabase,
        workflowId
      );

      // Get objects for this workflow
      const objectsData = await objectService.getObjectsByWorkflow(
        supabase,
        workflowId
      );

      // Combine steps with their objects
      const stepsWithObjects: StepWithObjects[] = stepsData.map((step) => ({
        ...step,
        objects: objectsData.filter((obj) => obj.step_id?.includes(step.id)),
      }));

      setSteps(stepsWithObjects);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load workflow."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateWorkflow(workflowId: number, updates: Partial<Workflow>) {
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      const updatedWorkflow = await workflowService.updateWorkflow(
        supabase,
        workflowId,
        updates
      );
      setWorkflow(updatedWorkflow);
      return updatedWorkflow;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update the workflow."
      );
    }
  }

  async function createRealObject(
    stepId: number,
    objectData: {
      title: string;
      description?: string;
      assignee?: string;
      dueDate?: string;
      priority?: "low" | "medium" | "high" | "urgent";
    }
  ) {
    try {
      if (!workflow) throw new Error("Workflow not loaded");
      if (!supabase) throw new Error("Supabase client not initialized");

      const newObject = await objectService.createObject(supabase, {
        title: objectData.title,
        description_md: objectData.description || null,
        assignee: objectData.assignee || null,
        due_date: objectData.dueDate || null,
        step_id: [stepId],
        workflow_id: [workflow.id],
        project_id: workflow.project_id,
        sort_order:
          steps.find((step) => step.id === stepId)?.objects.length || 0,
        priority: objectData.priority || "medium",
        metadata: null,
      });

      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId
            ? { ...step, objects: [...step.objects, newObject] }
            : step
        )
      );

      return newObject;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create the object."
      );
    }
  }

  async function moveObject(
    objectId: number,
    newStepId: number,
    newOrder: number
  ) {
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      await objectService.moveObject(supabase, objectId, newStepId, newOrder);

      setSteps((prev) => {
        const newSteps = [...prev];

        // Find and remove object from the old step
        let objectToMove: ScadaObject | null = null;
        for (const step of newSteps) {
          const objectIndex = step.objects.findIndex(
            (obj) => obj.id === objectId
          );
          if (objectIndex !== -1) {
            objectToMove = step.objects[objectIndex];
            step.objects.splice(objectIndex, 1);
            break;
          }
        }

        if (objectToMove) {
          // Add object to new step
          const targetStep = newSteps.find((step) => step.id === newStepId);
          if (targetStep) {
            targetStep.objects.splice(newOrder, 0, objectToMove);
          }
        }

        return newSteps;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move object.");
    }
  }

  async function createStep(title: string) {
    if (!workflow || !organization) throw new Error("Workflow not loaded");
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      const newStep = await stepService.createStep(supabase, {
        title,
        workflow_id: workflow.id,
        position: steps.length,
      });

      setSteps((prev) => [...prev, { ...newStep, objects: [] }]);
      return newStep;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create step.");
    }
  }

  async function updateStep(stepId: number, title: string) {
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      const updatedStep = await stepService.updateStepTitle(
        supabase,
        stepId,
        title
      );

      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, ...updatedStep } : step
        )
      );

      return updatedStep;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update step.");
    }
  }

  return {
    workflow,
    steps,
    loading,
    error,
    updateWorkflow,
    createRealObject,
    setSteps,
    moveObject,
    createStep,
    updateStep,
  };
}
