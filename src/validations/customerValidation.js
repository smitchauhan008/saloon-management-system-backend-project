const { z } = require('zod');

const customerCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(5, 'Phone number must be at least 5 digits').max(20),
  email: z.string().email('Invalid email address').nullable().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).nullable().optional()
});

const customerUpdateSchema = customerCreateSchema.partial();

module.exports = {
  customerCreateSchema,
  customerUpdateSchema
};
