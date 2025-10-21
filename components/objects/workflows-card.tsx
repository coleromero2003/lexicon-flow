"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Workflow } from "lucide-react";

interface WorkflowInfo {
  workflow: {
    name: string;
    description: string | null;
    color: string;
  };
  step: {
    title: string;
  } | null;
}

interface WorkflowsCardProps {
  workflows: WorkflowInfo[];
}

export function WorkflowsCard({ workflows }: WorkflowsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          Workflows
        </CardTitle>
        <CardDescription>
          Workflows this object is assigned to
        </CardDescription>
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
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: workflow.color }}
                  />
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {workflow.name}
                    </p>
                    {workflow.description && (
                      <p className="text-xs text-gray-500">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                </div>
                {step && (
                  <Badge variant="outline" className="text-xs">
                    {step.title}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
