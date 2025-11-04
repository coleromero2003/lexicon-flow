---

# Lexicon Flow - SCADA Project Management Platform

<div align="center">
  <br />
  <div>
    <img src="https://img.shields.io/badge/-Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/-Clerk-0072CE?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" />
    <img src="https://img.shields.io/badge/-@dnd--kit-FAB005?style=for-the-badge&logo=react&logoColor=white" alt="dnd-kit" />
    <img src="https://img.shields.io/badge/-TailwindCSS_4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/-Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  </div>
  <h3 align="center">Comprehensive SCADA Project Management with Advanced Task Tracking</h3>
  <p align="center">
    A production-ready application combining Trello-style task management with industrial-grade SCADA project workflows
  </p>
  <br />
</div>

## 📋 Table of Contents

1. [Introduction](#-introduction)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture](#-architecture)
5. [Quick Start](#-quick-start)
6. [Database Schema](#-database-schema)
7. [Testing](#-testing)
8. [Deployment](#-deployment)
9. [MCP Integration](#-mcp-integration)

---

## 🚀 Introduction

**Lexicon Flow** is a comprehensive project management platform designed for SCADA (Supervisory Control and Data Acquisition) systems and industrial automation projects. It combines the intuitive task management of Trello with advanced features specifically tailored for managing complex industrial control systems.

### What Makes Lexicon Flow Unique?

- **Dual Data Models**: Simple task boards for general project management AND complex SCADA workflows with object relationships
- **Organization Support**: Multi-tenant architecture with Clerk organizations for team collaboration
- **Advanced Relationships**: Model complex object relationships (electrical connections, signals, mechanical links, dependencies)
- **Lexicon System**: Reusable templates for parts, workflows, steps, documents, and specifications
- **File Management**: Attach files to objects and lexicon items with Supabase Storage integration
- **Full-Text Search**: Find SCADA objects quickly with built-in search capabilities
- **Real-Time Collaboration**: Live updates across all connected clients via Supabase subscriptions

---

## ⚡️ Features

### Task Management (Trello-Style)
* 📋 **Boards & Columns** - Create multiple boards with custom columns
* ➕ **Dynamic Tasks** - Add, edit, and delete tasks with rich metadata
* 🔄 **Drag & Drop** - Smooth animations for reordering and moving tasks
* 🎨 **Customizable** - Custom board colors and column titles
* 🔍 **Filtering** - Filter tasks by priority, assignee, and due date

### SCADA Project Management
* 🏭 **Projects & Workflows** - Organize work into projects with multiple workflows
* 📊 **Steps & Objects** - Define workflow steps and SCADA objects (equipment, sensors, etc.)
* 🔗 **Object Relationships** - Model complex relationships:
  - Electrical connections
  - Signal flows
  - Mechanical linkages
  - References and dependencies
  - Containment hierarchies
* 📚 **Lexicon Items** - Reusable templates for:
  - Parts and components
  - Workflow templates
  - Step templates
  - Documents and specifications
  - Client information
* 📎 **File Attachments** - Link files to objects and lexicon items
* ✅ **Subtasks** - Break down objects into manageable subtasks
* 🔎 **Full-Text Search** - Search across all object titles and descriptions

### Platform Features
* 🔐 **Authentication** - Secure user authentication via Clerk
* 🏢 **Organizations** - Multi-tenant support for team collaboration
* 💳 **Subscription Tiers** - Free, Pro, and Enterprise plans with different limits
* 📧 **Email Notifications** - Automated emails for task assignments and user invitations via Resend
* 📡 **Real-Time Sync** - Live updates across all connected clients
* 🔒 **Row-Level Security** - Fine-grained access control via Supabase RLS
* 🍪 **GDPR Compliance** - Cookie consent notice
* 📱 **Responsive Design** - Mobile-first UI that works on all devices
* 🧪 **Comprehensive Testing** - Vitest test suite with coverage reports

---

## ⚙️ Tech Stack

### Frontend
* **Next.js 15** - React framework with App Router and Server Components
* **React 19** - Latest React with enhanced performance
* **TypeScript** - Type-safe development
* **TailwindCSS 4** - Utility-first styling
* **shadcn/ui** - High-quality UI components
* **@dnd-kit** - Flexible drag-and-drop primitives
* **Lucide React** - Icon library

### Backend & Infrastructure
* **Supabase** - PostgreSQL database, real-time subscriptions, storage, and Row-Level Security
* **Clerk** - Authentication and organization management
* **Resend** - Transactional email service for notifications
* **Vercel** - Deployment and hosting

### Development & Testing
* **Vitest** - Fast unit testing framework
* **Testing Library** - React component testing
* **Supabase CLI** - Local development and migrations
* **ESLint** - Code linting
* **MCP Servers** - Enhanced development with Supabase and Vercel MCP integrations

---

## 🏗️ Architecture

### Data Models

The application features two parallel data models:

**1. Simple Task Management (User-Scoped)**
```
boards (user_id)
  └── columns
       └── tasks (title, description, assignee, due_date, priority)
```

**2. SCADA Project Management (Organization-Scoped)**
```
projects (org_id, client_lexicon_id)
  ├── workflows
  │    └── steps
  ├── objects (workflow_id[], step_id[], metadata)
  │    ├── object_relations (relation_kind: electrical_connection, signals_to, etc.)
  │    ├── object_subtasks
  │    ├── object_files
  │    └── object_lexicon_links
  └── files (storage_key, metadata)

lexicon_items (org_id, type, attributes)
  └── lexicon_files
```

### Service Layer Architecture

All database operations go through a service layer ([lib/services.ts](lib/services.ts)) with the following services:

- **boardService** - CRUD for boards
- **columnService** - CRUD for columns
- **taskService** - CRUD for tasks
- **projectService** - CRUD for SCADA projects
- **workflowService** - Workflow management
- **stepService** - Step management
- **objectService** - SCADA object management
- **objectRelationService** - Relationship management
- **objectSubtaskService** - Subtask management
- **fileService** - File metadata
- **objectFileService** - Object-file links
- **objectLexiconService** - Object-lexicon links
- **lexiconService** - Lexicon item management
- **lexiconFileService** - Lexicon-file links

### Authentication & Authorization

- **Clerk** provides user authentication and organization management
- **Supabase RLS** enforces data access policies:
  - `requesting_user_id()` for user-scoped data (boards/columns/tasks)
  - `auth_org_id()` for organization-scoped data (projects/workflows/objects)
  - Cascading policies through foreign key relationships

---

## 👌 Quick Start

### Prerequisites

* [Node.js](https://nodejs.org/) (v18+ recommended)
* [Supabase CLI](https://supabase.com/docs/guides/cli) - For local development
* [Supabase Account](https://supabase.com/) - Create a project and get your URL & ANON key
* [Clerk Account](https://clerk.com/) - Get your Publishable & Secret keys
* [Vercel Account](https://vercel.com/) (optional) - For deployment

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lexicon-flow.git
   cd lexicon-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_webhook_secret

   # Resend (Email Notifications)
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=notifications@yourdomain.com
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   See `.env.example` for a complete list of environment variables.

4. **Set up local Supabase (optional but recommended)**
   ```bash
   supabase start
   supabase db push
   ```

   For testing, create `.env.test`:
   ```env
   SUPABASE_URL=http://127.0.0.1:54321
   SUPABASE_ANON_KEY=your_local_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Testing
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:run         # Run tests once (CI mode)
npm run test:coverage    # Generate coverage report

# Supabase
supabase start           # Start local Supabase
supabase db push         # Push migrations to local DB
supabase stop            # Stop local Supabase
supabase db reset        # Reset local database
```

## 🗄️ Database Schema

The database schema is managed through Supabase migrations located in [supabase/migrations](supabase/migrations).

### Database Tables

For detailed type definitions, see [lib/supabase/models.ts](lib/supabase/models.ts).

**Task Management Tables (User-Scoped)**
- `boards` - User boards with title, description, color
- `columns` - Columns within boards
- `tasks` - Tasks with metadata (assignee, priority, due date)

**SCADA Project Tables (Organization-Scoped)**
- `projects` - SCADA projects with organization scope
- `workflows` - Workflows within projects
- `steps` - Workflow steps with position ordering
- `objects` - SCADA objects (equipment, sensors, etc.) with rich metadata
- `object_relations` - Typed relationships between objects
- `object_subtasks` - Subtasks for objects
- `lexicon_items` - Reusable templates (parts, workflows, documents, specs, clients)
- `files` - File metadata with Supabase Storage integration
- `object_files`, `object_lexicon_links`, `lexicon_files` - Junction tables

### Row-Level Security (RLS)

All tables have RLS enabled with policies enforcing either user-based or organization-based access:

**User-Scoped Policies** (boards, columns, tasks)
- Users can only CRUD their own data via `requesting_user_id()` helper function
- Policies cascade through relationships (e.g., access tasks if you own the parent board)

**Organization-Scoped Policies** (projects, workflows, objects, lexicon)
- Organization members can CRUD data belonging to their organization via `auth_org_id()` helper function
- All operations (SELECT, INSERT, UPDATE, DELETE) check organization membership
- Relationships cascade organization access (e.g., access objects through parent project)

### Custom Enum Types

- `lexicon_type` - Types of lexicon items: part, workflow_template, step_template, document, spec, client
- `object_priority` - Priority levels: low, medium, high, urgent
- `relation_kind` - Object relationship types: electrical_connection, signals_to, mechanical, references, contains, depends_on

### Key Schema Features

- **Helper Functions**: `requesting_user_id()`, `auth_org_id()`, `set_updated_at()`, `ensure_client_lexicon_type()`
- **Cascading Deletes**: Foreign keys with ON DELETE CASCADE for data integrity
- **Indexes**: Performance indexes on foreign keys and JSONB columns
- **Full-Text Search**: GIN index on objects for searching titles and descriptions
- **Unique Constraints**: Organization-scoped uniqueness (projects, lexicon items)
- **Triggers**: Auto-update timestamps on boards, projects, workflows, objects

To view the complete schema, run:
```bash
supabase db diff
# or
supabase db dump
```

---

## 🧪 Testing

The project uses **Vitest** for testing with comprehensive coverage of the service layer.

### Running Tests

```bash
npm test                 # Watch mode
npm run test:ui          # UI mode with Vitest UI
npm run test:run         # CI mode (run once)
npm run test:coverage    # Generate coverage report
```

### Test Files

- **[lib/__tests__/setup.ts](lib/__tests__/setup.ts)** - Global test configuration and Supabase client setup
- **[lib/__tests__/helpers.ts](lib/__tests__/helpers.ts)** - Test utility functions
- **[lib/__tests__/services.test.ts](lib/__tests__/services.test.ts)** - Service layer integration tests
- **[lib/__tests__/example.test.ts](lib/__tests__/example.test.ts)** - Example test patterns

### Testing with Local Supabase

Tests run against a local Supabase instance for isolation:

```bash
supabase start           # Start local Supabase with test database
npm test                 # Run tests against local instance
supabase stop            # Clean up when done
```

The local instance is configured via `.env.test` with separate credentials from development/production.

---

## 🚀 Deployment

### Deploy to Vercel

The easiest way to deploy is using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/lexicon-flow)

1. Click "Deploy" and connect your GitHub repository
2. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Deploy!

### Manual Deployment

```bash
npm run build            # Build for production
npm start                # Start production server
```

### Database Setup for Production

Push migrations to your production Supabase project:

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push

# Verify schema
supabase db diff
```

### Continuous Deployment

Set up automatic deployments:
- **Vercel**: Automatically deploys on push to main branch
- **Database**: Use Supabase branching or separate staging/production projects
- **Environment Variables**: Manage via Vercel dashboard or `.env.production`

---

## 🔌 MCP Integration

This project includes **Model Context Protocol (MCP)** server integrations for enhanced development capabilities.

### Supabase MCP Server

Provides direct database access and management tools:

**Schema & Migrations**
- `list_tables` - View database schema
- `list_extensions` - View Postgres extensions
- `list_migrations` - View migration history
- `apply_migration` - Create and apply new migrations
- `execute_sql` - Run SQL queries for testing

**Monitoring & Debugging**
- `get_logs` - Retrieve logs by service (api, postgres, auth, storage, realtime, edge-function)
- `get_advisors` - Get security and performance recommendations
- `search_docs` - Search Supabase documentation

**Development Tools**
- `generate_typescript_types` - Generate TypeScript types from database schema
- `get_project_url` - Get the API URL
- `get_anon_key` - Get anonymous API key

**Edge Functions**
- `list_edge_functions` - List all Edge Functions
- `get_edge_function` - Get Edge Function source code
- `deploy_edge_function` - Deploy Edge Function

**Database Branching** (for testing migrations)
- `create_branch` - Create a development branch
- `list_branches` - View all branches
- `delete_branch` - Remove a branch
- `merge_branch` - Merge branch to production
- `reset_branch` - Reset branch to specific migration
- `rebase_branch` - Rebase branch on production

### Vercel MCP Server

Provides deployment and project management tools:

**Deployment**
- `deploy_to_vercel` - One-click deployment
- `list_deployments` - View deployment history
- `get_deployment` - Get deployment details
- `get_deployment_build_logs` - Debug build failures

**Project Management**
- `list_projects` - View all Vercel projects
- `get_project` - Get project configuration
- `list_teams` - View team information
- `search_vercel_documentation` - Search Vercel docs

**Protected Deployments**
- `get_access_to_vercel_url` - Generate shareable links for protected deployments
- `web_fetch_vercel_url` - Fetch deployment URLs with authentication

**Domains**
- `check_domain_availability_and_price` - Domain management

### MCP Usage Tips

**After making schema changes:**
```bash
# Check for security issues
mcp supabase get_advisors --type security

# Check for performance issues
mcp supabase get_advisors --type performance

# Update TypeScript types
mcp supabase generate_typescript_types
```

**When debugging:**
```bash
# Check API logs
mcp supabase get_logs --service api

# Check auth issues
mcp supabase get_logs --service auth

# View build logs
mcp vercel get_deployment_build_logs --deployment-id <id>
```

**Testing migrations:**
```bash
# Create a test branch
mcp supabase create_branch --name test-migration

# Test your migration
# ... make changes ...

# If successful, merge to production
mcp supabase merge_branch --branch-id <id>

# Or reset if something went wrong
mcp supabase reset_branch --branch-id <id>
```

---

## 📚 Documentation

### Project Documentation
- **[CLAUDE.md](CLAUDE.md)** - Comprehensive guidance for AI-assisted development with Claude Code
- **[lib/supabase/models.ts](lib/supabase/models.ts)** - Complete TypeScript type definitions

### Key Implementation Files
- **[lib/services.ts](lib/services.ts)** - Service layer with all database operations
- **[lib/hooks/useBoards.ts](lib/hooks/useBoards.ts)** - React hooks for board management
- **[lib/contexts/PlanContext.tsx](lib/contexts/PlanContext.tsx)** - Subscription plan context
- **[lib/supabase/SupabaseProvider.tsx](lib/supabase/SupabaseProvider.tsx)** - Supabase client context

### Legal Pages
- [Terms of Service](app/legal/terms/page.tsx)
- [Privacy Policy](app/legal/privacy/page.tsx)
- [Cookie Policy](app/legal/cookie/page.tsx)
- [Service Agreement](app/legal/service_agreement/page.tsx)
- [Data Processing Agreement](app/legal/data_processing/page.tsx)
- [Acceptable Use Policy](app/legal/use/page.tsx)

---

## 🔗 Useful Links

### Official Documentation
* [Next.js Documentation](https://nextjs.org/docs)
* [React Documentation](https://react.dev/)
* [Supabase Documentation](https://supabase.com/docs)
* [Clerk Documentation](https://clerk.com/docs)
* [dnd-kit Documentation](https://docs.dndkit.com/)
* [TailwindCSS Documentation](https://tailwindcss.com/docs)
* [Vitest Documentation](https://vitest.dev/)

### Platform Links
* [Vercel](https://vercel.com/)
* [Supabase Dashboard](https://app.supabase.com/)
* [Clerk Dashboard](https://dashboard.clerk.com/)

### Community & Support
* [Supabase Discord](https://discord.supabase.com/)
* [Next.js Discord](https://discord.gg/nextjs)
* [Clerk Discord](https://clerk.com/discord)

---
