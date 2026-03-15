import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  postgres: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().default(5432),
    user: z.string().default('postgres'),
    password: z.string().default('postgres'),
    database: z.string().default('library_authors'),
    ssl: z.boolean().default(false),
  }),

  mongodb: z.object({
    url: z.string().default('mongodb://mongo:mongo@localhost:27017/library_read?authSource=admin'),
  }),

  redis: z.object({
    url: z.string().default('redis://localhost:6379'),
  }),

  rabbitmq: z.object({
    url: z.string().default('amqp://rabbit:rabbit@localhost:5672'),
  }),

  grpc: z.object({
    port: z.coerce.number().default(50052),
  }),
});

function loadConfig() {
  const result = configSchema.safeParse({
    nodeEnv: process.env['NODE_ENV'],
    postgres: {
      host: process.env['POSTGRES_HOST'],
      port: process.env['POSTGRES_PORT'],
      user: process.env['POSTGRES_USER'],
      password: process.env['POSTGRES_PASSWORD'],
      database: process.env['POSTGRES_DB'] || 'library_authors',
      ssl: process.env['POSTGRES_SSL'] === 'true',
    },
    mongodb: {
      url: process.env['MONGODB_URL'],
    },
    redis: {
      url: process.env['REDIS_URL'],
    },
    rabbitmq: {
      url: process.env['RABBITMQ_URL'],
    },
    grpc: {
      port: process.env['AUTHOR_SERVICE_GRPC_PORT'],
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
