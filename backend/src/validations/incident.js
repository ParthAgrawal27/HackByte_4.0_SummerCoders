import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  alert: z.string().min(1, 'Alert message is required'),
  logs: z.string().optional(),
  runbook: z.string().optional(),
});
