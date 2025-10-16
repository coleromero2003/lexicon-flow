# Clerk Webhook Setup for Organization Cleanup

This guide explains how to set up Clerk webhooks to automatically clean up Supabase data when an organization is deleted.

## Overview

When an organization is deleted in Clerk, all associated data in Supabase (projects, workflows, steps, objects, lexicon items, files, etc.) needs to be cleaned up. This is handled automatically via a webhook.

## Setup Steps

### 1. Get Your Webhook Endpoint URL

Your webhook endpoint is:
```
https://your-domain.com/api/webhooks/clerk
```

For local development:
```
http://localhost:3000/api/webhooks/clerk
```

**Note:** For local testing, you'll need to use a tool like [ngrok](https://ngrok.com/) or [Clerk's webhook testing](https://clerk.com/docs/integrations/webhooks/overview#testing-webhooks) to expose your local endpoint.

### 2. Create Webhook in Clerk Dashboard

1. Go to the [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **Webhooks** in the left sidebar
4. Click **Add Endpoint**
5. Enter your webhook endpoint URL
6. Subscribe to the following events:
   - ✅ `organization.deleted`
7. Click **Create**

### 3. Get Your Webhook Signing Secret

After creating the webhook:
1. Click on the webhook endpoint you just created
2. Copy the **Signing Secret** (starts with `whsec_...`)

### 4. Add Environment Variables

Add the following to your `.env.local` file:

```env
# Clerk Webhook Secret (from Clerk Dashboard -> Webhooks)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Service Role Key (from Supabase Dashboard -> Settings -> API)
# This is needed to bypass RLS when cleaning up organization data
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is different from `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Make sure you use the **service_role** key, not the anon key.

### 5. Deploy to Production

Make sure to:
1. Add the environment variables to your production environment (Vercel, etc.)
2. Update the webhook endpoint URL in Clerk Dashboard to your production URL
3. Test the webhook by deleting a test organization

## How It Works

### Webhook Flow

1. User deletes an organization in Clerk
2. Clerk sends a webhook event to `/api/webhooks/clerk`
3. Webhook verifies the signature using `CLERK_WEBHOOK_SECRET`
4. If `organization.deleted` event:
   - Connects to Supabase using service role key (bypasses RLS)
   - Calls `cleanup_organization_data(org_id)` database function
   - Function deletes all organization data with proper cascading

### Database Cleanup Function

The `cleanup_organization_data` function (in Supabase) performs the following:

1. **Deletes Projects** (which cascades to):
   - Workflows
   - Steps
   - Objects
   - Object Subtasks
   - Object Relations
   - Object Files
   - Files linked to projects

2. **Deletes Lexicon Items**
   - Parts, templates, documents, specs, clients

3. **Deletes Orphaned Files**
   - Any remaining files for the organization

### Security

- ✅ **Webhook signature verification** ensures requests are from Clerk
- ✅ **Service role key** is only used server-side, never exposed to client
- ✅ **SECURITY DEFINER** function runs with elevated privileges
- ✅ **Cascade deletes** ensure referential integrity

## Testing

### Test in Development

1. Set up ngrok or similar tunnel:
   ```bash
   ngrok http 3000
   ```

2. Update Clerk webhook endpoint to ngrok URL:
   ```
   https://your-subdomain.ngrok.io/api/webhooks/clerk
   ```

3. Create a test organization in your app
4. Delete the organization
5. Check Supabase to confirm data is deleted
6. Check your server logs for webhook events

### Test in Production

1. Create a test organization with some data
2. Delete the organization from Clerk dashboard or your app
3. Verify data is removed from Supabase
4. Check webhook logs in Clerk Dashboard

## Monitoring

### Check Webhook Logs in Clerk

1. Go to Clerk Dashboard -> Webhooks
2. Click on your webhook endpoint
3. View the **Request logs** to see:
   - Successful deliveries
   - Failed deliveries
   - Response codes
   - Retry attempts

### Check Server Logs

The webhook handler logs the following:
- `Organization deleted: {orgId}` - When event is received
- `Successfully cleaned up data for organization: {orgId}` - When cleanup succeeds
- Error messages if cleanup fails

## Troubleshooting

### Webhook Returns 400 Error

**Possible causes:**
- Missing or invalid `CLERK_WEBHOOK_SECRET`
- Signature verification failed
- Missing svix headers

**Solution:** Verify the webhook secret matches the one in Clerk Dashboard

### Webhook Returns 500 Error

**Possible causes:**
- Missing `SUPABASE_SERVICE_ROLE_KEY`
- Database function doesn't exist
- Database connection failed

**Solution:**
1. Verify Supabase environment variables
2. Check that migration was applied to remote database
3. Check Supabase logs

### Data Not Being Deleted

**Possible causes:**
- Database function not executed
- RLS policies blocking deletion (shouldn't happen with service role)
- Cascade constraints not set up

**Solution:**
1. Check webhook logs in Clerk Dashboard
2. Manually test the database function:
   ```sql
   SELECT cleanup_organization_data('test_org_id');
   ```
3. Verify foreign key constraints have `ON DELETE CASCADE`

## Additional Notes

- The cleanup is **permanent and cannot be undone**
- Make sure users are warned before deleting organizations
- Consider implementing a "soft delete" feature if you need to restore organizations
- The webhook handler returns 200 even if organization doesn't exist in Supabase (idempotent)

## Related Files

- Webhook Handler: [`/app/api/webhooks/clerk/route.ts`](app/api/webhooks/clerk/route.ts)
- Database Function: Applied via migration `add_organization_cleanup_function`
- Migration SQL: Check Supabase Dashboard -> Database -> Migrations
