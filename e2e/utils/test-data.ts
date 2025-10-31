/**
 * Test data factories and generators
 */

export interface TestProject {
  name: string;
  description: string;
  location?: string;
  client?: string;
}

export interface TestWorkflow {
  name: string;
  description?: string;
}

export interface TestStep {
  name: string;
  description?: string;
  order?: number;
}

export interface TestObject {
  name: string;
  description?: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
}

export interface TestLexiconItem {
  name: string;
  type: 'part' | 'workflow_template' | 'step_template' | 'document' | 'spec' | 'client';
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generates a unique test project
 */
export function createTestProject(overrides?: Partial<TestProject>): TestProject {
  const timestamp = Date.now();
  return {
    name: `Test Project ${timestamp}`,
    description: `Automated test project created at ${new Date().toISOString()}`,
    location: 'Test Location',
    ...overrides,
  };
}

/**
 * Generates a unique test workflow
 */
export function createTestWorkflow(overrides?: Partial<TestWorkflow>): TestWorkflow {
  const timestamp = Date.now();
  return {
    name: `Test Workflow ${timestamp}`,
    description: `Automated test workflow created at ${new Date().toISOString()}`,
    ...overrides,
  };
}

/**
 * Generates a unique test step
 */
export function createTestStep(overrides?: Partial<TestStep>): TestStep {
  const timestamp = Date.now();
  return {
    name: `Test Step ${timestamp}`,
    description: `Automated test step created at ${new Date().toISOString()}`,
    ...overrides,
  };
}

/**
 * Generates a unique test object
 */
export function createTestObject(overrides?: Partial<TestObject>): TestObject {
  const timestamp = Date.now();
  return {
    name: `Test Object ${timestamp}`,
    description: `Automated test object created at ${new Date().toISOString()}`,
    type: 'Equipment',
    priority: 'medium',
    metadata: {},
    ...overrides,
  };
}

/**
 * Generates a unique test lexicon item
 */
export function createTestLexiconItem(
  type: TestLexiconItem['type'],
  overrides?: Partial<TestLexiconItem>
): TestLexiconItem {
  const timestamp = Date.now();
  return {
    name: `Test ${type} ${timestamp}`,
    type,
    description: `Automated test ${type} created at ${new Date().toISOString()}`,
    metadata: {},
    ...overrides,
  };
}

/**
 * Generates multiple test projects
 */
export function createTestProjects(count: number): TestProject[] {
  return Array.from({ length: count }, (_, i) =>
    createTestProject({
      name: `Test Project ${Date.now()}-${i}`,
    })
  );
}

/**
 * Generates multiple test objects
 */
export function createTestObjects(count: number): TestObject[] {
  return Array.from({ length: count }, (_, i) =>
    createTestObject({
      name: `Test Object ${Date.now()}-${i}`,
    })
  );
}

/**
 * Common test scenarios
 */
export const TEST_SCENARIOS = {
  projects: {
    small: createTestProject({ name: 'Small Project' }),
    medium: createTestProject({
      name: 'Medium Project',
      description: 'A medium-sized project with multiple workflows',
    }),
    large: createTestProject({
      name: 'Large Project',
      description: 'A large project with complex relationships',
    }),
  },
  objects: {
    sensor: createTestObject({
      name: 'Temperature Sensor',
      type: 'Sensor',
      priority: 'high',
    }),
    controller: createTestObject({
      name: 'PLC Controller',
      type: 'Controller',
      priority: 'urgent',
    }),
    actuator: createTestObject({
      name: 'Valve Actuator',
      type: 'Actuator',
      priority: 'medium',
    }),
  },
  workflows: {
    installation: createTestWorkflow({
      name: 'Installation Workflow',
      description: 'Standard installation process',
    }),
    testing: createTestWorkflow({
      name: 'Testing Workflow',
      description: 'Quality assurance and testing',
    }),
    maintenance: createTestWorkflow({
      name: 'Maintenance Workflow',
      description: 'Routine maintenance procedures',
    }),
  },
};

/**
 * Object relationship types for testing
 */
export const RELATION_TYPES = [
  'electrical_connection',
  'signals_to',
  'mechanical',
  'references',
  'contains',
  'depends_on',
] as const;

/**
 * Object priorities for testing
 */
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

/**
 * Lexicon types for testing
 */
export const LEXICON_TYPES = [
  'part',
  'workflow_template',
  'step_template',
  'document',
  'spec',
  'client',
] as const;
