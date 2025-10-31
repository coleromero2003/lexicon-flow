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
    console.log('🧹 Starting cleanup of test data...\n');

    // Delete all test projects (cascades to workflows, steps, and objects due to FK constraints)
    const { data: deletedProjects, error: projectError } = await supabase
      .from('projects')
      .delete()
      .ilike('name', '%E2E Test%')
      .select();

    if (projectError) {
      console.error('Error cleaning up projects:', projectError);
      throw projectError;
    }

    const projectCount = deletedProjects?.length || 0;
    console.log(`✅ Cleaned up ${projectCount} test project(s)`);

    if (projectCount > 0) {
      console.log('   (Related workflows, steps, and objects were automatically deleted via CASCADE)');
    }

    // Verify cleanup by checking for orphaned test data
    const { data: orphanedWorkflows } = await supabase
      .from('workflows')
      .select('id')
      .ilike('name', '%E2E Test%');

    const { data: orphanedObjects } = await supabase
      .from('objects')
      .select('id')
      .ilike('title', '%Test %');

    if (orphanedWorkflows && orphanedWorkflows.length > 0) {
      console.warn(`⚠️  Found ${orphanedWorkflows.length} orphaned test workflows - cleaning up...`);
      await supabase
        .from('workflows')
        .delete()
        .ilike('name', '%E2E Test%');
    }

    if (orphanedObjects && orphanedObjects.length > 0) {
      console.warn(`⚠️  Found ${orphanedObjects.length} orphaned test objects - cleaning up...`);
      await supabase
        .from('objects')
        .delete()
        .ilike('title', '%Test %');
    }

    console.log('\n🎉 Test data cleanup completed successfully!');

  } catch (err) {
    console.error('❌ Failed to cleanup test data:', err);
    process.exit(1);
  }
}

cleanupTestData();
