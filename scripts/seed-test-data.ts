import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function seedTestData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing required environment variables');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey
  );

  const orgId = process.env.E2E_TEST_ORG_ID;

  if (!orgId) {
    console.error('Error: E2E_TEST_ORG_ID environment variable is required');
    process.exit(1);
  }

  try {
    // Create test project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'E2E Test Project',
        description: 'Project for E2E testing',
        org_id: orgId,
        status: 'active',
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      throw projectError;
    }

    console.log('✅ Created test project:', project.id);

    // Create test workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .insert({
        name: 'E2E Test Workflow',
        description: 'Test workflow for E2E testing',
        project_id: project.id,
        color: '#3b82f6',
      })
      .select()
      .single();

    if (workflowError) {
      console.error('Error creating workflow:', workflowError);
      throw workflowError;
    }

    console.log('✅ Created test workflow:', workflow.id);

    // Create test steps
    const { data: steps, error: stepsError } = await supabase
      .from('steps')
      .insert([
        { title: 'Planning', workflow_id: workflow.id, position: 0 },
        { title: 'Development', workflow_id: workflow.id, position: 1 },
        { title: 'Testing', workflow_id: workflow.id, position: 2 },
      ])
      .select();

    if (stepsError) {
      console.error('Error creating steps:', stepsError);
      throw stepsError;
    }

    console.log('✅ Created test steps:', steps.length);

    // Create test objects
    const { data: objects, error: objectsError } = await supabase
      .from('objects')
      .insert([
        {
          title: 'Test Sensor',
          description_md: 'Test sensor for E2E testing',
          project_id: project.id,
          priority: 'medium',
          sort_order: 0,
        },
        {
          title: 'Test Controller',
          description_md: 'Test controller for E2E testing',
          project_id: project.id,
          priority: 'high',
          sort_order: 1,
        },
        {
          title: 'Test Actuator',
          description_md: 'Test actuator for E2E testing',
          project_id: project.id,
          priority: 'low',
          sort_order: 2,
        },
      ])
      .select();

    if (objectsError) {
      console.error('Error creating objects:', objectsError);
      throw objectsError;
    }

    console.log('✅ Created test objects:', objects.length);

    console.log('\n🎉 Test data seeded successfully!');
    console.log('\nTest Data Summary:');
    console.log('  Project ID:', project.id);
    console.log('  Workflow ID:', workflow.id);
    console.log('  Steps:', steps.length);
    console.log('  Objects:', objects.length);

  } catch (err) {
    console.error('❌ Failed to seed test data:', err);
    process.exit(1);
  }
}

seedTestData();
