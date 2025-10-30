"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/lib/supabase/SupabaseProvider";
import { stepService } from "@/lib/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Workflow, Plus, X } from "lucide-react";
import { Workflow as WorkflowType, Step } from "@/lib/supabase/models";

interface WorkflowInfo {
  workflow: {
    id: number;
    name: string;
    description: string | null;
    color: string;
  };
  step: {
    id: number;
    title: string;
  } | null;
}

interface WorkflowsCardProps {
  workflows: WorkflowInfo[];
  availableWorkflows: WorkflowType[];
  onAddWorkflow: (workflowId: number, stepId: number) => Promise<void>;
  onRemoveWorkflow: (workflowId: number) => Promise<void>;
  loading?: boolean;
}

export function WorkflowsCard({
  workflows,
  availableWorkflows,
  onAddWorkflow,
  onRemoveWorkflow,
}: WorkflowsCardProps) {
  const { supabase } = useSupabase();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [selectedStepId, setSelectedStepId] = useState<string>("");
  const [workflowSteps, setWorkflowSteps] = useState<Step[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [removingWorkflowId, setRemovingWorkflowId] = useState<number | null>(
    null
  );

  const assignedWorkflowIds = workflows.map((w) => w.workflow.id);
  const unassignedWorkflows = availableWorkflows.filter(
    (w) => !assignedWorkflowIds.includes(w.id)
  );

  const fetchSteps = useCallback(async (workflowId: number) => {
    if (!supabase) return;

    try {
      setIsLoadingSteps(true);
      const steps = await stepService.getStepsByWorkflow(supabase, workflowId);
      setWorkflowSteps(steps);
    } catch (error) {
      console.error("Failed to fetch workflow steps:", error);
      setWorkflowSteps([]);
    } finally {
      setIsLoadingSteps(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (selectedWorkflowId && supabase) {
      fetchSteps(parseInt(selectedWorkflowId));
    }
  }, [selectedWorkflowId, supabase, fetchSteps]);

  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setSelectedStepId("");
    setWorkflowSteps([]);
  };

  const handleAddWorkflow = async () => {
    if (!selectedWorkflowId || !selectedStepId) return;

    try {
      setIsAdding(true);
      await onAddWorkflow(parseInt(selectedWorkflowId), parseInt(selectedStepId));
      setIsAddDialogOpen(false);
      setSelectedWorkflowId("");
      setSelectedStepId("");
      setWorkflowSteps([]);
    } catch (error) {
      console.error("Failed to add workflow:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveWorkflow = async (workflowId: number) => {
    try {
      setRemovingWorkflowId(workflowId);
      await onRemoveWorkflow(workflowId);
    } catch (error) {
      console.error("Failed to remove workflow:", error);
    } finally {
      setRemovingWorkflowId(null);
    }
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Workflows
            </CardTitle>
            <CardDescription>
              Workflows this object is assigned to
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={unassignedWorkflows.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Workflow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Workflow</DialogTitle>
                <DialogDescription>
                  Select a workflow and step to add this object to
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="workflow">Workflow</Label>
                  <Select value={selectedWorkflowId} onValueChange={handleWorkflowSelect}>
                    <SelectTrigger id="workflow">
                      <SelectValue placeholder="Select a workflow..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedWorkflows.map((workflow) => (
                        <SelectItem key={workflow.id} value={workflow.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: workflow.color }}
                            />
                            {workflow.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="step">Step</Label>
                  <Select
                    value={selectedStepId}
                    onValueChange={setSelectedStepId}
                    disabled={!selectedWorkflowId || isLoadingSteps}
                  >
                    <SelectTrigger id="step">
                      <SelectValue
                        placeholder={
                          isLoadingSteps
                            ? "Loading steps..."
                            : workflowSteps.length === 0 && selectedWorkflowId
                            ? "No steps available"
                            : "Select a step..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowSteps.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          {isLoadingSteps ? "Loading..." : "No steps in this workflow"}
                        </div>
                      ) : (
                        workflowSteps.map((step) => (
                          <SelectItem key={step.id} value={step.id.toString()}>
                            {step.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddWorkflow}
                  disabled={!selectedWorkflowId || !selectedStepId || isAdding}
                >
                  {isAdding ? "Adding..." : "Add to Workflow"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {workflows.length === 0 ? (
          <EmptyState
            icon={<Workflow className="h-8 w-8" />}
            title="No workflows"
            description="This object is not assigned to any workflow yet."
          />
        ) : (
          <div className="space-y-3">
            {workflows.map(({ workflow, step }, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: workflow.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">
                      {workflow.name}
                    </p>
                    {workflow.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step && (
                    <Badge variant="outline" className="text-xs">
                      {step.title}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveWorkflow(workflow.id)}
                    disabled={removingWorkflowId === workflow.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
