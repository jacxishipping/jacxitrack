const { z } = require('zod');
const { isValidContainerNumber, normalizeContainerNumber } = require('./containerNumber');
const { AppError } = require('./AppError');

const containerNumber = z.string()
  .transform(normalizeContainerNumber)
  .refine(isValidContainerNumber, 'containerNumber must be a valid ISO 6346 number');

const createContainerSchema = z.object({
  containerNumber,
  currentStatus: z.string().trim().min(1).max(100),
  containerData: z.record(z.unknown()).optional().default({})
}).strict();

const statusUpdateSchema = z.object({
  currentStatus: z.string().trim().min(1).max(100),
  containerData: z.record(z.unknown()).optional()
}).strict();

const listContainersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().trim().min(1).max(100).optional()
}).strict();

function validate(schema, location) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[location]);
    if (!parsed.success) {
      return next(new AppError(400, 'Validation failed', parsed.error.flatten()));
    }
    req[location] = parsed.data;
    next();
  };
}

module.exports = { containerNumber, createContainerSchema, statusUpdateSchema, listContainersSchema, validate };
