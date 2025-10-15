# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lexicon Flow is a comprehensive SCADA (Supervisory Control and Data Acquisition) project management application that combines Trello-style task management with advanced SCADA-specific features. Built with Next.js 15, Supabase, Clerk authentication, and dnd-kit for drag-and-drop functionality, the app supports real-time collaboration, organizational workflows, and complex object relationship management.

The application serves dual purposes:
1. **Simple Task Management**: Trello-style boards with columns and tasks for general project management
2. **SCADA Project Management**: Advanced workflows, steps, objects, lexicon items, and relationship modeling for industrial control systems

**Key Technologies:**
- Next.js 15 with App Router and React 19
- Supabase for database, authentication, and storage
- Clerk for advanced authentication and organization management
- Vitest for testing
- TailwindCSS 4 for styling
- dnd-kit for drag-and-drop interactions

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
  - `boards/[id]/page.tsx` - Main board view with drag-and-drop task management
  - `dashboard/page.tsx` - User dashboard showing all boards
  - `pricing/page.tsx` - Subscription pricing page
  - `legal/` - Legal documents (terms, privacy, etc.)

- **`lib/`** - Core business logic and utilities
  - `services.ts` - Supabase service layer for all database operations
  - `supabase/models.ts` - TypeScript type definitions for database entities
  - `supabase/server.ts` - Server-side Supabase client factory
  - `supabase/SupabaseProvider.tsx` - Client-side Supabase context provider
  - `hooks/useBoards.ts` - React hooks for board and task management
  - `contexts/PlanContext.tsx` - Subscription plan context

- **`components/`** - Reusable UI components
  - `ui/` - shadcn/ui components (button, dialog, input, etc.)
  - `navbar.tsx` - Navigation bar component
  - `cookie-notice.tsx` - GDPR cookie consent component

- **`supabase/migrations/`** - Database migrations

### Data Model

The application has two parallel data models:

1. **Simple Trello-like Model** (boards/columns/tasks)
   - `boards` - User boards with title, description, color
   - `columns` - Columns within boards (To Do, In Progress, Done)
   - `tasks` - Individual tasks with title, description, assignee, due_date, priority

2. **SCADA Project Model** (projects/workflows/steps/objects)
   - `projects` - SCADA projects with metadata
   - `workflows` - Workflows within projects
   - `steps` - Individual workflow steps
   - `objects` - SCADA objects (equipment, sensors, etc.) with rich metadata
   - `object_relations` - Relationships between objects (electrical_connection, signals_to, mechanical, references, contains, depends_on)
   - `object_subtasks` - Subtasks for objects
   - `lexicon_items` - Reusable templates (parts, workflow_templates, step_templates, documents, specs, clients)
   - `files` - File metadata with Supabase Storage integration
   - Link tables: `object_files`, `object_lexicon_links`, `lexicon_files`

### Authentication & Authorization

The application uses a dual authentication system:

- **Clerk** handles user authentication (sign up, login, session management) and organization management
  - Provides `user_id` for individual user authentication
  - Provides `org_id` for organization-based authorization (SCADA projects)

- **Supabase RLS** (Row Level Security) enforces authorization at the database level
  - `requesting_user_id()` - Helper function to get user ID from JWT claims (for boards/columns/tasks)
  - `auth_org_id()` - Helper function to get organization ID from JWT claims (for projects/workflows/objects)
  - **User-based policies**: Boards, columns, and tasks are scoped to individual users
  - **Organization-based policies**: Projects, workflows, objects, and lexicon items are scoped to organizations
  - Policies cascade through relationships (e.g., users can access tasks if they own the parent board; organization members can access objects if they belong to an organization's project)

### Service Layer Pattern

All database interactions go through service functions in `lib/services.ts`:
- `boardService` - CRUD operations for boards
- `columnService` - CRUD operations for columns
- `taskService` - CRUD operations for tasks
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
- **useBoards()** hook manages loading all boards for current user
- **useBoard(boardId)** hook manages single board state including:
  - Board metadata
  - Columns with their tasks (ColumnWithTasks[])
  - Real-time optimistic updates for drag-and-drop
  - CRUD operations for tasks and columns

### Drag-and-Drop Implementation

Uses `@dnd-kit/core` and `@dnd-kit/sortable`:
- Each column is a `DroppableColumn` (droppable zone)
- Each task is a `SortableTask` (draggable + sortable within column)
- `DragOverlay` provides visual feedback during drag
- Task movement is optimistic (UI updates immediately, then syncs to database)
- Supports both column-to-column movement and reordering within same column

## Environment Variables

Required environment variables (see `.env` example in README):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key

For testing (`.env.test`):
- `SUPABASE_URL` - Local Supabase URL (default: http://127.0.0.1:54321)
- `SUPABASE_ANON_KEY` - Local Supabase anon key

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

## Key Features to Remember

1. **Dual Data Models**: User-scoped boards/tasks and organization-scoped SCADA projects
2. **Real-time updates** via Supabase subscriptions (infrastructure in place)
3. **Subscription tiers** (Free/Pro/Enterprise) via Clerk with plan limits
4. **Cookie consent** notice for GDPR compliance
5. **Mobile-responsive** board view with horizontal scroll on desktop
6. **Task filtering** by priority, assignee, and due date
7. **Customizable** board colors and column titles
8. **Advanced SCADA features**: Object relationships, lexicon items, file attachments, workflows
9. **Full-text search** on SCADA objects
10. **Organization support** via Clerk for team collaboration
11. **Comprehensive testing** setup with Vitest
12. **MCP server integration** for enhanced development workflow
