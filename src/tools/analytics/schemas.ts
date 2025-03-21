import { z } from 'zod';

export const WalletAnalyticsSchema = z.object({
  address: z
    .string()
    .optional()
    .describe('The wallet address to analyze (defaults to user wallet if not provided)'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe('Number of transactions to analyze (max 100)'),
});
