import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestSupabaseClient } from "./setup";
import {
  projectService,
  workflowService,
  stepService,
  objectService,
  objectRelationService,
  objectSubtaskService,
  fileService,
  objectFileService,
  objectLexiconService,
  lexiconService,
  lexiconFileService,
} from "../services";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("Project Services", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let createdProjectId: number;

  beforeEach(() => {
    supabase = createTestSupabaseClient();
    testOrgId = "test-org-" + Date.now();
  });

  afterEach(async () => {
    if (createdProjectId) {
      await supabase.from("projects").delete().eq("id", createdProjectId);
    }
  });

  describe("createProject", () => {
    it("should create a new project", async () => {
      const newProject = {
        org_id: testOrgId,
        name: "Test Project",
        code: "TP001",
        description: "A test project",
        status: "active",
        start_date: new Date().toISOString(),
        end_date: null,
        metadata: { key: "value" },
        client_lexicon_id: null,
      };

      const result = await projectService.createProject(supabase, newProject);
      createdProjectId = result.id;

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Project");
      expect(result.code).toBe("TP001");
      expect(result.org_id).toBe(testOrgId);
      expect(result.status).toBe("active");
    });
  });

  describe("getProjects", () => {
    beforeEach(async () => {
      const project = await projectService.createProject(supabase, {
        org_id: testOrgId,
        name: "Project 1",
        code: "P1",
        description: null,
        status: "active",
        start_date: null,
        end_date: null,
        metadata: {},
        client_lexicon_id: null,
      });
      createdProjectId = project.id;
    });

    it("should retrieve all projects", async () => {
      const projects = await projectService.getProjects(supabase);

      expect(projects).toBeDefined();
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getProjectById", () => {
    beforeEach(async () => {
      const project = await projectService.createProject(supabase, {
        org_id: testOrgId,
        name: "Specific Project",
        code: "SP",
        description: null,
        status: "active",
        start_date: null,
        end_date: null,
        metadata: {},
        client_lexicon_id: null,
      });
      createdProjectId = project.id;
    });

    it("should retrieve a specific project by ID", async () => {
      const project = await projectService.getProjectById(
        supabase,
        createdProjectId
      );

      expect(project).toBeDefined();
      expect(project.id).toBe(createdProjectId);
      expect(project.name).toBe("Specific Project");
    });

    it("should throw error when project does not exist", async () => {
      await expect(
        projectService.getProjectById(supabase, 999999)
      ).rejects.toThrow();
    });
  });
});

describe("Workflow Services", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let testProjectId: number;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    testOrgId = "test-org-" + Date.now();

    const project = await projectService.createProject(supabase, {
      org_id: testOrgId,
      name: "Test Project",
      code: "TP",
      description: null,
      status: "active",
      start_date: null,
      end_date: null,
      metadata: {},
      client_lexicon_id: null,
    });
    testProjectId = project.id;
  });

  afterEach(async () => {
    if (testProjectId) {
      await supabase.from("projects").delete().eq("id", testProjectId);
    }
  });

  describe("getWorkflowsByProject", () => {
    it("should retrieve workflows for a project", async () => {
      const workflows = await workflowService.getWorkflowsByProject(
        supabase,
        testProjectId
      );

      expect(workflows).toBeDefined();
      expect(Array.isArray(workflows)).toBe(true);
    });
  });
});

describe("Step Services", () => {
  let supabase: SupabaseClient;

  beforeEach(() => {
    supabase = createTestSupabaseClient();
  });

  describe("getStepsByWorkflow", () => {
    it("should retrieve steps for a workflow", async () => {
      // Note: This assumes a workflow ID exists or you'd need to create one
      const steps = await stepService.getStepsByWorkflow(supabase, 1);

      expect(steps).toBeDefined();
      expect(Array.isArray(steps)).toBe(true);
    });
  });
});

describe("Object Services", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let testProjectId: number;
  let createdObjectId = 0;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    testOrgId = "test-org-" + Date.now();

    const project = await projectService.createProject(supabase, {
      org_id: testOrgId,
      name: "Test Project",
      code: "TP",
      description: null,
      status: "active",
      start_date: null,
      end_date: null,
      metadata: {},
      client_lexicon_id: null,
    });
    testProjectId = project.id;
  });

  afterEach(async () => {
    if (createdObjectId) {
      await supabase.from("objects").delete().eq("id", createdObjectId);
      createdObjectId = 0;
    }
    if (testProjectId) {
      await supabase.from("projects").delete().eq("id", testProjectId);
    }
  });

  describe("createObject", () => {
    it("should create a new SCADA object", async () => {
      const newObject = {
        project_id: testProjectId,
        workflow_id: [1, 2],
        step_id: [1],
        title: "Test Object",
        description_md: "# Test Description",
        assignee: null,
        due_date: null,
        priority: "medium" as const,
        sort_order: 0,
        metadata: { type: "sensor" },
      };

      const result = await objectService.createObject(supabase, newObject);
      createdObjectId = result.id;

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Object");
      expect(result.project_id).toBe(testProjectId);
      expect(result.priority).toBe("medium");
    });
  });

  describe("getObjectsByProject", () => {
    beforeEach(async () => {
      const obj = await objectService.createObject(supabase, {
        project_id: testProjectId,
        workflow_id: null,
        step_id: null,
        title: "Project Object",
        description_md: null,
        assignee: null,
        due_date: null,
        priority: "low",
        sort_order: 0,
        metadata: null,
      });
      createdObjectId = obj.id;
    });

    it("should retrieve all objects for a project", async () => {
      const objects = await objectService.getObjectsByProject(
        supabase,
        testProjectId
      );

      expect(objects).toBeDefined();
      expect(objects.length).toBeGreaterThanOrEqual(1);
      expect(objects[0].project_id).toBe(testProjectId);
    });
  });

  describe("getObjectsByWorkflow", () => {
    it("should retrieve objects associated with a workflow", async () => {
      const objects = await objectService.getObjectsByWorkflow(supabase, 1);

      expect(objects).toBeDefined();
      expect(Array.isArray(objects)).toBe(true);
    });
  });

  describe("getObjectById", () => {
    beforeEach(async () => {
      const obj = await objectService.createObject(supabase, {
        project_id: testProjectId,
        workflow_id: null,
        step_id: null,
        title: "Single Object",
        description_md: null,
        assignee: null,
        due_date: null,
        priority: "medium",
        sort_order: 0,
        metadata: null,
      });
      createdObjectId = obj.id;
    });

    it("should return an object when it exists", async () => {
      const obj = await objectService.getObjectById(
        supabase,
        createdObjectId
      );

      expect(obj).toBeDefined();
      expect(obj?.id).toBe(createdObjectId);
      expect(obj?.title).toBe("Single Object");
    });

    it("should return null when object is missing", async () => {
      const obj = await objectService.getObjectById(supabase, 999999);
      expect(obj).toBeNull();
    });
  });

  describe("getObjectsByIds", () => {
    let secondObjectId = 0;

    beforeEach(async () => {
      const obj = await objectService.createObject(supabase, {
        project_id: testProjectId,
        workflow_id: null,
        step_id: null,
        title: "Batch Object",
        description_md: null,
        assignee: null,
        due_date: null,
        priority: "low",
        sort_order: 1,
        metadata: null,
      });
      createdObjectId = obj.id;

      const obj2 = await objectService.createObject(supabase, {
        project_id: testProjectId,
        workflow_id: null,
        step_id: null,
        title: "Batch Object 2",
        description_md: null,
        assignee: null,
        due_date: null,
        priority: "low",
        sort_order: 2,
        metadata: null,
      });
      secondObjectId = obj2.id;
    });

    afterEach(async () => {
      if (secondObjectId) {
        await supabase.from("objects").delete().eq("id", secondObjectId);
        secondObjectId = 0;
      }
    });

    it("should return all objects matching provided IDs", async () => {
      const results = await objectService.getObjectsByIds(supabase, [
        createdObjectId,
        secondObjectId,
      ]);

      const ids = results.map((obj) => obj.id);
      expect(ids).toContain(createdObjectId);
      expect(ids).toContain(secondObjectId);
    });

    it("should return empty array when ids list empty", async () => {
      const results = await objectService.getObjectsByIds(supabase, []);
      expect(results).toEqual([]);
    });
  });
});

describe("Object Relation Services", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let testProjectId: number;
  let testObject1Id: number;
  let testObject2Id: number;
  let createdRelationId: number;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    testOrgId = "test-org-" + Date.now();

    const project = await projectService.createProject(supabase, {
      org_id: testOrgId,
      name: "Test Project",
      code: "TP",
      description: null,
      status: "active",
      start_date: null,
      end_date: null,
      metadata: {},
      client_lexicon_id: null,
    });
    testProjectId = project.id;

    const obj1 = await objectService.createObject(supabase, {
      project_id: testProjectId,
      workflow_id: null,
      step_id: null,
      title: "Object 1",
      description_md: null,
      assignee: null,
      due_date: null,
      priority: "low",
      sort_order: 0,
      metadata: null,
    });
    testObject1Id = obj1.id;

    const obj2 = await objectService.createObject(supabase, {
      project_id: testProjectId,
      workflow_id: null,
      step_id: null,
      title: "Object 2",
      description_md: null,
      assignee: null,
      due_date: null,
      priority: "low",
      sort_order: 1,
      metadata: null,
    });
    testObject2Id = obj2.id;
  });

  afterEach(async () => {
    if (createdRelationId) {
      await supabase
        .from("object_relations")
        .delete()
        .eq("id", createdRelationId);
    }
    if (testObject1Id) {
      await supabase.from("objects").delete().eq("id", testObject1Id);
    }
    if (testObject2Id) {
      await supabase.from("objects").delete().eq("id", testObject2Id);
    }
    if (testProjectId) {
      await supabase.from("projects").delete().eq("id", testProjectId);
    }
  });

  describe("createRelation", () => {
    it("should create a relation between two objects", async () => {
      const newRelation = {
        relation_kind: "signals_to" as const,
        src_object_id: testObject1Id,
        dst_object_id: testObject2Id,
      };

      const result = await objectRelationService.createRelation(
        supabase,
        newRelation
      );
      createdRelationId = result.id;

      expect(result).toBeDefined();
      expect(result.relation_kind).toBe("signals_to");
      expect(result.src_object_id).toBe(testObject1Id);
      expect(result.dst_object_id).toBe(testObject2Id);
    });
  });

  describe("getRelationsByObject", () => {
    beforeEach(async () => {
      const relation = await objectRelationService.createRelation(supabase, {
        relation_kind: "electrical_connection",
        src_object_id: testObject1Id,
        dst_object_id: testObject2Id,
      });
      createdRelationId = relation.id;
    });

    it("should retrieve all relations for an object", async () => {
      const relations = await objectRelationService.getRelationsByObject(
        supabase,
        testObject1Id
      );

      expect(relations).toBeDefined();
      expect(relations.length).toBeGreaterThanOrEqual(1);
      expect(
        relations.some((r) => r.src_object_id === testObject1Id)
      ).toBe(true);
    });
  });
});

describe("Object Subtask Services", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let testProjectId: number;
  let testObjectId: number;
  let createdSubtaskId: number;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    testOrgId = "test-org-" + Date.now();

    const project = await projectService.createProject(supabase, {
      org_id: testOrgId,
      name: "Test Project",
      code: "TP",
      description: null,
      status: "active",
      start_date: null,
      end_date: null,
      metadata: {},
      client_lexicon_id: null,
    });
    testProjectId = project.id;

    const obj = await objectService.createObject(supabase, {
      project_id: testProjectId,
      workflow_id: null,
      step_id: null,
      title: "Test Object",
      description_md: null,
      assignee: null,
      due_date: null,
      priority: "low",
      sort_order: 0,
      metadata: null,
    });
    testObjectId = obj.id;
  });

  afterEach(async () => {
    if (createdSubtaskId) {
      await supabase
        .from("object_subtasks")
        .delete()
        .eq("id", createdSubtaskId);
    }
    if (testObjectId) {
      await supabase.from("objects").delete().eq("id", testObjectId);
    }
    if (testProjectId) {
      await supabase.from("projects").delete().eq("id", testProjectId);
    }
  });

  describe("createSubtask", () => {
    it("should create a subtask for an object", async () => {
      const newSubtask = {
        object_id: testObjectId,
        title: "Test Subtask",
        is_done: false,
        sort_order: 0,
      };

      const result = await objectSubtaskService.createSubtask(
        supabase,
        newSubtask
      );
      createdSubtaskId = result.id;

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Subtask");
      expect(result.object_id).toBe(testObjectId);
      expect(result.is_done).toBe(false);
    });
  });

  describe("getSubtasks", () => {
    beforeEach(async () => {
      const subtask = await objectSubtaskService.createSubtask(supabase, {
        object_id: testObjectId,
        title: "Subtask 1",
        is_done: false,
        sort_order: 0,
      });
      createdSubtaskId = subtask.id;
    });

    it("should retrieve all subtasks for an object", async () => {
      const subtasks = await objectSubtaskService.getSubtasks(
        supabase,
        testObjectId
      );

      expect(subtasks).toBeDefined();
      expect(subtasks.length).toBeGreaterThanOrEqual(1);
      expect(subtasks[0].object_id).toBe(testObjectId);
    });
  });
});

describe("Lexicon Services", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let createdLexiconId: number;

  beforeEach(() => {
    supabase = createTestSupabaseClient();
    testOrgId = "test-org-" + Date.now();
  });

  afterEach(async () => {
    if (createdLexiconId) {
      await supabase
        .from("lexicon_items")
        .delete()
        .eq("id", createdLexiconId);
    }
  });

  describe("createLexiconItem", () => {
    it("should create a new lexicon item", async () => {
      const newItem = {
        org_id: testOrgId,
        type: "part" as const,
        name: "Test Part",
        sku: "TP001",
        manufacturer: "Test Mfg",
        attributes: { voltage: "24V" },
        version: 1,
      };

      const result = await lexiconService.createLexiconItem(supabase, newItem);
      createdLexiconId = result.id;

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Part");
      expect(result.type).toBe("part");
      expect(result.sku).toBe("TP001");
      expect(result.manufacturer).toBe("Test Mfg");
    });
  });

  describe("getLexiconItemsByType", () => {
    beforeEach(async () => {
      const item = await lexiconService.createLexiconItem(supabase, {
        org_id: testOrgId,
        type: "spec",
        name: "Test Spec",
        sku: null,
        manufacturer: null,
        attributes: {},
        version: 1,
      });
      createdLexiconId = item.id;
    });

    it("should retrieve lexicon items by type", async () => {
      const items = await lexiconService.getLexiconItemsByType(
        supabase,
        testOrgId,
        "spec"
      );

      expect(items).toBeDefined();
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items.every((item) => item.type === "spec")).toBe(true);
      expect(items.every((item) => item.org_id === testOrgId)).toBe(true);
    });
  });
});

describe("File Services", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let testProjectId: number;
  let createdFileId: number;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    testOrgId = "test-org-" + Date.now();

    const project = await projectService.createProject(supabase, {
      org_id: testOrgId,
      name: "Test Project",
      code: "TP",
      description: null,
      status: "active",
      start_date: null,
      end_date: null,
      metadata: {},
      client_lexicon_id: null,
    });
    testProjectId = project.id;
  });

  afterEach(async () => {
    if (createdFileId) {
      await supabase.from("files").delete().eq("id", createdFileId);
    }
    if (testProjectId) {
      await supabase.from("projects").delete().eq("id", testProjectId);
    }
  });

  describe("uploadFileMeta", () => {
    it("should upload file metadata", async () => {
      const fileMeta = {
        uploaded_by: "test-user",
        org_id: testOrgId,
        project_id: testProjectId,
        storage_key: "test/file.pdf",
        filename: "file.pdf",
        mime_type: "application/pdf",
        size_bytes: 1024,
        sha256: "abc123",
      };

      const result = await fileService.uploadFileMeta(supabase, fileMeta);
      createdFileId = result.id;

      expect(result).toBeDefined();
      expect(result.filename).toBe("file.pdf");
      expect(result.storage_key).toBe("test/file.pdf");
      expect(result.project_id).toBe(testProjectId);
    });
  });

  describe("getFilesByProject", () => {
    beforeEach(async () => {
      const file = await fileService.uploadFileMeta(supabase, {
        uploaded_by: "test-user",
        org_id: testOrgId,
        project_id: testProjectId,
        storage_key: "test/doc.pdf",
        filename: "doc.pdf",
        mime_type: "application/pdf",
        size_bytes: 2048,
        sha256: "def456",
      });
      createdFileId = file.id;
    });

    it("should retrieve all files for a project", async () => {
      const files = await fileService.getFilesByProject(
        supabase,
        testProjectId
      );

      expect(files).toBeDefined();
      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files[0].project_id).toBe(testProjectId);
    });
  });
});

describe("Object-File Link Services", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let testProjectId: number;
  let testObjectId: number;
  let testFileId: number;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    testOrgId = "test-org-" + Date.now();

    const project = await projectService.createProject(supabase, {
      org_id: testOrgId,
      name: "Test Project",
      code: "TP",
      description: null,
      status: "active",
      start_date: null,
      end_date: null,
      metadata: {},
      client_lexicon_id: null,
    });
    testProjectId = project.id;

    const obj = await objectService.createObject(supabase, {
      project_id: testProjectId,
      workflow_id: null,
      step_id: null,
      title: "Test Object",
      description_md: null,
      assignee: null,
      due_date: null,
      priority: "low",
      sort_order: 0,
      metadata: null,
    });
    testObjectId = obj.id;

    const file = await fileService.uploadFileMeta(supabase, {
      uploaded_by: "test-user",
      org_id: testOrgId,
      project_id: testProjectId,
      storage_key: "test/file.pdf",
      filename: "file.pdf",
      mime_type: "application/pdf",
      size_bytes: 1024,
      sha256: "abc123",
    });
    testFileId = file.id;
  });

  afterEach(async () => {
    await supabase
      .from("object_files")
      .delete()
      .eq("object_id", testObjectId);
    if (testFileId) {
      await supabase.from("files").delete().eq("id", testFileId);
    }
    if (testObjectId) {
      await supabase.from("objects").delete().eq("id", testObjectId);
    }
    if (testProjectId) {
      await supabase.from("projects").delete().eq("id", testProjectId);
    }
  });

  describe("linkFileToObject", () => {
    it("should link a file to an object", async () => {
      const link = {
        object_id: testObjectId,
        file_id: testFileId,
      };

      await expect(
        objectFileService.linkFileToObject(supabase, link)
      ).resolves.not.toThrow();
    });
  });

  describe("getFilesForObject", () => {
    beforeEach(async () => {
      await objectFileService.linkFileToObject(supabase, {
        object_id: testObjectId,
        file_id: testFileId,
      });
    });

    it("should retrieve all files linked to an object", async () => {
      const files = await objectFileService.getFilesForObject(
        supabase,
        testObjectId
      );

      expect(files).toBeDefined();
      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files[0].id).toBe(testFileId);
    });
  });
});

describe("Object-Lexicon Link Services", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let testProjectId: number;
  let testObjectId: number;
  let testLexiconId: number;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    testOrgId = "test-org-" + Date.now();

    const project = await projectService.createProject(supabase, {
      org_id: testOrgId,
      name: "Test Project",
      code: "TP",
      description: null,
      status: "active",
      start_date: null,
      end_date: null,
      metadata: {},
      client_lexicon_id: null,
    });
    testProjectId = project.id;

    const obj = await objectService.createObject(supabase, {
      project_id: testProjectId,
      workflow_id: null,
      step_id: null,
      title: "Test Object",
      description_md: null,
      assignee: null,
      due_date: null,
      priority: "low",
      sort_order: 0,
      metadata: null,
    });
    testObjectId = obj.id;

    const lexicon = await lexiconService.createLexiconItem(supabase, {
      org_id: testOrgId,
      type: "part",
      name: "Test Part",
      sku: "TP001",
      manufacturer: null,
      attributes: {},
      version: 1,
    });
    testLexiconId = lexicon.id;
  });

  afterEach(async () => {
    await supabase
      .from("object_lexicon_links")
      .delete()
      .eq("object_id", testObjectId);
    if (testLexiconId) {
      await supabase.from("lexicon_items").delete().eq("id", testLexiconId);
    }
    if (testObjectId) {
      await supabase.from("objects").delete().eq("id", testObjectId);
    }
    if (testProjectId) {
      await supabase.from("projects").delete().eq("id", testProjectId);
    }
  });

  describe("linkLexiconItem", () => {
    it("should link a lexicon item to an object", async () => {
      const link = {
        object_id: testObjectId,
        lexicon_id: testLexiconId,
        note: "Test note",
      };

      await expect(
        objectLexiconService.linkLexiconItem(supabase, link)
      ).resolves.not.toThrow();
    });
  });

  describe("getLexiconForObject", () => {
    beforeEach(async () => {
      await objectLexiconService.linkLexiconItem(supabase, {
        object_id: testObjectId,
        lexicon_id: testLexiconId,
        note: "Test note",
      });
    });

    it("should retrieve all lexicon items linked to an object", async () => {
      const items = await objectLexiconService.getLexiconForObject(
        supabase,
        testObjectId
      );

      expect(items).toBeDefined();
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items[0].id).toBe(testLexiconId);
    });
  });
});

describe("Lexicon-File Link Services", () => {
  let supabase: SupabaseClient;
  let testOrgId: string;
  let testProjectId: number;
  let testLexiconId: number;
  let testFileId: number;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    testOrgId = "test-org-" + Date.now();

    const project = await projectService.createProject(supabase, {
      org_id: testOrgId,
      name: "Test Project",
      code: "TP",
      description: null,
      status: "active",
      start_date: null,
      end_date: null,
      metadata: {},
      client_lexicon_id: null,
    });
    testProjectId = project.id;

    const lexicon = await lexiconService.createLexiconItem(supabase, {
      org_id: testOrgId,
      type: "document",
      name: "Test Doc",
      sku: null,
      manufacturer: null,
      attributes: {},
      version: 1,
    });
    testLexiconId = lexicon.id;

    const file = await fileService.uploadFileMeta(supabase, {
      uploaded_by: "test-user",
      org_id: testOrgId,
      project_id: testProjectId,
      storage_key: "test/doc.pdf",
      filename: "doc.pdf",
      mime_type: "application/pdf",
      size_bytes: 2048,
      sha256: "def456",
    });
    testFileId = file.id;
  });

  afterEach(async () => {
    await supabase
      .from("lexicon_files")
      .delete()
      .eq("lexicon_id", testLexiconId);
    if (testFileId) {
      await supabase.from("files").delete().eq("id", testFileId);
    }
    if (testLexiconId) {
      await supabase.from("lexicon_items").delete().eq("id", testLexiconId);
    }
    if (testProjectId) {
      await supabase.from("projects").delete().eq("id", testProjectId);
    }
  });

  describe("linkFileToLexicon", () => {
    it("should link a file to a lexicon item", async () => {
      const link = {
        lexicon_id: testLexiconId,
        file_id: testFileId,
      };

      await expect(
        lexiconFileService.linkFileToLexicon(supabase, link)
      ).resolves.not.toThrow();
    });
  });

  describe("getFilesForLexicon", () => {
    beforeEach(async () => {
      await lexiconFileService.linkFileToLexicon(supabase, {
        lexicon_id: testLexiconId,
        file_id: testFileId,
      });
    });

    it("should retrieve all files linked to a lexicon item", async () => {
      const files = await lexiconFileService.getFilesForLexicon(
        supabase,
        testLexiconId
      );

      expect(files).toBeDefined();
      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files[0].id).toBe(testFileId);
    });
  });
});
