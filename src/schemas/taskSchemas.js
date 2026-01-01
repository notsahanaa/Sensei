import { z } from 'zod'

// Task Instance Schema (for creating new tasks)
export const taskInstanceSchema = z.object({
  taskName: z.string()
    .min(1, 'Task name is required')
    .max(200, 'Task name is too long'),

  description: z.string()
    .max(1000, 'Description is too long')
    .optional()
    .nullable(),

  notes: z.string()
    .max(2000, 'Notes are too long')
    .optional()
    .nullable(),

  projectId: z.string()
    .uuid('Invalid project ID'),

  domainId: z.string()
    .uuid('Invalid domain ID'),

  version: z.string()
    .max(50, 'Version is too long')
    .optional()
    .nullable(),

  measureType: z.enum(['unit', 'percentage', 'status', 'revisions'])
    .optional()
    .nullable(),

  measureUnit: z.string()
    .max(50, 'Measure unit is too long')
    .optional()
    .nullable(),

  scheduledDate: z.string()
    .nullable()
    .optional(), // ISO date string or null for backlog

  targetValue: z.number()
    .positive('Target value must be positive')
    .optional()
    .nullable(),

  timeboxValue: z.number()
    .positive('Timebox value must be positive')
    .optional()
    .nullable(),

  timeboxUnit: z.enum(['mins', 'hrs'])
    .optional()
    .nullable()
})

// Update Task Schema (allows partial updates)
export const updateTaskSchema = taskInstanceSchema.partial().extend({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  completedAt: z.string().optional().nullable(), // ISO datetime string
  actualTimeSpent: z.number().optional().nullable(), // In minutes
  actualWorkCompleted: z.string().optional().nullable(),
  completionPercentage: z.number().min(0).max(100).optional().nullable()
})

// Canonical Task Schema
export const canonicalTaskSchema = z.object({
  canonicalName: z.string()
    .min(1, 'Canonical name is required')
    .max(200, 'Canonical name is too long'),

  description: z.string()
    .max(1000, 'Description is too long')
    .optional()
    .nullable(),

  projectId: z.string().uuid(),

  domainId: z.string().uuid(),

  version: z.string()
    .max(50, 'Version is too long')
    .optional()
    .nullable(),

  measureType: z.enum(['unit', 'percentage', 'status', 'revisions'])
    .optional()
    .nullable(),

  measureUnit: z.string()
    .max(50, 'Measure unit is too long')
    .optional()
    .nullable()
})
