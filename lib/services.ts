import {
  Board,
  Column,
  Task,
  Project,
  Workflow,
  Step,
  ScadaObject,
  LexiconItem,
  LexiconType,
} from "./supabase/models";
import { SupabaseClient } from "@supabase/supabase-js";

export const boardService = {
  async getBoard(supabase: SupabaseClient, boardId: string): Promise<Board> {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();

    if (error) throw error;

    return data;
  },

  async getBoards(supabase: SupabaseClient, userId: string): Promise<Board[]> {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  },

  async createBoard(
    supabase: SupabaseClient,
    board: Omit<Board, "id" | "created_at" | "updated_at">
  ): Promise<Board> {
    const { data, error } = await supabase
      .from("boards")
      .insert(board)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async updateBoard(
    supabase: SupabaseClient,
    boardId: string,
    updates: Partial<Board>
  ): Promise<Board> {
    const { data, error } = await supabase
      .from("boards")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", boardId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export const columnService = {
  async getColumns(
    supabase: SupabaseClient,
    boardId: string
  ): Promise<Column[]> {
    const { data, error } = await supabase
      .from("columns")
      .select("*")
      .eq("board_id", boardId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async createColumn(
    supabase: SupabaseClient,
    column: Omit<Column, "id" | "created_at">
  ): Promise<Column> {
    const { data, error } = await supabase
      .from("columns")
      .insert(column)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async updateColumnTitle(
    supabase: SupabaseClient,
    columnId: string,
    title: string
  ): Promise<Column> {
    const { data, error } = await supabase
      .from("columns")
      .update({ title })
      .eq("id", columnId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export const taskService = {
  async getTasksByBoard(
    supabase: SupabaseClient,
    boardId: string
  ): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        columns!inner(board_id)
        `
      )
      .eq("columns.board_id", boardId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async createTask(
    supabase: SupabaseClient,
    task: Omit<Task, "id" | "created_at" | "updated_at">
  ): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async moveTask(
    supabase: SupabaseClient,
    taskId: string,
    newColumnId: string,
    newOrder: number
  ) {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        column_id: newColumnId,
        sort_order: newOrder,
      })
      .eq("id", taskId);

    if (error) throw error;
    return data;
  },
};

export const boardDataService = {
  async getBoardWithColumns(supabase: SupabaseClient, boardId: string) {
    const [board, columns] = await Promise.all([
      boardService.getBoard(supabase, boardId),
      columnService.getColumns(supabase, boardId),
    ]);

    if (!board) throw new Error("Board not found");

    const tasks = await taskService.getTasksByBoard(supabase, boardId);

    const columnsWithTasks = columns.map((column) => ({
      ...column,
      tasks: tasks.filter((task) => task.column_id === column.id),
    }));

    return {
      board,
      columnsWithTasks,
    };
  },

  async createBoardWithDefaultColumns(
    supabase: SupabaseClient,
    boardData: {
      title: string;
      description?: string;
      color?: string;
      userId: string;
    }
  ) {
    const board = await boardService.createBoard(supabase, {
      title: boardData.title,
      description: boardData.description || null,
      color: boardData.color || "bg-blue-500",
      user_id: boardData.userId,
    });

    const defaultColumns = [
      { title: "To Do", sort_order: 0 },
      { title: "In Progress", sort_order: 1 },
      { title: "Review", sort_order: 2 },
      { title: "Done", sort_order: 3 },
    ];

    await Promise.all(
      defaultColumns.map((column) =>
        columnService.createColumn(supabase, {
          ...column,
          board_id: board.id,
          user_id: boardData.userId,
        })
      )
    );

    return board;
  },
};

// --- Project Services ---

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
};

// --- Workflow Services ---
export const workflowService = {
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
};

// --- Step Services ---
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
};

// --- Object Services ---
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
      .eq("workflow_id", workflowId);

    if (error) throw error;
    return data || [];
  },
};

// --- Lexicon Services ---
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

// --- Project + Client View ---
export const projectClientViewService = {
  async getProjectsWithClients(
    supabase: SupabaseClient
  ): Promise<(Project & { client_name: string | null })[]> {
    const { data, error } = await supabase
      .from("v_projects_with_client")
      .select("*");

    if (error) throw error;
    return data || [];
  },
};
