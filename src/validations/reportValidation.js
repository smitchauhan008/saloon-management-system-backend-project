const { z } = require('zod');

const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const yearRegex = /^\d{4}$/;

const dailyReportQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format (e.g., 2026-08-15)').optional()
});

const monthlyReportQuerySchema = z.object({
  year: z.string().regex(yearRegex, 'Year must be a 4-digit year (e.g., 2026)').optional()
});

const topServicesQuerySchema = z.object({
  limit: z.preprocess((val) => (val !== undefined ? parseInt(val, 10) : 5), z.number().min(1).max(50)).optional()
});

const customerVisitsQuerySchema = z.object({
  limit: z.preprocess((val) => (val !== undefined ? parseInt(val, 10) : 10), z.number().min(1).max(100)).optional()
});

module.exports = {
  dailyReportQuerySchema,
  monthlyReportQuerySchema,
  topServicesQuerySchema,
  customerVisitsQuerySchema
};
