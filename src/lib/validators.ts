import { z } from 'zod';

export const claimRequestSchema = z.object({
  playerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  score: z.number().int().min(0).max(10000),
  sessionId: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid session ID'),
  timestamp: z.number().int().positive()
});

export const getClaimSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  score: z.string().regex(/^\d+$/),
  timestamp: z.string().regex(/^\d+$/).optional()
});

export function validateClaimRequest(data: unknown) {
  return claimRequestSchema.safeParse(data);
}