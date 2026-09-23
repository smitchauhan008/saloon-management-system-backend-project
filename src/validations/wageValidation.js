const { z } = require('zod');

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const wageCalculationQuerySchema = z.object({
  month: z.string().regex(monthRegex, 'Month must be in YYYY-MM format (e.g., 2026-08)').optional(),
  barber_id: z.string().regex(objectIdRegex, 'Invalid Barber ID format').optional()
});

const wageFinalizeSchema = z.object({
  barber_id: z.string().regex(objectIdRegex, 'Valid barber_id is required'),
  month: z.string().regex(monthRegex, 'Month must be in YYYY-MM format (e.g., 2026-08)'),
  salary: z.number().min(0, 'Salary cannot be negative').default(0),
  commission: z.number().min(0, 'Commission cannot be negative').optional()
});

const wageQuerySchema = z.object({
  month: z.string().regex(monthRegex, 'Month must be in YYYY-MM format (e.g., 2026-08)').optional(),
  barber_id: z.string().regex(objectIdRegex, 'Invalid Barber ID format').optional()
});

module.exports = {
  wageCalculationQuerySchema,
  wageFinalizeSchema,
  wageQuerySchema
};
