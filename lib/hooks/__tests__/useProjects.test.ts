import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "../../supabase/models";

let mockOrganization: { id: string } | null = { id: "org_123" };
let mockSupabaseClient: any = {};

const {
  getProjectsMock,
  createProjectMock,
  updateProjectMock,
  deleteProjectMock,
  createWorkflowMock,
  createStepMock,
} = vi.hoisted(() => ({
  getProjectsMock: vi.fn(),
  createProjectMock: vi.fn(),
  updateProjectMock: vi.fn(),
  deleteProjectMock: vi.fn(),
  createWorkflowMock: vi.fn(),
  createStepMock: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useOrganization: () => ({
    organization: mockOrganization,
  }),
}));

vi.mock("../../supabase/SupabaseProvider", () => ({
  useSupabase: () => ({
    supabase: mockSupabaseClient,
  }),
}));

vi.mock("../../services", () => ({
  projectService: {
    getProjects: getProjectsMock,
    createProject: createProjectMock,
    updateProject: updateProjectMock,
    deleteProject: deleteProjectMock,
  },
  workflowService: {
    createWorkflow: createWorkflowMock,
  },
  stepService: {
    createStep: createStepMock,
  },
}));

import { useProjects } from "../useProjects";

describe("useProjects", () => {
  let workflowIdCounter = 1;

  beforeEach(() => {
    mockOrganization = { id: "org_123" };
    mockSupabaseClient = { client: "supabase" };
    workflowIdCounter = 1;

    getProjectsMock.mockReset();
    createProjectMock.mockReset();
    updateProjectMock.mockReset();
    deleteProjectMock.mockReset();
    createWorkflowMock.mockReset();
    createStepMock.mockReset();

    getProjectsMock.mockResolvedValue([]);
    createWorkflowMock.mockImplementation(async (_client, data) => ({
      id: workflowIdCounter++,
      ...data,
    }));
    createStepMock.mockImplementation(async (_client, data) => ({
      id: `${data.workflow_id}-${data.position}`,
      ...data,
    }));
  });

  it("loadProjects populates state", async () => {
    const projects: Project[] = [
      {
        id: 1,
        name: "Alpha",
        org_id: "org_123",
        description: null,
        status: "active",
        code: null,
        start_date: null,
        end_date: null,
        metadata: {},
        created_at: "",
        updated_at: "",
        client_lexicon_id: null,
      },
      {
        id: 2,
        name: "Beta",
        org_id: "org_123",
        description: null,
        status: "active",
        code: null,
        start_date: null,
        end_date: null,
        metadata: {},
        created_at: "",
        updated_at: "",
        client_lexicon_id: null,
      },
    ];

    getProjectsMock.mockResolvedValueOnce(projects);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getProjectsMock).toHaveBeenCalledWith(mockSupabaseClient);
    expect(result.current.projects).toEqual(projects);
    expect(result.current.error).toBeNull();
  });

  it("createProject calls services and prepends the project", async () => {
    const existingProject: Project = {
      id: 5,
      name: "Existing",
      org_id: "org_123",
      description: null,
      status: "active",
      code: null,
      start_date: null,
      end_date: null,
      metadata: {},
      created_at: "",
      updated_at: "",
      client_lexicon_id: null,
    };

    const newProject: Project = {
      ...existingProject,
      id: 10,
      name: "New Project",
    };

    getProjectsMock.mockResolvedValueOnce([existingProject]);
    createProjectMock.mockResolvedValueOnce(newProject);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createProject({ name: "New Project" });
    });

    expect(createProjectMock).toHaveBeenCalledWith(
      mockSupabaseClient,
      expect.objectContaining({
        name: "New Project",
        org_id: "org_123",
      })
    );
    expect(createWorkflowMock).toHaveBeenCalledTimes(3);
    expect(createWorkflowMock.mock.calls.every((call) => call[0] === mockSupabaseClient)).toBe(true);
    expect(createStepMock).toHaveBeenCalledTimes(16);
    expect(createStepMock.mock.calls.every((call) => call[0] === mockSupabaseClient)).toBe(true);
    expect(result.current.projects).toEqual([newProject, existingProject]);
  });

  it("updateProject replaces the matching entry", async () => {
    const project: Project = {
      id: 42,
      name: "Project",
      org_id: "org_123",
      description: null,
      status: "active",
      code: null,
      start_date: null,
      end_date: null,
      metadata: {},
      created_at: "",
      updated_at: "",
      client_lexicon_id: null,
    };

    const updated: Project = { ...project, name: "Updated" };

    getProjectsMock.mockResolvedValueOnce([project]);
    updateProjectMock.mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateProject(project.id, { name: "Updated" });
    });

    expect(updateProjectMock).toHaveBeenCalledWith(
      mockSupabaseClient,
      project.id,
      { name: "Updated" }
    );
    expect(result.current.projects).toEqual([updated]);
  });

  it("deleteProject removes the entry", async () => {
    const project: Project = {
      id: 9,
      name: "Removable",
      org_id: "org_123",
      description: null,
      status: "active",
      code: null,
      start_date: null,
      end_date: null,
      metadata: {},
      created_at: "",
      updated_at: "",
      client_lexicon_id: null,
    };

    getProjectsMock.mockResolvedValueOnce([project]);
    deleteProjectMock.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteProject(project.id);
    });

    expect(deleteProjectMock).toHaveBeenCalledWith(
      mockSupabaseClient,
      project.id
    );
    expect(result.current.projects).toEqual([]);
  });

  it("createProject throws when organization is missing", async () => {
    mockOrganization = null;

    const { result } = renderHook(() => useProjects());

    await expect(
      result.current.createProject({ name: "Should Fail" })
    ).rejects.toThrow("Organization not found");
  });

  it("createProject throws when Supabase client is missing", async () => {
    mockSupabaseClient = null;

    const { result } = renderHook(() => useProjects());

    await expect(
      result.current.createProject({ name: "Should Fail" })
    ).rejects.toThrow("Supabase client not initialized");
  });
});
