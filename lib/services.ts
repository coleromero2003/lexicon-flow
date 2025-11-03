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
  PartAttributes,
  PartListEntry,
  ObjectMetadata,
} from "./supabase/models";
import { SupabaseClient } from "@supabase/supabase-js";

function isScadaObject(value: unknown): value is ScadaObject {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ScadaObject>;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.project_id === "number" &&
    typeof candidate.sort_order === "number" &&
    typeof candidate.priority === "string"
  );
}

// Helper to validate part attributes
function isValidPartAttributes(attributes: Record<string, unknown>): attributes is PartAttributes {
  return (
    typeof attributes.part_number === 'string' &&
    attributes.part_number.trim() !== '' &&
    typeof attributes.manufacturer === 'string' &&
    attributes.manufacturer.trim() !== '' &&
    typeof attributes.description === 'string' &&
    attributes.description.trim() !== ''
  );
}

// Helper to validate lexicon item before create/update
function validateLexiconItem(item: Partial<LexiconItem>): void {
  if (item.type === 'part' && item.attributes) {
    if (!isValidPartAttributes(item.attributes)) {
      throw new Error('Part lexicon items must have part_number, manufacturer, and description in attributes');
    }
  }
}

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

  async getProjectById(supabase: SupabaseClient, id: number): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        // Not found error
        return null;
      }
      throw error;
    }
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
  ): Promise<Workflow | null> {
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        // Not found error
        return null;
      }
      throw error;
    }
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

  async deleteWorkflow(
    supabase: SupabaseClient,
    workflowId: number
  ): Promise<void> {
    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", workflowId);
    if (error) throw error;
  },
};

// =======================
// STEP SERVICES
// =======================
export const stepService = {
  async getStep(
    supabase: SupabaseClient,
    stepId: number
  ): Promise<Step> {
    const { data, error } = await supabase
      .from("steps")
      .select("*")
      .eq("id", stepId)
      .single();
    if (error) throw error;
    return data;
  },

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

  async updateStepPosition(
    supabase: SupabaseClient,
    stepId: number,
    position: number
  ): Promise<Step> {
    const { data, error } = await supabase
      .from("steps")
      .update({ position })
      .eq("id", stepId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteStep(
    supabase: SupabaseClient,
    stepId: number
  ): Promise<void> {
    const { error } = await supabase
      .from("steps")
      .delete()
      .eq("id", stepId);
    if (error) throw error;
  },
};

// =======================
// OBJECT SERVICES
// =======================
export const objectService = {
  async getObject(
    supabase: SupabaseClient,
    objectId: number
  ): Promise<ScadaObject | null> {
    const { data, error } = await supabase
      .from("objects")
      .select("*")
      .eq("id", objectId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        // Not found error
        return null;
      }
      throw error;
    }
    return data;
  },

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

  async getObjectsByLexicon(
    supabase: SupabaseClient,
    lexiconId: number
  ): Promise<ScadaObject[]> {
    const { data, error } = await supabase
      .from("object_lexicon_links")
      .select("objects(*)")
      .eq("lexicon_id", lexiconId);

    if (error) throw error;

    const entries = Array.isArray(data) ? data : [];

    const objects =
      entries
        .map((entry) => {
          if (!entry || typeof entry !== "object" || !("objects" in entry)) {
            return null;
          }

          const candidate = (entry as { objects: unknown }).objects;
          return isScadaObject(candidate) ? candidate : null;
        })
        .filter((object): object is ScadaObject => object !== null);

    return objects;
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

  async deleteObject(
    supabase: SupabaseClient,
    objectId: number
  ): Promise<void> {
    const { error } = await supabase
      .from("objects")
      .delete()
      .eq("id", objectId);
    if (error) throw error;
  },

  async linkObjectToWorkflow(
    supabase: SupabaseClient,
    objectId: number,
    workflowId: number,
    stepId: number
  ): Promise<ScadaObject> {
    // First, get the current object to access its workflow_id and step_id arrays
    const currentObject = await this.getObject(supabase, objectId);

    if (!currentObject) {
      throw new Error("Object not found");
    }

    // Add the new workflow and step IDs to the arrays (if not already present)
    const workflowIds = currentObject.workflow_id || [];
    const stepIds = currentObject.step_id || [];

    if (!workflowIds.includes(workflowId)) {
      workflowIds.push(workflowId);
      stepIds.push(stepId);
    } else {
      // If workflow already exists, update the corresponding step
      const index = workflowIds.indexOf(workflowId);
      stepIds[index] = stepId;
    }

    // Update the object with the new arrays
    const { data, error } = await supabase
      .from("objects")
      .update({
        workflow_id: workflowIds,
        step_id: stepIds,
        updated_at: new Date().toISOString()
      })
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

  async getRelationsForObjects(
    supabase: SupabaseClient,
    objectIds: number[]
  ): Promise<ObjectRelation[]> {
    const uniqueIds = Array.from(new Set(objectIds));
    if (uniqueIds.length === 0) {
      return [];
    }

    const idList = uniqueIds.join(",");
    const { data, error } = await supabase
      .from("object_relations")
      .select("*")
      .or(
        `src_object_id.in.(${idList}),dst_object_id.in.(${idList})`
      );
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
  async getSubtasksByObject(
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

  async updateSubtask(
    supabase: SupabaseClient,
    subtaskId: number,
    updates: Partial<ObjectSubtask>
  ): Promise<ObjectSubtask> {
    const { data, error } = await supabase
      .from("object_subtasks")
      .update(updates)
      .eq("id", subtaskId)
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
  async getFile(
    supabase: SupabaseClient,
    fileId: number
  ): Promise<FileMeta> {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();
    if (error) throw error;
    return data;
  },

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

  async getFilesByIds(
    supabase: SupabaseClient,
    fileIds: number[]
  ): Promise<FileMeta[]> {
    const uniqueIds = Array.from(new Set(fileIds));
    if (uniqueIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("files")
      .select("*")
      .in("id", uniqueIds);
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

  async deleteFile(
    supabase: SupabaseClient,
    fileId: number
  ): Promise<void> {
    // First get the file metadata to access the storage_key
    const file = await this.getFile(supabase, fileId);

    // Delete from storage bucket
    const { error: storageError } = await supabase.storage
      .from("lexicon-files")
      .remove([file.storage_key]);

    if (storageError) throw storageError;

    // Delete from database (this will cascade delete object_files and lexicon_files links)
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId);

    if (dbError) throw dbError;
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

  async getFilesByObject(
    supabase: SupabaseClient,
    objectId: number
  ): Promise<ObjectFileLink[]> {
    const { data, error } = await supabase
      .from("object_files")
      .select("*")
      .eq("object_id", objectId);
    if (error) throw error;
    return data || [];
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

  async getLinksForObjects(
    supabase: SupabaseClient,
    objectIds: number[]
  ): Promise<ObjectFileLink[]> {
    const uniqueIds = Array.from(new Set(objectIds));
    if (uniqueIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("object_files")
      .select("*")
      .in("object_id", uniqueIds);
    if (error) throw error;
    return data || [];
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

  async getLexiconByObject(
    supabase: SupabaseClient,
    objectId: number
  ): Promise<ObjectLexiconLink[]> {
    const { data, error } = await supabase
      .from("object_lexicon_links")
      .select("*")
      .eq("object_id", objectId);
    if (error) throw error;
    return data || [];
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

  async getLinksForObjects(
    supabase: SupabaseClient,
    objectIds: number[]
  ): Promise<ObjectLexiconLink[]> {
    const uniqueIds = Array.from(new Set(objectIds));
    if (uniqueIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("object_lexicon_links")
      .select("*")
      .in("object_id", uniqueIds);
    if (error) throw error;
    return data || [];
  },
};

// =======================
// LEXICON SERVICES
// =======================
export const lexiconService = {
  async getLexiconItem(
    supabase: SupabaseClient,
    lexiconId: number
  ): Promise<LexiconItem> {
    const { data, error } = await supabase
      .from("lexicon_items")
      .select("*")
      .eq("id", lexiconId)
      .single();
    if (error) throw error;
    return data;
  },

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

  async getLexiconItemsForOrg(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<LexiconItem[]> {
    const { data, error } = await supabase
      .from("lexicon_items")
      .select("*")
      .eq("org_id", orgId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getLexiconItemsByIds(
    supabase: SupabaseClient,
    lexiconIds: number[]
  ): Promise<LexiconItem[]> {
    const uniqueIds = Array.from(new Set(lexiconIds));
    if (uniqueIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("lexicon_items")
      .select("*")
      .in("id", uniqueIds)
      .order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createLexiconItem(
    supabase: SupabaseClient,
    item: Omit<LexiconItem, "id" | "created_at" | "updated_at">
  ): Promise<LexiconItem> {
    // Validate before inserting
    validateLexiconItem(item);

    const { data, error } = await supabase
      .from("lexicon_items")
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateLexiconItem(
    supabase: SupabaseClient,
    lexiconId: number,
    updates: Partial<Omit<LexiconItem, "id" | "created_at" | "updated_at" | "org_id">>
  ): Promise<LexiconItem> {
    // If updating a part, validate the attributes
    if (updates.type === 'part' || updates.attributes) {
      // Fetch current item to check type
      const current = await this.getLexiconItem(supabase, lexiconId);
      const itemToValidate = { ...current, ...updates };
      validateLexiconItem(itemToValidate);
    }

    const { data, error } = await supabase
      .from("lexicon_items")
      .update(updates)
      .eq("id", lexiconId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteLexiconItem(
    supabase: SupabaseClient,
    lexiconId: number
  ): Promise<void> {
    const { error } = await supabase
      .from("lexicon_items")
      .delete()
      .eq("id", lexiconId);
    if (error) throw error;
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

  async getLinksForLexiconIds(
    supabase: SupabaseClient,
    lexiconIds: number[]
  ): Promise<LexiconFileLink[]> {
    const uniqueIds = Array.from(new Set(lexiconIds));
    if (uniqueIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("lexicon_files")
      .select("*")
      .in("lexicon_id", uniqueIds);
    if (error) throw error;
    return data || [];
  },
};

// =======================
// PART LIST SERVICES
// =======================
export const partListService = {
  /**
   * Get the part list from an object's metadata
   */
  getPartsList(object: ScadaObject): PartListEntry[] {
    const metadata = object.metadata as ObjectMetadata | null;
    return metadata?.parts_list || [];
  },

  /**
   * Initialize part list from linked parts (object_lexicon_links)
   * This populates the part list with all linked parts that have type='part'
   */
  async initializePartsListFromLinks(
    supabase: SupabaseClient,
    objectId: number
  ): Promise<PartListEntry[]> {
    // Get all linked lexicon items for this object
    const links = await objectLexiconService.getLexiconByObject(supabase, objectId);

    if (links.length === 0) {
      return [];
    }

    // Get the full lexicon items
    const lexiconIds = links.map((l: ObjectLexiconLink) => l.lexicon_id);
    const lexiconItems = await lexiconService.getLexiconItemsByIds(supabase, lexiconIds);

    // Filter for parts only and create part list entries
    const partsList: PartListEntry[] = lexiconItems
      .filter(item => item.type === 'part')
      .map(item => {
        const attrs = item.attributes as PartAttributes;
        return {
          lexicon_id: item.id,
          part_number: attrs.part_number,
          manufacturer: attrs.manufacturer,
          description: attrs.description,
          quantity: 1, // Default quantity
        };
      });

    return partsList;
  },

  /**
   * Update the part list in object metadata
   */
  async updatePartsList(
    supabase: SupabaseClient,
    objectId: number,
    partsList: PartListEntry[]
  ): Promise<ScadaObject> {
    // Get current object
    const currentObject = await objectService.getObject(supabase, objectId);
    if (!currentObject) {
      throw new Error(`Object ${objectId} not found`);
    }

    // Update metadata with new parts list
    const metadata: ObjectMetadata = {
      ...(currentObject.metadata as ObjectMetadata || {}),
      parts_list: partsList,
    };

    // Update the object
    return await objectService.updateObject(supabase, objectId, { metadata });
  },

  /**
   * Add a part to the parts list
   */
  async addPart(
    supabase: SupabaseClient,
    objectId: number,
    lexiconId: number,
    quantity: number = 1
  ): Promise<ScadaObject> {
    // Get the part lexicon item
    const lexiconItem = await lexiconService.getLexiconItem(supabase, lexiconId);

    if (lexiconItem.type !== 'part') {
      throw new Error('Can only add lexicon items of type "part" to parts list');
    }

    const attrs = lexiconItem.attributes as PartAttributes;

    // Get current parts list
    const currentObject = await objectService.getObject(supabase, objectId);
    if (!currentObject) {
      throw new Error(`Object ${objectId} not found`);
    }

    const currentParts = this.getPartsList(currentObject);

    // Check if part already exists
    const existingIndex = currentParts.findIndex(p => p.lexicon_id === lexiconId);

    let updatedParts: PartListEntry[];
    if (existingIndex >= 0) {
      // Update existing quantity
      updatedParts = [...currentParts];
      updatedParts[existingIndex] = {
        ...updatedParts[existingIndex],
        quantity: updatedParts[existingIndex].quantity + quantity,
      };
    } else {
      // Add new part
      const newPart: PartListEntry = {
        lexicon_id: lexiconId,
        part_number: attrs.part_number,
        manufacturer: attrs.manufacturer,
        description: attrs.description,
        quantity,
      };
      updatedParts = [...currentParts, newPart];
    }

    return await this.updatePartsList(supabase, objectId, updatedParts);
  },

  /**
   * Remove a part from the parts list
   */
  async removePart(
    supabase: SupabaseClient,
    objectId: number,
    lexiconId: number
  ): Promise<ScadaObject> {
    const currentObject = await objectService.getObject(supabase, objectId);
    if (!currentObject) {
      throw new Error(`Object ${objectId} not found`);
    }

    const currentParts = this.getPartsList(currentObject);
    const updatedParts = currentParts.filter(p => p.lexicon_id !== lexiconId);

    return await this.updatePartsList(supabase, objectId, updatedParts);
  },

  /**
   * Update the quantity of a part in the parts list
   */
  async updatePartQuantity(
    supabase: SupabaseClient,
    objectId: number,
    lexiconId: number,
    quantity: number
  ): Promise<ScadaObject> {
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    const currentObject = await objectService.getObject(supabase, objectId);
    if (!currentObject) {
      throw new Error(`Object ${objectId} not found`);
    }

    const currentParts = this.getPartsList(currentObject);
    const partIndex = currentParts.findIndex(p => p.lexicon_id === lexiconId);

    if (partIndex === -1) {
      throw new Error(`Part ${lexiconId} not found in parts list`);
    }

    const updatedParts = [...currentParts];
    updatedParts[partIndex] = {
      ...updatedParts[partIndex],
      quantity,
    };

    return await this.updatePartsList(supabase, objectId, updatedParts);
  },

  /**
   * Add a manual part (without lexicon connection) to the parts list
   */
  async addManualPart(
    supabase: SupabaseClient,
    objectId: number,
    part: Omit<PartListEntry, 'lexicon_id'>
  ): Promise<ScadaObject> {
    const currentObject = await objectService.getObject(supabase, objectId);
    if (!currentObject) {
      throw new Error(`Object ${objectId} not found`);
    }

    const currentParts = this.getPartsList(currentObject);

    const newPart: PartListEntry = {
      lexicon_id: null,
      ...part,
    };

    const updatedParts = [...currentParts, newPart];
    return await this.updatePartsList(supabase, objectId, updatedParts);
  },

  /**
   * Update a part by index (for manual parts or editing existing parts)
   */
  async updatePartByIndex(
    supabase: SupabaseClient,
    objectId: number,
    index: number,
    updatedFields: Partial<PartListEntry>
  ): Promise<ScadaObject> {
    const currentObject = await objectService.getObject(supabase, objectId);
    if (!currentObject) {
      throw new Error(`Object ${objectId} not found`);
    }

    const currentParts = this.getPartsList(currentObject);

    if (index < 0 || index >= currentParts.length) {
      throw new Error(`Invalid part index ${index}`);
    }

    const updatedParts = [...currentParts];
    updatedParts[index] = {
      ...updatedParts[index],
      ...updatedFields,
    };

    return await this.updatePartsList(supabase, objectId, updatedParts);
  },

  /**
   * Remove a part by index (for manual parts or any part)
   */
  async removePartByIndex(
    supabase: SupabaseClient,
    objectId: number,
    index: number
  ): Promise<ScadaObject> {
    const currentObject = await objectService.getObject(supabase, objectId);
    if (!currentObject) {
      throw new Error(`Object ${objectId} not found`);
    }

    const currentParts = this.getPartsList(currentObject);

    if (index < 0 || index >= currentParts.length) {
      throw new Error(`Invalid part index ${index}`);
    }

    const updatedParts = currentParts.filter((_, i) => i !== index);
    return await this.updatePartsList(supabase, objectId, updatedParts);
  },
};

// =======================
// SUBMITTAL SERVICES
// =======================

export interface SubmittalData {
  submittalObject: ScadaObject;
  project: Project;
  clientInfo: LexiconItem | null;
  selectedObjects: ScadaObject[];
  specObject: ScadaObject | null;
  billOfMaterials: BOMItem[];
  partsSheets: PartSheet[];
}

export interface BOMItem {
  lexiconItem: LexiconItem;
  quantity: number;
  objectIds: number[];
}

export interface PartSheet {
  lexiconItem: LexiconItem;
  files: FileMeta[];
}

export const submittalService = {
  /**
   * Get all objects connected to a root object via object_relations
   */
  async getConnectedObjects(
    supabase: SupabaseClient,
    rootObjectId: number
  ): Promise<ScadaObject[]> {
    // Get all relations for the root object
    const relations = await objectRelationService.getRelationsByObject(
      supabase,
      rootObjectId
    );

    // Extract unique connected object IDs
    const connectedIds = new Set<number>();
    relations.forEach((rel) => {
      if (rel.src_object_id === rootObjectId) {
        connectedIds.add(rel.dst_object_id);
      } else {
        connectedIds.add(rel.src_object_id);
      }
    });

    if (connectedIds.size === 0) {
      return [];
    }

    // Fetch all connected objects
    const { data, error } = await supabase
      .from("objects")
      .select("*")
      .in("id", Array.from(connectedIds));

    if (error) throw error;
    return data || [];
  },

  /**
   * Build bill of materials from selected objects and their lexicon items
   */
  async buildBillOfMaterials(
    supabase: SupabaseClient,
    objectIds: number[]
  ): Promise<BOMItem[]> {
    if (objectIds.length === 0) {
      return [];
    }

    // Get all lexicon links for these objects
    const links = await objectLexiconService.getLinksForObjects(
      supabase,
      objectIds
    );

    // Count quantities by lexicon item
    const lexiconCounts = new Map<number, { count: number; objectIds: number[] }>();
    links.forEach((link) => {
      const current = lexiconCounts.get(link.lexicon_id) || { count: 0, objectIds: [] };
      current.count += 1;
      current.objectIds.push(link.object_id);
      lexiconCounts.set(link.lexicon_id, current);
    });

    // Get all unique lexicon items
    const lexiconIds = Array.from(lexiconCounts.keys());
    if (lexiconIds.length === 0) {
      return [];
    }

    const lexiconItems = await lexiconService.getLexiconItemsByIds(
      supabase,
      lexiconIds
    );

    // Build BOM items
    return lexiconItems.map((item) => {
      const counts = lexiconCounts.get(item.id)!;
      return {
        lexiconItem: item,
        quantity: counts.count,
        objectIds: counts.objectIds,
      };
    });
  },

  /**
   * Get parts sheets (lexicon items of type 'part' with their files)
   */
  async getPartsSheets(
    supabase: SupabaseClient,
    objectIds: number[]
  ): Promise<PartSheet[]> {
    if (objectIds.length === 0) {
      return [];
    }

    // Get all lexicon links for these objects
    const links = await objectLexiconService.getLinksForObjects(
      supabase,
      objectIds
    );

    // Get unique lexicon IDs
    const lexiconIds = Array.from(new Set(links.map((link) => link.lexicon_id)));
    if (lexiconIds.length === 0) {
      return [];
    }

    // Get lexicon items (filter for type 'part')
    const lexiconItems = await lexiconService.getLexiconItemsByIds(
      supabase,
      lexiconIds
    );
    const partItems = lexiconItems.filter((item) => item.type === "part");

    // Get files for each part
    const partsSheets: PartSheet[] = [];
    for (const partItem of partItems) {
      const files = await lexiconFileService.getFilesForLexicon(
        supabase,
        partItem.id
      );
      partsSheets.push({
        lexiconItem: partItem,
        files,
      });
    }

    return partsSheets;
  },

  /**
   * Aggregate all data needed for submittal PDF generation
   */
  async aggregateSubmittalData(
    supabase: SupabaseClient,
    submittalObjectId: number,
    selectedObjectIds: number[],
    specObjectId: number | null
  ): Promise<SubmittalData> {
    // Get the submittal object
    const submittalObject = await objectService.getObject(
      supabase,
      submittalObjectId
    );
    if (!submittalObject) {
      throw new Error("Submittal object not found");
    }

    // Get the project
    const project = await projectService.getProjectById(
      supabase,
      submittalObject.project_id
    );
    if (!project) {
      throw new Error("Project not found");
    }

    // Get client info if available
    let clientInfo: LexiconItem | null = null;
    if (project.client_lexicon_id) {
      clientInfo = await lexiconService.getLexiconItem(
        supabase,
        project.client_lexicon_id
      );
    }

    // Get selected objects
    const { data: selectedObjects, error: objectsError } = await supabase
      .from("objects")
      .select("*")
      .in("id", selectedObjectIds);
    if (objectsError) throw objectsError;

    // Get spec object if specified
    let specObject: ScadaObject | null = null;
    if (specObjectId) {
      specObject = await objectService.getObject(supabase, specObjectId);
    }

    // Build bill of materials
    const billOfMaterials = await this.buildBillOfMaterials(
      supabase,
      selectedObjectIds
    );

    // Get parts sheets
    const partsSheets = await this.getPartsSheets(supabase, selectedObjectIds);

    return {
      submittalObject,
      project,
      clientInfo,
      selectedObjects: selectedObjects || [],
      specObject,
      billOfMaterials,
      partsSheets,
    };
  },
};
