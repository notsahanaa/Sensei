# Canonical Task System - Implementation Plan

## Overview
Two-tier task system: **Task Instances** (daily tasks) → auto-linked to **Canonical Tasks** (invisible grouping) using Gemini AI.

**Key Rule**: Different versions = different canonical tasks

---

## 1. Gemini AI Integration

### What Data We Send to Gemini

```javascript
{
  newTask: {
    taskName: "interview users",
    description: "Talk to 3 potential users about pain points",
    domainName: "User Research"
  },
  existingCanonicalTasks: [
    {
      id: "uuid-123",
      canonicalName: "User Interviews",
      description: "Conduct interviews with users"
    },
    {
      id: "uuid-456",
      canonicalName: "Survey Users",
      description: "Send surveys to users"
    }
  ]
}
```

**Key Points:**
- Only send canonical tasks from **same domain AND same version**
- If no existing canonicals with matching version → skip Gemini, create new canonical

### Prompt for Gemini

**System Instruction:**
```
You are a task similarity analyzer. Determine if a new task matches any existing canonical tasks.

Return JSON with this structure:
{
  "matchFound": true/false,
  "matchedCanonicalTaskId": "uuid or null",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}

Confidence scale:
- 0.9-1.0: Very high (same activity, different wording)
- 0.75-0.89: High (similar activity)
- 0.5-0.74: Medium (related but different)
- 0.0-0.49: Low (different activities)
```

**User Prompt:**
```
New Task:
Name: {taskName}
Description: {description}
Domain: {domainName}

Existing Canonical Tasks in this domain:
- {canonicalName}: {description}
- {canonicalName}: {description}

Determine if the new task matches any existing canonical task.
```

### Decision Logic

```javascript
if (confidence >= 0.75) {
  // Link to existing canonical
  canonicalTaskId = matchedCanonicalTaskId
} else {
  // Create new canonical
  canonicalTaskId = createNewCanonical()
}
```

---

## 2. Saving Data in Two Tables

### Step-by-Step Process

**When user saves a task:**

1. **Query existing canonical tasks**
   ```javascript
   const existingCanonicals = await supabase
     .from('canonical_tasks')
     .select('id, canonical_name, description')
     .eq('domain_id', domainId)
     .eq('version', version) // CRITICAL: Filter by version!
   ```

2. **Call Gemini (if canonicals exist)**
   ```javascript
   if (existingCanonicals.length > 0) {
     const result = await gemini.checkSimilarity(newTask, existingCanonicals)
     if (result.confidence >= 0.75) {
       canonicalTaskId = result.matchedCanonicalTaskId
     }
   }
   ```

3. **Create new canonical if no match**
   ```javascript
   if (!canonicalTaskId) {
     const newCanonical = await supabase
       .from('canonical_tasks')
       .insert({
         user_id: userId,
         project_id: projectId,
         domain_id: domainId,
         canonical_name: taskName,
         description: description,
         version: version,              // From user input
         measure_type: measureType,     // "unit", "%", "status", "revisions"
         measure_unit: measureUnit      // e.g., "users" if measureType="unit"
       })
       .select()
       .single()

     canonicalTaskId = newCanonical.id
   }
   ```

4. **Save task instance**
   ```javascript
   const taskInstance = await supabase
     .from('task_instances')
     .insert({
       user_id: userId,
       project_id: projectId,
       domain_id: domainId,
       canonical_task_id: canonicalTaskId,  // Link to canonical!
       task_name: taskName,
       description: description,
       notes: notes,
       scheduled_date: date,     // NULL = backlog
       target_value: targetValue,
       timebox_value: timeboxValue,
       timebox_unit: timeboxUnit,
       status: 'pending'
     })
   ```

### Database Triggers (Auto-update)

**Trigger automatically updates canonical_tasks when task_instances change:**
- Insert instance → increment `canonical_tasks.instance_count`
- Delete instance → decrement `canonical_tasks.instance_count`
- Complete instance → update `canonical_tasks.last_performed_at`

---

## Database Schema (High-Level)

### canonical_tasks
- `id`, `user_id`, `project_id`, `domain_id`
- `canonical_name`, `description`
- **`version`** (e.g., "v1.0", "v2")
- **`measure_type`** ("unit", "%", "status", "revisions")
- **`measure_unit`** (e.g., "users", "pages" - when measure_type="unit")
- `instance_count`, `first_created_at`, `last_performed_at`

### task_instances
- `id`, `user_id`, `project_id`, `domain_id`
- **`canonical_task_id`** (FK to canonical_tasks)
- `task_name`, `description`, `notes`
- `scheduled_date` (NULL = backlog)
- `target_value`, `timebox_value`, `timebox_unit`
- `status`, `completed_at`, `actual_time_spent`, `actual_work_completed`, `completion_percentage`

---

## Example Flow

### Scenario 1: First task with version v1.0
```
User creates: "User interviews" v1.0
→ No existing canonicals with v1.0
→ Skip Gemini
→ Create canonical: "User interviews" v1.0
→ Save task instance linked to new canonical
```

### Scenario 2: Similar task, same version
```
User creates: "interview users" v1.0
→ Existing canonical: "User interviews" v1.0
→ Send to Gemini
→ Gemini returns: confidence=0.85, matchFound=true
→ Link task instance to existing canonical (no new canonical created)
```

### Scenario 3: Same name, different version
```
User creates: "User interviews" v2.0
→ No existing canonicals with v2.0 (even though v1.0 exists)
→ Skip Gemini
→ Create NEW canonical: "User interviews" v2.0
→ Save task instance linked to new v2.0 canonical
```

---

## Implementation Phases

1. **Database**: Create migrations for both tables + triggers
2. **Edge Function**: Handle Gemini calls + save logic
3. **Frontend Store**: Zustand store for task state
4. **UI**: Update AddTaskCard to call edge function
5. **Testing**: Verify version filtering + Gemini linking works

---

## Key Points

✅ Version filtering happens BEFORE Gemini (critical!)
✅ Canonical stores: name, version, measure type/unit
✅ Instance stores: target value, timebox, completion data
✅ Gemini only compares within same domain + version
✅ Confidence ≥ 0.75 = auto-link, else create new canonical
✅ Triggers auto-update canonical metadata
