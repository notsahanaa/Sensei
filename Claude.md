# Sensei - Project Documentation

## About Project

### Target Audience
Small, self-employed builders and creators who juggle multiple projects.

### Goal
Sensei helps creators and builders turn ideas into action. It organizes daily work, tracks consistency and project progress — so users can consistently make meaningful progress on their projects.

## Main Pages / Navigation

- **Create Project** - Create a project and define the key domains tasks will be segregated into
- **Dashboard** - Show all current projects and tasks related to those projects
- **Task** - Show all the project tasks divided by day. Can add, edit, delete
- **Productivity** - Shows heatmap of users' monthly contribution + weekly time spent + what they did daily
- **Progress** - Auto-organizing progress page that shows milestones completed so far and what activities were completed under each milestone
- **Sidebar Menu** - Shows home, active projects & archived projects

---

## Features

### 0. Starting

#### 0.1 Sign Up & Onboarding
- Sign up / create an account
- Quick 3-slide visual guide introducing Sensei's workflow and benefits

#### 0.2 Creating a new Project
- Users create the project they will focus on and its domains

#### 0.3 Dashboard
- Shows all the projects the user is currently working on

---

### 1. Tasks

#### 1.1 Daily Tasks: Setting Task
- At the start of the day, Sensei converts user's unstructured input into structured tasks
- If there are backlogged tasks, Sensei asks the user if they want to schedule it today
- Each task includes:
  - Short name (2–4 words)
  - Description
  - Project
  - Domain
  - Date
  - Timebox
  - Target (% completion, number, etc.)
  - Version
  - Optional Notes
- Sensei confirms task cards with user before pushing to the "Today" section
- Users can edit, delete, or add tasks manually
- "Today" page shows the date and progress bar with hours of work left label

#### 1.2 Daily Tasks: Focus Mode
- Click a task to start a focus timer
- Timer counts up to the set time and continues if the user is still working
- On completion, user confirms whether the task and time target were met; data is stored
- Completed tasks appear grayed out in the Today page

#### 1.3 Daily Tasks: Completing Tasks
- Checkmark a task to complete it
- Add time taken, work completed, version to check in
- If user has not manually completed, Sensei asks to check-in by showing each task and asking which ones they completed and how far
- Users confirm completed tasks or edit if outcomes differ from planned targets
- Users can provide a text dump of what they accomplished, which Sensei parses into structured completion data

---

### 2. Productivity

#### 2.1 Consistency Map & Productivity UI
- **Monthly calendar heatmap**: shows days user worked and time spent (every 2 hours = 10% shade change; starts at 30%)
- **Weekly bar chart**: visualizes time spent per project (split by domain)
- **Future**: input vs outcome ratio, plan vs completion analysis
- Tasks completed that day, shown as task cards

#### 2.2 Future: Taking Breaks / Non-Work Days
- If the user does not work on a day, Sensei asks what they did instead (categories: rest, fun, hobbies, day job)
- Calendar shows these categories for non-work days so users see justified breaks without guilt

---

### 3. Progress

#### 3.1 Project Progress / Kanban
- Sensei groups tasks completed into milestones
- Project Progress page will contain a kanban with all milestones reached in a domain
- On clicking a milestone, user can see all the tasks completed under it, the dates completed and the metrics associated
- **Future**: Sensei will suggest where tasks were under- or over-performed and provide insights on efficiency and growth

---

### 4. Profile

#### 4.1 Account Management
- Email, password, notification settings
- Sign out
- Delete account

---

### 5. Insights (Future Feature)
- AI-driven insights on work patterns and productivity
- Advice on task efficiency, time allocation, and prioritization


---

## Design System

### Color System

#### Background
- **Dark Mode**: #0C0C0C
- **Light Mode**: #FFFFFF

#### Container Subtle
- **Dark Mode**: #161616
- **Light Mode**: #F7FAFF

#### Container Medium
- **Dark Mode**: #343434 (40%)
- **Light Mode**: #D1DBEC (40%)

#### Container Intense
- **Dark Mode**: #343434 (100%)
- **Light Mode**: #D1DBEC (100%)

#### Primary Text
- **Dark Mode**: #FFFFFF
- **Light Mode**: #000000

#### Secondary Text
- **Dark Mode**: #FFFFFF (60%)
- **Light Mode**: #000000 (60%)

#### Primary Accent
- **Dark Mode**: #879FC8
- **Light Mode**: #3F58AB

#### Secondary Accent
- **Dark Mode**: #A6AAF4
- **Light Mode**: #8E92ED

#### Tertiary Accent
- **Dark Mode**: #96F7FE
- **Light Mode**: #2CBFC9

#### Quaternary Accent
- **Dark Mode**: #34A7F8
- **Light Mode**: #29A0F4

---

### Font System

**Font Family**: EB Garamond

#### Typography Scale

##### Title
- **Web**: 32px (500)
- **Mobile**: 32px (500)
- **Where**: Big text, big numbers

##### Heading L
- **Web**: 24px (500)
- **Mobile**: 24px (500)

##### Heading M
- **Web**: 20px (500)
- **Mobile**: 20px (500)
- **Where**: Page Headings

##### Heading S
- **Web**: 16px (500)
- **Mobile**: 16px (500)
- **Where**: Section Heading

##### Body Text M
- **Web**: 16px (400)
- **Mobile**: 16px (400)
- **Where**: Regular content, tab labels, small section headings

##### Body Text S
- **Web**: 12px (400)
- **Mobile**: 12px (400)
- **Where**: Small Text & Labels

---

### Spacing

**Scale**: 4-point

#### Container Spacing
- **Sidebar open**: 24%
- **Normal Container**: 60%
- **Small Container**: 40%
- **Pop-up Container**: 84%

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
  - React-based with server-side rendering
  - Built-in routing and API routes
  - Excellent performance and SEO
  - TypeScript support
- **Language**: TypeScript
  - Type safety for complex data structures
  - Better developer experience and code maintainability
- **Styling**: Tailwind CSS
  - Utility-first CSS framework
  - Easy implementation of design system
  - Responsive design support
  - Dark/light mode support with `next-themes`
- **UI Components**: shadcn/ui + Radix UI
  - Accessible, customizable components
  - Headless UI primitives
  - Copy-paste component library
- **Animation**: Framer Motion
  - Smooth transitions and animations
  - Great for UI interactions and page transitions

### Backend
- **Platform**: Supabase
  - **Authentication**: Supabase Auth
    - Email/password authentication
    - Session management
    - Row-level security (RLS)
  - **Database**: PostgreSQL (managed by Supabase)
    - Relational database for complex data relationships
    - Full-text search capabilities
    - PostgreSQL functions for business logic
    - Database triggers for automation
  - **Client Library**: Supabase JS Client
    - Type-safe queries with auto-generated TypeScript types
    - Seamless RLS integration
    - Built-in auth integration
    - Use `.rpc()` for calling PostgreSQL functions
  - **Storage**: Supabase Storage (for future file uploads)
  - **Edge Functions**: Supabase Edge Functions
    - **Use ONLY for**: AI parsing (Claude API), external API calls, scheduled jobs, webhooks
    - **DO NOT use for**: CRUD operations, business logic, data validation
    - Keep edge functions thin and stateless
  - **Real-time**: Supabase Realtime
    - **Use sparingly**: Only for multi-device sync or future collaboration
    - **Do NOT use for**: Regular CRUD, dashboard updates, task management
    - Rely on React Query optimistic updates instead

### Database Architecture
- **Type**: PostgreSQL (via Supabase)
- **Schema Management**: Supabase Migrations
- **Type Generation**: Supabase CLI (`supabase gen types typescript`)
- **Business Logic**: PostgreSQL Functions (pl/pgsql)
  - Keep business logic in database, not edge functions
  - Use for data validation, complex queries, and transformations
- **Data Aggregation**: PostgreSQL Views & Functions
  - **All metrics and charts use SQL aggregation**:
    - Heatmap data (daily work hours, task counts)
    - Weekly charts (time per project/domain)
    - Progress metrics (milestone grouping)
  - Create views for common aggregations
  - Create functions for dynamic queries
  - Benefits: Performance, scalability, less data transfer

### State Management
- **Server State**: TanStack Query (React Query)
  - Caching and synchronization with Supabase
  - **Optimistic updates** for instant UI feedback (instead of Realtime)
  - Background refetching and polling
  - Automatic cache invalidation
- **Client State**: Zustand
  - Lightweight state management
  - Global UI state (theme, modals, sidebar)
  - Simple API with no boilerplate

### Data Visualization
- **Charts**: Recharts
  - Weekly bar charts for time tracking
  - Data from PostgreSQL aggregation functions
  - Responsive and customizable
- **Heatmap**: react-calendar-heatmap or custom solution
  - Monthly consistency heatmap
  - GitHub-style contribution graph
  - Data from SQL aggregation
- **Kanban**: dnd-kit
  - Drag-and-drop for milestone organization
  - Accessible and performant

### Utilities
- **Date/Time**: date-fns
  - Lightweight date manipulation
  - Timezone handling
  - Date formatting
- **Forms**: React Hook Form + Zod
  - Performant form handling
  - Schema validation with Zod
  - TypeScript-first validation
  - Easy integration with UI components
- **Validation**: Zod
  - Runtime type validation
  - Works with React Hook Form
  - Shared schemas between frontend and backend

### Development Tools
- **Package Manager**: pnpm or npm
- **Code Quality**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Supabase Local Development**: Supabase CLI
  - Local database for development
  - Migration management
  - Type generation

### Deployment
- **Frontend**: Vercel
  - Seamless Next.js deployment
  - Edge functions support
  - Global CDN
  - Environment variables management
- **Backend**: Supabase (managed hosting)
  - Automatic backups
  - Edge Functions deployment
  - Database migrations

### APIs & Integrations
*Third-party APIs will be added here as needed*

---

## Architectural Notes

### Data Flow Best Practices
1. **Client → Supabase Client → PostgreSQL** for all CRUD operations
2. **PostgreSQL Functions** for business logic and complex queries
3. **Edge Functions** only for external integrations (AI, webhooks, third-party APIs)
4. **SQL Aggregation** for all analytics, charts, and metrics
5. **React Query Optimistic Updates** for responsive UI (avoid Realtime initially)

### Type Safety
- Generate types from Supabase schema: `supabase gen types typescript`
- Use Zod schemas for runtime validation
- Share types between frontend and backend

### Performance Optimization
- Use PostgreSQL views for frequently accessed aggregations
- Cache aggregated data when appropriate
- Index database columns used in queries and filters
- Use React Query caching to minimize database calls

---

## Coding Best Practices

### UX Best Practices
- **Always write component code** for UI components (buttons, validation forms, modals, etc.)
- **Use conditional rendering** for component variants
  - Leverage conditional logic and states for different component states
  - Example: loading states, error states, empty states, success states
- **Component organization**
  - Store all components under `frontend/components` directory
  - Organize by feature or type (ui, forms, layouts, etc.)
- **Follow the design system**
  - Use defined colors, typography, and spacing
  - Maintain consistency across all components

### Naming Practices
- Use clear, descriptive names for components, functions, and variables
- Follow consistent naming conventions:
  - Components: PascalCase (e.g., `TaskCard`, `FocusTimer`)
  - Functions: camelCase (e.g., `handleSubmit`, `fetchTasks`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_TASK_LENGTH`)
  - Files: kebab-case for non-components (e.g., `use-tasks.ts`, `api-client.ts`)
- Use meaningful prefixes:
  - Custom hooks: `use-` (e.g., `useTask`, `useTimer`)
  - Utility functions: Descriptive verbs (e.g., `formatDate`, `calculateProgress`)

### File Length & Code Organization
- **Maximum file length**: 800 lines per file
  - Files over 1000+ lines cause problems with AI assistance and maintainability
- **If a file is too long**:
  - **Frontend**: Break into smaller components
    - Extract reusable UI components
    - Split by feature or responsibility
    - Use composition over large monolithic components
  - **Backend**: Improve architecture
    - Split into multiple functions/modules
    - Separate concerns (queries, mutations, validation)
    - Create utility functions for shared logic

### Avoid Hardcoding
- **Never use mock data** in production code
  - Always fetch from database or API
  - Use proper data structures and types
- **No hardcoded logic**
  - Use configuration files or environment variables
  - Store constants in dedicated files
  - Make values dynamic and data-driven
- **Important**: In every development prompt, explicitly specify "Do not use mock data"

### Backend Pagination
- **All APIs must be paginated** to avoid laggy UX and performance issues
- **Default pagination limits**:
  - **Frontend**: 100 items per page (unless specifically changed)
  - **Backend**: 500 items per page
- **Implementation**:
  - Use Supabase `.range()` for pagination
  - Return total count for pagination UI
  - Implement infinite scroll or "Load More" patterns
  - Consider cursor-based pagination for large datasets
- **Performance**: Pagination prevents slow queries and reduces data transfer

### Code Quality
- **TypeScript strict mode**: Always enabled
- **Error handling**: Implement proper error boundaries and try-catch blocks
- **Validation**: Validate all user input with Zod schemas
- **Accessibility**: Follow WCAG guidelines, use semantic HTML
- **Testing**: Write tests for critical business logic (future)

---

## Notes for Development
This document serves as the source of truth for Sensei's features and functionality. Refer to this file when implementing features to ensure alignment with the product vision.
