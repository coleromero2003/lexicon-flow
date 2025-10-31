import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function cleanupTestData() {
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

  try {
    // Delete all test projects (cascades to workflows, objects, etc.)
    const { data: deletedProjects, error: projectError } = await supabase
      .from('projects')
      .delete()
      .ilike('name', '%E2E Test%')
      .select();

    if (projectError) {
      console.error('Error cleaning up projects:', projectError);
      throw projectError;
    }

    console.log('✅ Cleaned up test projects:', deletedProjects?.length || 0);

    // Delete test workflows (in case they weren't cascaded)
    const { data: deletedWorkflows, error: workflowError } = await supabase
      .from('workflows')
      .delete()
      .ilike('name', '%E2E Test%')
      .select();

    if (workflowError && workflowError.code !== 'PGRST116') {
      console.error('Error cleaning up workflows:', workflowError);
    } else {
      console.log('✅ Cleaned up test workflows:', deletedWorkflows?.length || 0);
    }

    // Delete test objects (in case they weren't cascaded)
    const { data: deletedObjects, error: objectError } = await supabase
      .from('objects')
      .delete()
      .ilike('title', '%Test %')
      .select();

    if (objectError && objectError.code !== 'PGRST116') {
      console.error('Error cleaning up objects:', objectError);
    } else {
      console.log('✅ Cleaned up test objects:', deletedObjects?.length || 0);
    }

    console.log('\n🎉 Test data cleaned up successfully!');

  } catch (err) {
    console.error('❌ Failed to cleanup test data:', err);
    process.exit(1);
  }
}

cleanupTestData();
