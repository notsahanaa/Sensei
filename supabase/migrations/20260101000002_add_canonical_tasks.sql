-- Migration: Add canonical tasks system
-- This is ADDITIVE - does not modify existing task_instances data
-- All existing tasks will have canonical_task_id = NULL until linked

-- =============================================================================
-- 1. CREATE CANONICAL_TASKS TABLE
-- =============================================================================

CREATE TABLE canonical_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL,

  -- Core fields
  canonical_name TEXT NOT NULL,
  description TEXT,
  version TEXT, -- NULL for non-versioned tasks

  -- Metadata (auto-updated via triggers)
  instance_count INTEGER DEFAULT 0,
  first_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_performed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one canonical per name/domain/project/version combination
  CONSTRAINT unique_canonical_task UNIQUE (user_id, project_id, domain_id, canonical_name, version)
);

-- =============================================================================
-- 2. ADD CANONICAL_TASK_ID TO TASK_INSTANCES
-- =============================================================================

-- Add column as NULLABLE (existing rows will be NULL)
ALTER TABLE task_instances
ADD COLUMN canonical_task_id UUID REFERENCES canonical_tasks(id) ON DELETE CASCADE;

-- =============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for querying canonical tasks by user/project/domain
CREATE INDEX idx_canonical_tasks_user_project_domain
ON canonical_tasks(user_id, project_id, domain_id);

-- Index for querying canonical tasks by domain (used in Gemini similarity)
CREATE INDEX idx_canonical_tasks_domain
ON canonical_tasks(domain_id);

-- Index for querying canonical tasks by version
CREATE INDEX idx_canonical_tasks_version
ON canonical_tasks(version) WHERE version IS NOT NULL;

-- Index for task instances by canonical_task_id
CREATE INDEX idx_task_instances_canonical_task
ON task_instances(canonical_task_id) WHERE canonical_task_id IS NOT NULL;

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE canonical_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own canonical tasks
CREATE POLICY "Users can view own canonical tasks"
ON canonical_tasks FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own canonical tasks
CREATE POLICY "Users can insert own canonical tasks"
ON canonical_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own canonical tasks
CREATE POLICY "Users can update own canonical tasks"
ON canonical_tasks FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own canonical tasks
CREATE POLICY "Users can delete own canonical tasks"
ON canonical_tasks FOR DELETE
USING (auth.uid() = user_id);

-- =============================================================================
-- 5. AUTO-UPDATE TRIGGERS FOR CANONICAL_TASKS METADATA
-- =============================================================================

-- Function: Update canonical_tasks.updated_at on row update
CREATE OR REPLACE FUNCTION update_canonical_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_canonical_tasks_updated_at
BEFORE UPDATE ON canonical_tasks
FOR EACH ROW
EXECUTE FUNCTION update_canonical_tasks_updated_at();

-- Function: Update canonical_tasks.instance_count when task_instances are added/removed
CREATE OR REPLACE FUNCTION update_canonical_instance_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT' AND NEW.canonical_task_id IS NOT NULL) THEN
    UPDATE canonical_tasks
    SET instance_count = instance_count + 1
    WHERE id = NEW.canonical_task_id;
    RETURN NEW;

  -- Handle DELETE
  ELSIF (TG_OP = 'DELETE' AND OLD.canonical_task_id IS NOT NULL) THEN
    UPDATE canonical_tasks
    SET instance_count = GREATEST(0, instance_count - 1)
    WHERE id = OLD.canonical_task_id;
    RETURN OLD;

  -- Handle UPDATE (canonical_task_id changed)
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Decrement old canonical task
    IF (OLD.canonical_task_id IS NOT NULL AND OLD.canonical_task_id != NEW.canonical_task_id) THEN
      UPDATE canonical_tasks
      SET instance_count = GREATEST(0, instance_count - 1)
      WHERE id = OLD.canonical_task_id;
    END IF;

    -- Increment new canonical task
    IF (NEW.canonical_task_id IS NOT NULL AND OLD.canonical_task_id != NEW.canonical_task_id) THEN
      UPDATE canonical_tasks
      SET instance_count = instance_count + 1
      WHERE id = NEW.canonical_task_id;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_canonical_instance_count
AFTER INSERT OR UPDATE OR DELETE ON task_instances
FOR EACH ROW
EXECUTE FUNCTION update_canonical_instance_count();

-- Function: Update canonical_tasks.last_performed_at when task is completed
CREATE OR REPLACE FUNCTION update_canonical_last_performed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if task was completed and has a canonical_task_id
  IF (NEW.status = 'completed' AND NEW.canonical_task_id IS NOT NULL) THEN
    UPDATE canonical_tasks
    SET last_performed_at = COALESCE(NEW.completed_at, NOW())
    WHERE id = NEW.canonical_task_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_canonical_last_performed
AFTER UPDATE ON task_instances
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION update_canonical_last_performed();

-- =============================================================================
-- 6. HELPER FUNCTIONS (Optional - for retroactive grouping later)
-- =============================================================================

-- Function: Get all task instances for a canonical task
CREATE OR REPLACE FUNCTION get_canonical_task_instances(canonical_id UUID)
RETURNS TABLE (
  id UUID,
  task_name TEXT,
  scheduled_date DATE,
  status TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  actual_time_spent NUMERIC,
  actual_work_completed TEXT,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ti.id,
    ti.task_name,
    ti.scheduled_date,
    ti.status,
    ti.completed_at,
    ti.actual_time_spent,
    ti.actual_work_completed,
    ti.completion_percentage
  FROM task_instances ti
  WHERE ti.canonical_task_id = canonical_id
  ORDER BY ti.scheduled_date DESC NULLS LAST, ti.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Summary:
-- ✅ Created canonical_tasks table with all necessary fields
-- ✅ Added canonical_task_id column to task_instances (NULLABLE)
-- ✅ Created indexes for performance
-- ✅ Enabled RLS with appropriate policies
-- ✅ Created triggers for auto-updating metadata
-- ✅ Existing task_instances data unchanged (canonical_task_id = NULL)
-- ✅ All existing queries continue to work
