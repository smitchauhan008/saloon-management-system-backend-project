const { z } = require('zod');

const serviceCreateSchema = z.object({
  service_name: z.string().min(2, 'Service name must be at least 2 characters').max(100).optional(),
  name: z.string().min(2, 'Service name must be at least 2 characters').max(100).optional(),
  duration: z.number().int().positive('Duration must be a positive integer in minutes'),
  price: z.number().positive('Price must be a positive number'),
  description: z.string().nullable().optional()
}).refine(data => data.service_name || data.name, {
  message: 'Service name (or name) is required',
  path: ['service_name']
});

const serviceUpdateSchema = z.object({
  service_name: z.string().min(2, 'Service name must be at least 2 characters').max(100).optional(),
  name: z.string().min(2, 'Service name must be at least 2 characters').max(100).optional(),
  duration: z.number().int().positive('Duration must be a positive integer in minutes').optional(),
  price: z.number().positive('Price must be a positive number').optional(),
  description: z.string().nullable().optional()
});

module.exports = {
  serviceCreateSchema,
  serviceUpdateSchema
};
