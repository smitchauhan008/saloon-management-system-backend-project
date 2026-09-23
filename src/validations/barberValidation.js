const { z } = require('zod');

const barberCreateSchema = z.object({
  user_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ObjectId reference ID'),
  specialization: z.string().min(2, 'Specialization must be at least 2 characters').max(100).nullable().optional(),
  commission_percentage: z.number().min(0, 'Commission cannot be negative').max(100, 'Commission cannot exceed 100%'),
  joining_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid joining date format'
  })
});

const barberUpdateSchema = barberCreateSchema.partial();

module.exports = {
  barberCreateSchema,
  barberUpdateSchema
};
