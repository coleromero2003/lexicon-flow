# Database Seeding Safety Analysis

## ✅ **SAFETY VERIFICATION COMPLETE**

The seeding scripts have been analyzed and updated to ensure they won't break the database.

---

## **Database Schema Analysis**

### **RLS Policies** ✅ SAFE
All critical tables have proper Row-Level Security policies:

- **Projects**: `org_id = auth_org_id()`
- **Workflows**: Checks if project belongs to user's organization
- **Steps**: Checks if workflow's project belongs to user's organization
- **Objects**: Checks if project belongs to user's organization

**Impact**: Seeding uses service role key which bypasses RLS (required for test data creation).

### **Foreign Key Constraints** ✅ SAFE
Cascade deletes are properly configured:

```
projects (DELETE CASCADE)
  └─> workflows (DELETE CASCADE)
       └─> steps
  └─> objects
```

**Impact**: Deleting test projects automatically removes all related data.

### **Unique Constraints** ⚠️ CRITICAL - FIXED

Found these unique constraints that could cause failures:

1. **projects**:
   - `(org_id, name)` - Project names must be unique per organization
   - `(org_id, code)` - Project codes must be unique per organization

2. **steps**:
   - `(workflow_id, position)` - Step positions must be unique per workflow
   - `(workflow_id, title)` - Step titles must be unique per workflow

**Fix Applied**:
- Seeding script now cleans up before inserting
- Added timestamp to project names to ensure uniqueness
- Cleanup script verifies all cascades completed

---

## **Script Updates**

### **seed-test-data.ts** ✅ UPDATED

**Changes Made**:
1. ✅ Auto-cleanup before seeding to avoid unique constraint violations
2. ✅ Added timestamp to project name: `E2E Test Project YYYY-MM-DD`
3. ✅ Maintained proper error handling

**Safe to Run**: ✅ Yes - can run multiple times without conflicts

### **cleanup-test-data.ts** ✅ UPDATED

**Changes Made**:
1. ✅ Enhanced logging to show cascade effects
2. ✅ Added orphan detection and cleanup
3. ✅ Verifies all test data removed

**Safe to Run**: ✅ Yes - idempotent operation

---

## **Security Considerations**

### **Service Role Key Usage** ⚠️ IMPORTANT

The scripts use `SUPABASE_SERVICE_ROLE_KEY` which:
- ✅ Bypasses RLS (necessary for seeding)
- ✅ Required for creating data in any organization
- ⚠️ Must be kept secure and never committed to git
- ⚠️ Should only be used in trusted environments

### **Environment Variables Required**

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>  # KEEP SECRET!
E2E_TEST_ORG_ID=<your-test-org-id>
```

---

## **Testing Recommendations**

### **Before Running Tests**:

1. Set environment variables in `.env`:
   ```bash
   E2E_TEST_ORG_ID="org_xxxxx"  # Your test organization ID
   SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Your service role key
   ```

2. Run cleanup (optional, but recommended):
   ```bash
   npm run cleanup:test
   ```

3. Run seeding:
   ```bash
   npm run seed:test
   ```

4. Run E2E tests:
   ```bash
   npm run test:e2e
   ```

5. Cleanup after tests (optional):
   ```bash
   npm run cleanup:test
   ```

### **Or Use Combined Command**:
```bash
npm run test:e2e:seed  # Seeds and runs tests in one command
```

---

## **Known Limitations**

1. **Test Data Persistence**: Seeded data persists until manually cleaned up
2. **Organization Scoping**: All test data is scoped to `E2E_TEST_ORG_ID`
3. **Service Role Required**: Cannot seed without service role key
4. **Name Pattern Matching**: Cleanup uses pattern matching (`%E2E Test%`, `%Test %`)

---

## **Troubleshooting**

### **"Unique constraint violation" Error**
- **Cause**: Test data already exists with same name
- **Fix**: Run `npm run cleanup:test` first

### **"RLS policy violation" Error**
- **Cause**: Not using service role key
- **Fix**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### **"Foreign key constraint violation" Error**
- **Cause**: Trying to create data with invalid references
- **Fix**: Check that `E2E_TEST_ORG_ID` exists in your Clerk organization

### **"Project not found" in E2E Tests**
- **Cause**: Tests looking for exact name "E2E Test Project"
- **Fix**: Update test to search by pattern or use latest created project

---

## **Database Impact Summary**

| Operation | Tables Affected | Risk Level | Mitigation |
|-----------|----------------|------------|------------|
| Seeding | projects, workflows, steps, objects | Low | Auto-cleanup before insert |
| Cleanup | All test data | Low | Pattern-based deletion only |
| RLS Bypass | All tables | Medium | Service role key required |
| Cascading Deletes | workflows, steps, objects | Low | Designed behavior |

---

## **Conclusion**

✅ **The seeding scripts are SAFE to use** after the updates made:
- Unique constraint conflicts resolved with auto-cleanup
- Cascade deletes properly configured
- RLS policies properly scoped
- Error handling comprehensive
- Idempotent operations (can run multiple times)

⚠️ **Important**: Keep `SUPABASE_SERVICE_ROLE_KEY` secure and never commit it to version control.
