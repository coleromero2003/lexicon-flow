# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lexicon Flow is a comprehensive SCADA (Supervisory Control and Data Acquisition) project management application built with Next.js 15, Supabase, and Clerk authentication. The app supports real-time collaboration, organizational workflows, and complex object relationship management for industrial control systems.

**Key Technologies:**
- Next.js 15 with App Router and React 19
- Supabase for database, authentication, and storage
- Clerk for advanced authentication and organization management
- Sentry for error monitoring and performance tracking
- Vitest for testing
- TailwindCSS 4 for styling
- Shadcn UI components for unified design

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Testing
```bash
npm test             # Run tests in watch mode
npm run test:ui      # Run tests with Vitest UI
npm run test:run     # Run tests once (CI mode)
npm run test:coverage # Run tests with coverage report
```

### Local Supabase
```bash
supabase start       # Start local Supabase instance
supabase db push     # Push migrations to local database
supabase stop        # Stop local Supabase instance
```

## Architecture

### Directory Structure

- **`app/`** - Next.js App Router pages and layouts
  - `dashboard/page.tsx` - User dashboard
  - `projects/[id]/page.tsx` - Project detail view
  - `workflows/[id]/page.tsx` - Workflow management
  - `organization/page.tsx` - Organization management
  - `pricing/page.tsx` - Subscription pricing page
  - `legal/` - Legal documents (terms, privacy, etc.)

- **`lib/`** - Core business logic and utilities
  - `services.ts` - Supabase service layer for all database operations
  - `supabase/models.ts` - TypeScript type definitions for database entities
  - `supabase/server.ts` - Server-side Supabase client factory
  - `supabase/SupabaseProvider.tsx` - Client-side Supabase context provider
  - `hooks/useProjects.ts` - React hooks for project management
  - `hooks/useWorkflows.ts` - React hooks for workflow management
  - `contexts/PlanContext.tsx` - Subscription plan context
  - `sentry.ts` - Sentry utility functions for error tracking and monitoring

- **`components/`** - Reusable UI components
  - `ui/` - shadcn/ui components (button, dialog, input, etc.)
  - `navbar.tsx` - Navigation bar component
  - `cookie-notice.tsx` - GDPR cookie consent component

- **`supabase/migrations/`** - Database migrations

- **`docs/`** - Documentation
  - `SENTRY.md` - Comprehensive Sentry monitoring documentation

### Data Model

The application uses a SCADA-focused data model:

**Core Entities:**
- `projects` - SCADA projects with metadata, organization scoped
- `workflows` - Workflows within projects
- `steps` - Individual workflow steps
- `objects` - SCADA objects (equipment, sensors, etc.) with rich metadata
- `object_relations` - Relationships between objects (electrical_connection, signals_to, mechanical, references, contains, depends_on)
- `object_subtasks` - Subtasks for objects
- `lexicon_items` - Reusable templates (parts, workflow_templates, step_templates, documents, specs, clients)
- `files` - File metadata with Supabase Storage integration

**Link Tables:**
- `object_files` - Links files to objects
- `object_lexicon_links` - Links lexicon items to objects
- `lexicon_files` - Links files to lexicon items

### Authentication & Authorization

The application uses a dual authentication system:

- **Clerk** handles user authentication (sign up, login, session management) and organization management
  - Provides `user_id` for individual user authentication
  - Provides `org_id` for organization-based authorization

- **Supabase RLS** (Row Level Security) enforces authorization at the database level
  - `auth_org_id()` - Helper function to get organization ID from JWT claims
  - **Organization-based policies**: All data (projects, workflows, objects, lexicon items) are scoped to organizations
  - Policies cascade through relationships (e.g., organization members can access objects if they belong to an organization's project)

### Service Layer Pattern

All database interactions go through service functions in `lib/services.ts`:
- `projectService` - CRUD operations for projects
- `workflowService` - Operations for workflows
- `stepService` - Operations for steps
- `objectService` - Operations for SCADA objects
- `objectRelationService` - Manage object relationships
- `objectSubtaskService` - Manage object subtasks
- `fileService` - File metadata management
- `objectFileService` - Link files to objects
- `objectLexiconService` - Link lexicon items to objects
- `lexiconService` - Manage lexicon items
- `lexiconFileService` - Link files to lexicon items

Each service function takes a `SupabaseClient` as the first parameter to ensure proper authentication context.

### Client-Side State Management

- **SupabaseProvider** wraps the app and provides authenticated Supabase client via `useSupabase()` hook
- **useProjects()** hook manages loading all projects for current organization
- **useWorkflows()** hook manages workflows and their steps with real-time updates

## Environment Variables

Required environment variables (see `.env` example in README):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key

For testing (`.env.test`):
- `SUPABASE_URL` - Local Supabase URL (default: http://127.0.0.1:54321)
- `SUPABASE_ANON_KEY` - Local Supabase anon key

For Sentry (optional in `.env`):
- `SENTRY_ENABLED` - Enable Sentry in development (disabled by default)

## Testing Strategy

Tests are located in `lib/__tests__/`:
- `setup.ts` - Global test setup and helper to create test Supabase client
- `helpers.ts` - Test utilities
- `services.test.ts` - Service layer tests
- `example.test.ts` - Example test patterns

Tests use Vitest with jsdom environment. Run local Supabase instance before running tests.

## Database Schema Notes

The database includes a local RLS disable migration (`99999999999999_local_disable_rls.sql`) for local development. This should NOT be used in production.

The main schema includes:

**Helper Functions:**
- `requesting_user_id()` - Extracts user ID from JWT claims
- `auth_org_id()` - Extracts organization ID from JWT claims
- `set_updated_at()` - Trigger function to auto-update timestamps
- `ensure_client_lexicon_type()` - Validates that client_lexicon_id references a lexicon item of type 'client'

**Custom Types:**
- `lexicon_type` - ENUM: 'part', 'workflow_template', 'step_template', 'document', 'spec', 'client'
- `object_priority` - ENUM: 'low', 'medium', 'high', 'urgent'
- `relation_kind` - ENUM: 'electrical_connection', 'signals_to', 'mechanical', 'references', 'contains', 'depends_on'

**Key Features:**
- All tables use RLS with policies for user or organization-based access
- Cascading deletes for referential integrity
- Comprehensive indexing including GIN indexes for JSONB and full-text search
- Unique constraints on organization-scoped entities (projects, lexicon items)
- Triggers to maintain updated_at timestamps
- Full-text search support on objects table

## Path Aliases

The project uses `@/*` path alias mapped to the root directory (configured in `tsconfig.json`).

## Styling

- TailwindCSS 4 for utility-first styling
- shadcn/ui components for consistent UI
- Responsive design with mobile-first approach
- Custom color palette for board colors

## MCP Server Integration

This project is configured with Model Context Protocol (MCP) servers for enhanced development capabilities:

### Supabase MCP Server
Provides direct database access and management tools:
- `search_docs` - Search Supabase documentation
- `list_tables` - View database schema
- `list_extensions` - View installed Postgres extensions
- `list_migrations` - View migration history
- `apply_migration` - Create and apply new migrations
- `execute_sql` - Run SQL queries for testing
- `get_logs` - Retrieve logs by service (api, postgres, auth, storage, etc.)
- `get_advisors` - Get security and performance recommendations
- `get_project_url` - Get the API URL
- `get_anon_key` - Get anonymous API key
- `generate_typescript_types` - Generate TypeScript types from database schema
- Edge Functions: `list_edge_functions`, `get_edge_function`, `deploy_edge_function`
- Branching: `create_branch`, `list_branches`, `delete_branch`, `merge_branch`, `reset_branch`, `rebase_branch`

### Vercel MCP Server
Provides deployment and project management tools:
- `search_vercel_documentation` - Search Vercel docs
- `deploy_to_vercel` - Deploy the project
- `list_projects` - View all Vercel projects
- `get_project` - Get project details
- `list_deployments` - View deployment history
- `get_deployment` - Get deployment details
- `get_deployment_build_logs` - View build logs for debugging
- `get_access_to_vercel_url` - Generate shareable links for protected deployments
- `web_fetch_vercel_url` - Fetch deployment URLs with authentication
- `list_teams` - View team information
- `check_domain_availability_and_price` - Domain management

**Usage Tips:**
- Use `get_advisors` regularly after schema changes to check for missing RLS policies
- Use `generate_typescript_types` after migrations to keep type definitions in sync
- Use branching features for testing migrations in isolated environments
- Check `get_logs` when debugging issues with auth, API, or database
- Use Vercel MCP for deployment automation and monitoring

## Monitoring & Error Tracking

The application uses **Sentry** for comprehensive error monitoring and performance tracking. See [docs/SENTRY.md](docs/SENTRY.md) for complete documentation.

**Key Features:**
- Automatic error capture (client & server)
- Performance monitoring and tracing
- Session replay for debugging
- User context tracking (integrated with Clerk)
- Organization-based error tagging
- User feedback collection

**Configuration Files:**
- `instrumentation-client.ts` - Client-side Sentry configuration
- `sentry.server.config.ts` - Server-side Sentry configuration
- `sentry.edge.config.ts` - Edge runtime Sentry configuration
- `instrumentation.ts` - Sentry initialization
- `lib/sentry.ts` - Utility functions for custom tracking

**Middleware Integration:**
The [middleware.ts](middleware.ts) automatically:
- Sets user context from Clerk authentication
- Tags errors with organization IDs
- Tracks request breadcrumbs for debugging

**Usage Examples:**
```typescript
import { trackScadaOperation, withSentryTracking } from '@/lib/sentry';

// Track SCADA operations
trackScadaOperation('object_update', projectId, true, { objectId });

// Wrap functions with error tracking
const trackedFn = withSentryTracking(myFunction, 'operation_name');
```

## Key Features to Remember

1. **Organization-scoped data model**: All data is scoped to organizations via Clerk
2. **Real-time updates** via Supabase subscriptions (infrastructure in place)
3. **Subscription tiers** (Free/Pro/Enterprise) via Clerk with plan limits
4. **Cookie consent** notice for GDPR compliance
5. **Mobile-responsive** design
6. **Advanced SCADA features**: Object relationships, lexicon items, file attachments, workflows
7. **Full-text search** on SCADA objects
8. **Organization support** via Clerk for team collaboration
9. **Comprehensive testing** setup with Vitest
10. **MCP server integration** for enhanced development workflow
11. **Error monitoring & performance tracking** with Sentry (includes session replay, user feedback)
