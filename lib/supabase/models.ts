export interface Board {
  id: string;
  title: string;
  description: string | null;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  title: string;
  sort_order: number;
  created_at: string;
  user_id: string;
}

export type ColumnWithTasks = Column & {
  tasks: Task[];
};

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  sort_order: number;
  created_at: string;
}
export interface Project {
  id: number;
  created_at: string;
  updated_at: string;
  org_id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string; // or enum
  start_date: string | null;
  end_date: string | null;
  metadata: Record<string, unknown>;
  client_lexicon_id: number | null;
}
export interface Workflow {
  id: number;
  created_at: string;
  updated_at: string;
  project_id: number;
  name: string;
  description: string | null;
  color: string;
}
export interface Step {
  id: number;
  created_at: string;
  workflow_id: number;
  title: string;
  position: number;
}
export interface ScadaObject {
  id: number;
  created_at: string;
  updated_at: string;
  project_id: number;
  workflow_id: number;
  step_id: number | null;
  title: string;
  description_md: string | null;
  assignee: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  sort_order: number;
}
export type LexiconType =
  | "part"
  | "workflow_template"
  | "step_template"
  | "document"
  | "spec"
  | "client";

export interface LexiconItem {
  id: number;
  created_at: string;
  updated_at: string;
  org_id: string;
  type: LexiconType;
  name: string;
  sku: string | null;
  manufacturer: string | null;
  attributes: Record<string, unknown>;
}
