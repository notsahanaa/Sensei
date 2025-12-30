# Database Migrations

## Overview

This directory contains database migrations for the Sensei application.

## Current Migrations

### 20251229000000_create_projects_and_domains.sql

Creates the core database structure for projects and domains:

**Projects Table:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `name` (TEXT, required)
- `description` (TEXT)
- `type` (TEXT, default: 'product')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Domains Table:**
- `id` (UUID, primary key)
- `project_id` (UUID, foreign key to projects)
- `name` (TEXT, required)
- `description` (TEXT, required) - Used by Sensei to classify tasks
- `order_index` (INTEGER) - Maintains user-defined order
- `created_at` (TIMESTAMP)

**Security:**
- Row Level Security (RLS) enabled on both tables
- Users can only access their own projects and domains
- Policies enforce user isolation

## Running Migrations

### Option 1: Push to Remote Database

```bash
supabase db push
```

This will apply all pending migrations to your remote Supabase database.

### Option 2: Apply to Local Database

If you're using local development:

```bash
supabase db reset
```

This will reset your local database and apply all migrations.

## Verification

After running migrations, verify the tables exist:

```sql
-- Check projects table
SELECT * FROM projects LIMIT 1;

-- Check domains table
SELECT * FROM domains LIMIT 1;
```

## Notes

- The migration includes automatic timestamp updates for the `updated_at` field
- Domains are deleted automatically when their parent project is deleted (CASCADE)
- Each domain's `order_index` preserves the order set by the user
