-- Drop existing tables if they exist (CASCADE will drop associated triggers)
DROP TABLE IF EXISTS task_instances CASCADE;
DROP TABLE IF EXISTS canonical_tasks CASCADE;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_canonical_task_metadata() CASCADE;

-- Create simplified task_instances table
CREATE TABLE task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL,

  -- Task details
  task_name TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  version TEXT,

  -- Measurement
  measure_type TEXT CHECK (measure_type IN ('unit', 'percentage', 'status', 'revisions')),
  measure_unit TEXT, -- For custom unit names when measure_type = 'unit'
  target_value NUMERIC,

  -- Timebox
  timebox_value NUMERIC,
  timebox_unit TEXT CHECK (timebox_unit IN ('mins', 'hrs')),

  -- Scheduling
  scheduled_date DATE, -- NULL means backlog

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  actual_time_spent NUMERIC, -- In minutes
  actual_work_completed TEXT,
  completion_percentage NUMERIC CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_task_instances_user_id ON task_instances(user_id);
CREATE INDEX idx_task_instances_project_id ON task_instances(project_id);
CREATE INDEX idx_task_instances_domain_id ON task_instances(domain_id);
CREATE INDEX idx_task_instances_scheduled_date ON task_instances(scheduled_date);
CREATE INDEX idx_task_instances_status ON task_instances(status);
CREATE INDEX idx_task_instances_created_at ON task_instances(created_at DESC);

-- Enable Row Level Security
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own task instances"
  ON task_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task instances"
  ON task_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task instances"
  ON task_instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task instances"
  ON task_instances FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on every update
CREATE TRIGGER update_task_instances_updated_at
  BEFORE UPDATE ON task_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
