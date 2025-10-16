import {
  Project,
  Workflow,
  Step,
  ScadaObject,
  ObjectRelation,
  ObjectSubtask,
  ObjectFileLink,
  ObjectLexiconLink,
  FileMeta,
  LexiconFileLink,
  LexiconItem,
  LexiconType,
} from "./supabase/models";
import { SupabaseClient } from "@supabase/supabase-js";

// =======================
// PROJECT SERVICES
// =======================
export const projectService = {
  async getProjects(supabase: SupabaseClient): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getProjectById(supabase: SupabaseClient, id: number): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async createProject(
    supabase: SupabaseClient,
    project: Omit<Project, "id" | "created_at" | "updated_at">
  ): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .insert(project)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProject(
    supabase: SupabaseClient,
    projectId: number,
    updates: Partial<Project>
  ): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProject(
    supabase: SupabaseClient,
    projectId: number
  ): Promise<void> {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);
    if (error) throw error;
  },
};

// =======================
// WORKFLOW SERVICES
// =======================
export const workflowService = {
  async getWorkflow(
    supabase: SupabaseClient,
    workflowId: number
  ): Promise<Workflow> {
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .single();
    if (error) throw error;
    return data;
  },

  async getWorkflowsByProject(
    supabase: SupabaseClient,
    projectId: number
  ): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createWorkflow(
    supabase: SupabaseClient,
    workflow: Omit<Workflow, "id" | "created_at" | "updated_at">
  ): Promise<Workflow> {
    const { data, error } = await supabase
      .from("workflows")
      .insert(workflow)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateWorkflow(
    supabase: SupabaseClient,
    workflowId: number,
    updates: Partial<Workflow>
  ): Promise<Workflow> {
    const { data, error } = await supabase
      .from("workflows")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", workflowId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// =======================
// STEP SERVICES
// =======================
export const stepService = {
  async getStepsByWorkflow(
    supabase: SupabaseClient,
    workflowId: number
  ): Promise<Step[]> {
    const { data, error } = await supabase
      .from("steps")
      .select("*")
      .eq("workflow_id", workflowId)
      .order("position", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createStep(
    supabase: SupabaseClient,
    step: Omit<Step, "id" | "created_at">
  ): Promise<Step> {
    const { data, error } = await supabase
      .from("steps")
      .insert(step)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStepTitle(
    supabase: SupabaseClient,
    stepId: number,
    title: string
  ): Promise<Step> {
    const { data, error } = await supabase
      .from("steps")
      .update({ title })
      .eq("id", stepId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// =======================
// OBJECT SERVICES
// =======================
export const objectService = {
  async getObjectsByProject(
    supabase: SupabaseClient,
    projectId: number
  ): Promise<ScadaObject[]> {
    const { data, error } = await supabase
      .from("objects")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getObjectsByWorkflow(
    supabase: SupabaseClient,
    workflowId: number
  ): Promise<ScadaObject[]> {
    const { data, error } = await supabase
      .from("objects")
      .select("*")
      .contains("workflow_id", [workflowId]);
    if (error) throw error;
    return data || [];
  },

  async createObject(
    supabase: SupabaseClient,
    obj: Omit<ScadaObject, "id" | "created_at" | "updated_at">
  ): Promise<ScadaObject> {
    const { data, error } = await supabase
      .from("objects")
      .insert(obj)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async moveObject(
    supabase: SupabaseClient,
    objectId: number,
    newStepId: number | null,
    newOrder: number
  ) {
    const { data, error } = await supabase
      .from("objects")
      .update({
        step_id: newStepId ? [newStepId] : null,
        sort_order: newOrder
      })
      .eq("id", objectId);
    if (error) throw error;
    return data;
  },

  async updateObject(
    supabase: SupabaseClient,
    objectId: number,
    updates: Partial<ScadaObject>
  ): Promise<ScadaObject> {
    const { data, error } = await supabase
      .from("objects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", objectId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// =======================
// OBJECT RELATION SERVICES
// =======================
export const objectRelationService = {
  async getRelationsByObject(
    supabase: SupabaseClient,
    objectId: number
  ): Promise<ObjectRelation[]> {
    const { data, error } = await supabase
      .from("object_relations")
      .select("*")
      .or(`src_object_id.eq.${objectId},dst_object_id.eq.${objectId}`);
    if (error) throw error;
    return data || [];
  },

  async createRelation(
    supabase: SupabaseClient,
    relation: Omit<ObjectRelation, "id" | "created_at">
  ): Promise<ObjectRelation> {
    const { data, error } = await supabase
      .from("object_relations")
      .insert(relation)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// =======================
// OBJECT SUBTASKS
// =======================
export const objectSubtaskService = {
  async getSubtasks(
    supabase: SupabaseClient,
    objectId: number
  ): Promise<ObjectSubtask[]> {
    const { data, error } = await supabase
      .from("object_subtasks")
      .select("*")
      .eq("object_id", objectId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createSubtask(
    supabase: SupabaseClient,
    subtask: Omit<ObjectSubtask, "id">
  ): Promise<ObjectSubtask> {
    const { data, error } = await supabase
      .from("object_subtasks")
      .insert(subtask)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// =======================
// FILE SERVICES
// =======================
export const fileService = {
  async getFilesByProject(
    supabase: SupabaseClient,
    projectId: number
  ): Promise<FileMeta[]> {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("project_id", projectId);
    if (error) throw error;
    return data || [];
  },

  async uploadFileMeta(
    supabase: SupabaseClient,
    file: Omit<FileMeta, "id" | "created_at">
  ): Promise<FileMeta> {
    const { data, error } = await supabase
      .from("files")
      .insert(file)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// =======================
// OBJECT-FILE LINKS
// =======================
export const objectFileService = {
  async linkFileToObject(
    supabase: SupabaseClient,
    link: ObjectFileLink
  ): Promise<void> {
    const { error } = await supabase.from("object_files").insert(link);
    if (error) throw error;
  },

  async getFilesForObject(
    supabase: SupabaseClient,
    objectId: number
  ): Promise<FileMeta[]> {
    const { data, error } = await supabase
      .from("object_files")
      .select("files(*)")
      .eq("object_id", objectId);
    if (error) throw error;
    const typedData = data as { files: FileMeta[] }[] | null;
    return typedData?.flatMap((r) => r.files) ?? [];
  },
};

// =======================
// OBJECT-LEXICON LINKS
// =======================
export const objectLexiconService = {
  async linkLexiconItem(
    supabase: SupabaseClient,
    link: ObjectLexiconLink
  ): Promise<void> {
    const { error } = await supabase.from("object_lexicon_links").insert(link);
    if (error) throw error;
  },

  async getLexiconForObject(
    supabase: SupabaseClient,
    objectId: number
  ): Promise<LexiconItem[]> {
    const { data, error } = await supabase
      .from("object_lexicon_links")
      .select("lexicon_items(*)")
      .eq("object_id", objectId);
    if (error) throw error;
    const typedData = data as { lexicon_items: LexiconItem[] }[] | null;
    return typedData?.flatMap((r) => r.lexicon_items) ?? [];
  },
};

// =======================
// LEXICON SERVICES
// =======================
export const lexiconService = {
  async getLexiconItemsByType(
    supabase: SupabaseClient,
    orgId: string,
    type: LexiconType
  ): Promise<LexiconItem[]> {
    const { data, error } = await supabase
      .from("lexicon_items")
      .select("*")
      .eq("org_id", orgId)
      .eq("type", type)
      .order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createLexiconItem(
    supabase: SupabaseClient,
    item: Omit<LexiconItem, "id" | "created_at" | "updated_at">
  ): Promise<LexiconItem> {
    const { data, error } = await supabase
      .from("lexicon_items")
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// =======================
// LEXICON-FILE LINKS
// =======================
export const lexiconFileService = {
  async linkFileToLexicon(
    supabase: SupabaseClient,
    link: LexiconFileLink
  ): Promise<void> {
    const { error } = await supabase.from("lexicon_files").insert(link);
    if (error) throw error;
  },

  async getFilesForLexicon(
    supabase: SupabaseClient,
    lexiconId: number
  ): Promise<FileMeta[]> {
    const { data, error } = await supabase
      .from("lexicon_files")
      .select("files(*)")
      .eq("lexicon_id", lexiconId);
    if (error) throw error;
    const typedData = data as { files: FileMeta[] }[] | null;
    return typedData?.flatMap((r) => r.files) ?? [];
  },
};
