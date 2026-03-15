import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { config } from './config/index.js';
import { startServices, stopServices } from './services/index.js';
import { schema } from './schema/index.js';

async function bootstrap(): Promise<void> {
  console.log('🚀 Starting API Gateway...');
  console.log(`   Environment: ${config.nodeEnv}`);

  // ---------------------------------------------------------------------------
  // 1. Start underlying microservices
  // ---------------------------------------------------------------------------
  await startServices();

  // ---------------------------------------------------------------------------
  // 2. Create Express + HTTP server
  // ---------------------------------------------------------------------------
  const app = express();
  const httpServer = http.createServer(app);

  // ---------------------------------------------------------------------------
  // 3. Create Apollo Server
  // ---------------------------------------------------------------------------
  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: config.nodeEnv !== 'production',
  });

  await server.start();

  // ---------------------------------------------------------------------------
  // 4. Mount GraphQL middleware
  // ---------------------------------------------------------------------------
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server),
  );

  // ---------------------------------------------------------------------------
  // 5. Health endpoint (REST)
  // ---------------------------------------------------------------------------
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ---------------------------------------------------------------------------
  // 6. Start listening
  // ---------------------------------------------------------------------------
  await new Promise<void>((resolve) => {
    httpServer.listen(config.server.port, resolve);
  });

  console.log(`✅ API Gateway ready at http://localhost:${config.server.port}/graphql`);

  // ---------------------------------------------------------------------------
  // 7. Graceful shutdown
  // ---------------------------------------------------------------------------
  const shutdown = async () => {
    console.log('\n🛑 Shutting down API Gateway...');
    await server.stop();
    await stopServices();
    httpServer.close();
    console.log('✅ API Gateway stopped');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start API Gateway:', error);
  process.exit(1);
});
