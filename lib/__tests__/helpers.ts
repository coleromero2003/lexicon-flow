import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Helper function to generate unique test identifiers
 */
export function generateTestId(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Helper to create a test board
 */
export async function createTestBoard(
  supabase: SupabaseClient,
  userId: string,
  overrides?: Partial<{
    title: string;
    description: string | null;
    color: string;
  }>
) {
  const { data, error } = await supabase
    .from("boards")
    .insert({
      title: overrides?.title ?? "Test Board",
      description: overrides?.description ?? "A test board",
      color: overrides?.color ?? "#FF0000",
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Helper to create a test project
 */
export async function createTestProject(
  supabase: SupabaseClient,
  orgId: string,
  overrides?: Partial<{
    name: string;
    code: string | null;
    description: string | null;
    status: string;
  }>
) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      org_id: orgId,
      name: overrides?.name ?? "Test Project",
      code: overrides?.code ?? "TP",
      description: overrides?.description ?? null,
      status: overrides?.status ?? "active",
      start_date: null,
      end_date: null,
      metadata: {},
      client_lexicon_id: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Helper to create a test column
 */
export async function createTestColumn(
  supabase: SupabaseClient,
  boardId: number,
  userId: string,
  overrides?: Partial<{
    title: string;
    sort_order: number;
  }>
) {
  const { data, error } = await supabase
    .from("columns")
    .insert({
      board_id: boardId,
      title: overrides?.title ?? "Test Column",
      sort_order: overrides?.sort_order ?? 0,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Helper to create a test object
 */
export async function createTestObject(
  supabase: SupabaseClient,
  projectId: number,
  overrides?: Partial<{
    title: string;
    description_md: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    sort_order: number;
  }>
) {
  const { data, error } = await supabase
    .from("objects")
    .insert({
      project_id: projectId,
      workflow_id: null,
      step_id: null,
      title: overrides?.title ?? "Test Object",
      description_md: overrides?.description_md ?? null,
      assignee: null,
      due_date: null,
      priority: overrides?.priority ?? "low",
      sort_order: overrides?.sort_order ?? 0,
      metadata: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Helper to clean up test data
 */
export async function cleanupTestData(
  supabase: SupabaseClient,
  table: string,
  field: string,
  value: any
) {
  const { error } = await supabase.from(table).delete().eq(field, value);
  if (error) {
    console.warn(`Failed to cleanup ${table} where ${field}=${value}:`, error);
  }
}

/**
 * Helper to wait for a specified duration (useful for timestamp tests)
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to check if a table exists and has data
 */
export async function tableHasData(
  supabase: SupabaseClient,
  table: string
): Promise<boolean> {
  const { data, error } = await supabase.from(table).select("id").limit(1);

  if (error) {
    console.warn(`Error checking table ${table}:`, error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Helper to create multiple test records
 */
export async function createMultipleRecords<T>(
  supabase: SupabaseClient,
  table: string,
  records: Partial<T>[]
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .insert(records as any)
    .select();

  if (error) throw error;
  return data as T[];
}

/**
 * Assertion helper to verify Supabase timestamps
 */
export function isValidTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.getTime() > 0;
}

/**
 * Helper to verify required fields in response
 */
export function hasRequiredFields<T extends object>(
  obj: T,
  fields: (keyof T)[]
): boolean {
  return fields.every((field) => field in obj && obj[field] !== undefined);
}
