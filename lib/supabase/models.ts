// ===== ENUM TYPES =====
export type ObjectPriority = "low" | "medium" | "high" | "urgent";

export type RelationKind =
  | "electrical_connection"
  | "signals_to"
  | "mechanical"
  | "references"
  | "contains"
  | "depends_on";

export type LexiconType =
  | "part"
  | "workflow_template"
  | "step_template"
  | "document"
  | "spec"
  | "client";

// ===== AGGREGATE / HELPER TYPES =====
export type StepWithObjects = Step & {
  objects: ScadaObject[];
};

// ===== PROJECT STRUCTURE =====
export interface Project {
  id: number;
  created_at: string;
  updated_at: string;
  org_id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
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

// ===== OBJECTS =====
export interface ScadaObject {
  id: number;
  created_at: string;
  updated_at: string;
  project_id: number;
  workflow_id: number[] | null;
  step_id: Array<number | null> | null;
  title: string;
  description_md: string | null;
  assignee: string[]; // Array of user IDs for multiple assignees
  due_date: string | null;
  priority: ObjectPriority;
  sort_order: number;
  metadata: Record<string, unknown> | null;
}

// ===== OBJECT RELATIONS =====
export interface ObjectRelation {
  id: number;
  created_at: string;
  relation_kind: RelationKind;
  src_object_id: number;
  dst_object_id: number;
}

// ===== OBJECT SUBTASKS =====
export interface ObjectSubtask {
  id: number;
  object_id: number;
  title: string;
  is_done: boolean;
  sort_order: number;
}

// ===== FILES =====
export interface FileMeta {
  id: number;
  created_at: string;
  uploaded_by: string | null;
  org_id: string;
  project_id: number | null;
  storage_key: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  sha256: string | null;
}

// ===== OBJECT-FILE & LEXICON LINKS =====
export interface ObjectFileLink {
  object_id: number;
  file_id: number;
}

export interface ObjectLexiconLink {
  object_id: number;
  lexicon_id: number;
  note: string | null;
}

export interface LexiconFileLink {
  lexicon_id: number;
  file_id: number;
}

// ===== LEXICON ITEMS =====
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
  version: number;
}

export type ObjectWithFiles = ScadaObject & { files: FileMeta[] };
export type ObjectWithSubtasks = ScadaObject & { subtasks: ObjectSubtask[] };
export type ObjectWithRelations = ScadaObject & {
  relations: ObjectRelation[];
};
export type ObjectWithLexicon = ScadaObject & { lexicon_links: ObjectLexiconLink[] };
