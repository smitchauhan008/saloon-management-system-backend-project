const { z } = require('zod');

const appointmentCreateSchema = z.object({
  customer_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Customer reference ID'),
  barber_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Barber reference ID'),
  service_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Service reference ID'),
  appointment_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid appointment date format'
  }),
  appointment_time: z.string().nullable().optional(),
  status: z.enum(['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']).default('Pending').optional(),
  remarks: z.string().nullable().optional()
});

const appointmentUpdateSchema = z.object({
  customer_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Customer reference ID').optional(),
  barber_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Barber reference ID').optional(),
  service_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Service reference ID').optional(),
  appointment_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid appointment date format'
  }).optional(),
  appointment_time: z.string().nullable().optional(),
  status: z.enum(['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']).optional(),
  remarks: z.string().nullable().optional()
});

const appointmentStatusUpdateSchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'], {
    errorMap: () => ({ message: 'Status must be one of: Pending, Confirmed, In Progress, Completed, Cancelled' })
  }),
  remarks: z.string().nullable().optional()
});

module.exports = {
  appointmentCreateSchema,
  appointmentUpdateSchema,
  appointmentStatusUpdateSchema
};
