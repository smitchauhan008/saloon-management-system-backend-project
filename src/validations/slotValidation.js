const { z } = require('zod');

const slotQuerySchema = z.object({
  barber_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Barber reference ID').optional(),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date parameter. Use YYYY-MM-DD'
  }),
  service_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Service reference ID').optional()
});

const slotBlockCreateSchema = z.object({
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Use YYYY-MM-DD'
  }),
  type: z.enum(['Holiday', 'CustomBlock', 'Maintenance']).default('Holiday').optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid start time format (HH:MM)').nullable().optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid end time format (HH:MM)').nullable().optional(),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  barber_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Barber reference ID').nullable().optional()
});

module.exports = {
  slotQuerySchema,
  slotBlockCreateSchema
};
