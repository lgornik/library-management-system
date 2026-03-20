import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  server: z.object({
    port: z.coerce.number().default(4001),
  }),
});

function loadConfig() {
  const result = configSchema.safeParse({
    nodeEnv: process.env['NODE_ENV'],
    server: {
      port: process.env['API_GATEWAY_PORT'],
    },
  });

  if (!result.success) {
    console.error('❌ Invalid configuration:', result.error.format());
    throw new Error('Invalid configuration');
  }

  return result.data;
}

export const config = loadConfig();

export type Config = typeof config;
