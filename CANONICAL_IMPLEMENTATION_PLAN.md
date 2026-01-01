# Safe Canonical Task System Implementation Plan

## Goal
Re-implement the canonical task system with Gemini AI grouping WITHOUT breaking existing Tasks and Productivity features.

## Current State
- Database: ONLY `task_instances` table (working perfectly)
- Edge function: Exists in code but NOT being used
- State management: Direct Supabase inserts via Zustand store
- All features: Tasks tab, Productivity tab fully functional

## Target State
- Database: `task_instances` + `canonical_tasks` (linked via FK)
- Edge function: Active for new task creation with Gemini grouping
- State management: Store calls edge function for creates, direct Supabase for updates/deletes
- All features: Continue working + Progress tab gets canonical grouping data

---

## Implementation Strategy: Incremental & Safe

### Phase 1: Database Foundation (Additive Only)
**Goal:** Add canonical_tasks table and FK column WITHOUT affecting existing data

**Steps:**
1. Create new migration file: `20260101000002_add_canonical_tasks.sql`
2. Add `canonical_tasks` table with all necessary columns
3. Add `canonical_task_id` column to `task_instances` (NULLABLE, default NULL)
4. Add foreign key constraint with CASCADE behavior
5. Create RLS policies for `canonical_tasks`
6. Create indexes for performance

**Safety guarantees:**
- Existing `task_instances` rows remain unchanged (canonical_task_id = NULL)
- All existing queries continue to work (no breaking changes)
- Can roll back by dropping new table/column if needed

**Testing checklist:**
- [ ] Existing tasks still load in Tasks tab
- [ ] Can still create tasks via current flow
- [ ] Can still complete tasks
- [ ] Productivity tab still works
- [ ] No RLS errors

---

### Phase 2: Edge Function Testing (Isolated)
**Goal:** Verify edge function works WITHOUT connecting it to frontend

**Steps:**
1. Review existing `/supabase/functions/create-task/index.ts`
2. Update edge function to work with new schema
3. Test edge function directly via Supabase dashboard or curl
4. Verify Gemini API calls work correctly
5. Test similarity matching with sample tasks
6. Test fallback logic if Gemini fails

**Safety guarantees:**
- Frontend still uses direct inserts (unchanged)
- Edge function tested in isolation before integration
- Can debug edge function without affecting users

**Testing checklist:**
- [ ] Edge function deploys successfully
- [ ] Creates canonical task for new unique task
- [ ] Links to existing canonical when similarity ≥ 0.75
- [ ] Handles Gemini timeout/errors gracefully (fallback)
- [ ] Returns correct data structure
- [ ] No RLS violations

---

### Phase 3: Hybrid Store Integration (Optional Edge Function)
**Goal:** Make edge function available but not required

**Steps:**
1. Add feature flag to control edge function usage
2. Update `useTaskStore.createTask()` to:
   - Try edge function first
   - Fall back to direct insert if edge function fails
   - Log which method was used
3. Enable edge function for NEW tasks only (not updates/deletes)
4. Monitor for errors and success rate

**Code pattern:**
```javascript
createTask: async (taskData) => {
  try {
    // Try edge function first (with timeout)
    const edgeFunctionResult = await supabase.functions.invoke('create-task', {
      body: taskData
    })

    if (edgeFunctionResult.data && !edgeFunctionResult.error) {
      // Success with canonical grouping
      set((state) => ({ tasks: [edgeFunctionResult.data, ...state.tasks] }))
      return { success: true, data: edgeFunctionResult.data }
    }

    // Fallback to direct insert
    console.warn('Edge function failed, using direct insert')
    return await directInsert(taskData)

  } catch (error) {
    // Fallback to direct insert
    console.error('Edge function error:', error)
    return await directInsert(taskData)
  }
}
```

**Safety guarantees:**
- If edge function fails, task creation still works (direct insert)
- Users never see errors or blocked task creation
- Can gradually monitor and fix edge function issues
- Easy to disable edge function via feature flag

**Testing checklist:**
- [ ] New tasks created successfully (either path)
- [ ] Canonical grouping works when edge function succeeds
- [ ] Direct insert fallback works when edge function fails
- [ ] No duplicate tasks created
- [ ] All existing features still work

---

### Phase 4: Gradual Rollout (Monitor & Fix)
**Goal:** Use edge function for all new tasks, monitor for issues

**Steps:**
1. Enable edge function for all users
2. Monitor Supabase edge function logs
3. Track success/fallback ratio
4. Fix any Gemini API issues
5. Optimize similarity matching if needed

**Monitoring metrics:**
- Edge function success rate
- Average Gemini response time
- Fallback usage frequency
- RLS policy violations
- Task creation errors

**Safety guarantees:**
- Can disable edge function anytime via feature flag
- Fallback always available
- No data loss even if edge function breaks

---

### Phase 5: Retroactive Grouping (Optional)
**Goal:** Link existing task_instances to canonical tasks

**Steps:**
1. Create admin script to process existing tasks
2. Run Gemini similarity on historical tasks
3. Update canonical_task_id for matched tasks
4. Create new canonical tasks for unmatched tasks
5. Run in batches to avoid timeouts

**Safety guarantees:**
- Optional - system works fine without this
- Non-destructive (only updates canonical_task_id)
- Can run multiple times (idempotent)
- Can be paused/resumed

---

### Phase 6: Progress Tab Implementation
**Goal:** Build Progress page with canonical groupings

**Steps:**
1. Create queries to fetch canonical tasks with instance counts
2. Build Progress tab UI (kanban with milestones)
3. Group task instances by canonical task
4. Show metrics at canonical level (total completions, time spent, etc.)
5. Allow drilling down to see individual instances

---

## Rollback Plan

### If edge function fails:
1. Disable feature flag → all tasks use direct insert
2. No data loss, system continues working
3. Debug edge function offline

### If canonical grouping is wrong:
1. Canonical links don't affect Tasks/Productivity tabs
2. Can update canonical_task_id manually if needed
3. Can adjust Gemini confidence threshold

### If migration causes issues:
1. Can drop `canonical_tasks` table
2. Can drop `canonical_task_id` column from `task_instances`
3. Revert to previous migration state

---

## Risk Assessment

### Low Risk (Safe to proceed):
- Database migration (additive, non-breaking)
- Edge function in isolation (not connected to frontend)
- Hybrid store with fallback (graceful degradation)

### Medium Risk (Needs monitoring):
- Gemini API reliability (handle with fallback)
- Edge function performance (monitor response times)
- Similarity matching accuracy (can be tuned)

### High Risk (DO NOT DO):
- Removing direct insert path (always keep fallback)
- Making canonical_task_id required (must be nullable)
- Auto-updating existing tasks without review

---

## Success Criteria

### Phase 1 (Database):
- [ ] Migration runs successfully
- [ ] All existing features work unchanged
- [ ] No performance degradation

### Phase 2-3 (Edge Function):
- [ ] Edge function creates/links canonical tasks
- [ ] Fallback works when needed
- [ ] Task creation never fails

### Phase 4-6 (Full System):
- [ ] 90%+ edge function success rate
- [ ] Canonical grouping is accurate (subjective but should be reasonable)
- [ ] Progress tab shows meaningful groupings

---

## Timeline Estimate

1. **Phase 1 (Database):** 30 minutes
   - Write migration, test locally, deploy

2. **Phase 2 (Edge Function Testing):** 1 hour
   - Update edge function, test with curl/dashboard

3. **Phase 3 (Hybrid Integration):** 1 hour
   - Update store, add fallback logic, test frontend

4. **Phase 4 (Monitor):** Ongoing
   - Watch logs, fix issues as they appear

5. **Phase 5 (Retroactive):** Optional, 2-3 hours
   - Write script, test on subset, run full batch

6. **Phase 6 (Progress Tab):** 2-3 hours
   - Build UI, implement queries, test functionality

**Total active development:** ~5-6 hours spread across multiple sessions

---

## Next Steps

1. Review this plan and confirm approach
2. Start with Phase 1 (database migration)
3. Test thoroughly at each phase before proceeding
4. Can pause/stop at any phase if issues arise

**Question for user:** Does this approach look good? Should we proceed with Phase 1?
