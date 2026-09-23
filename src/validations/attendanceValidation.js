const { z } = require('zod');

const checkInSchema = z.object({
  barber_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Barber reference ID').optional(),
  check_in: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid check_in datetime format'
  }).optional()
});

const checkOutSchema = z.object({
  barber_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Barber reference ID').optional(),
  check_out: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid check_out datetime format'
  }).optional()
});

const attendanceFilterSchema = z.object({
  barber_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Barber reference ID').optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

module.exports = {
  checkInSchema,
  checkOutSchema,
  attendanceFilterSchema
};
