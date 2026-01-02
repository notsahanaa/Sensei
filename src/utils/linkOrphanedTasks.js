import { supabase } from '../lib/supabase'

/**
 * Links orphaned tasks (tasks with canonical_task_id = NULL) to canonical tasks
 * Creates new canonical tasks if no match is found
 */
export async function linkOrphanedTasks(projectId) {
  try {
    console.log('🔧 Starting orphaned task linking process...')

    // Get all orphaned tasks for this project
    const { data: orphanedTasks, error: orphanedError } = await supabase
      .from('task_instances')
      .select('*')
      .eq('project_id', projectId)
      .is('canonical_task_id', null)

    if (orphanedError) throw orphanedError

    console.log(`Found ${orphanedTasks?.length || 0} orphaned tasks`)

    if (!orphanedTasks || orphanedTasks.length === 0) {
      console.log('✅ No orphaned tasks to link')
      return { success: true, linked: 0, created: 0 }
    }

    let linkedCount = 0
    let createdCount = 0

    for (const task of orphanedTasks) {
      console.log(`Processing task: "${task.task_name}"`)

      // Check if a canonical task already exists with the same name, domain, and version
      const { data: existingCanonical } = await supabase
        .from('canonical_tasks')
        .select('id')
        .eq('project_id', projectId)
        .eq('domain_id', task.domain_id)
        .eq('canonical_name', task.task_name.trim())
        .eq('version', task.version || null)
        .single()

      let canonicalTaskId

      if (existingCanonical) {
        // Link to existing canonical task
        canonicalTaskId = existingCanonical.id
        console.log(`  ✓ Found existing canonical task: ${canonicalTaskId}`)
      } else {
        // Create new canonical task
        const { data: { user } } = await supabase.auth.getUser()

        const { data: newCanonical, error: createError } = await supabase
          .from('canonical_tasks')
          .insert({
            user_id: user.id,
            project_id: projectId,
            domain_id: task.domain_id,
            canonical_name: task.task_name.trim(),
            description: task.description || null,
            version: task.version || null,
          })
          .select()
          .single()

        if (createError) {
          console.error(`  ✗ Error creating canonical task:`, createError)
          continue
        }

        canonicalTaskId = newCanonical.id
        createdCount++
        console.log(`  ✓ Created new canonical task: ${canonicalTaskId}`)
      }

      // Update the task instance with canonical_task_id
      const { error: updateError } = await supabase
        .from('task_instances')
        .update({ canonical_task_id: canonicalTaskId })
        .eq('id', task.id)

      if (updateError) {
        console.error(`  ✗ Error updating task instance:`, updateError)
        continue
      }

      linkedCount++
      console.log(`  ✓ Linked task instance to canonical task`)
    }

    console.log(`✅ Process complete!`)
    console.log(`   - Tasks linked: ${linkedCount}`)
    console.log(`   - Canonical tasks created: ${createdCount}`)

    return { success: true, linked: linkedCount, created: createdCount }
  } catch (error) {
    console.error('❌ Error linking orphaned tasks:', error)
    return { success: false, error: error.message }
  }
}
