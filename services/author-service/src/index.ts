import { InMemoryCommandBus, InMemoryQueryBus } from '@library/shared-kernel';

// Infrastructure
import {
  config,
  connectMongo,
  closeMongo,
  connectRabbitMQ,
  closeRabbitMQ,
  closePool,
  initializeDatabase,
  PostgresAuthorRepository,
  MongoAuthorReadRepository,
  RabbitMQEventPublisher,
  AuthorProjections,
  createProjectionRouter,
  subscribeToEvents,
  postgresHealthCheck,
  mongoHealthCheck,
  rabbitHealthCheck,
} from './infrastructure/index.js';

// Application
import {
  CreateAuthorCommand,
  UpdateAuthorCommand,
  DeleteAuthorCommand,
  CreateAuthorHandler,
  UpdateAuthorHandler,
  DeleteAuthorHandler,
} from './application/index.js';

/**
 * Author Service Application
 *
 * Wires together:
 * - Databases (PostgreSQL write, MongoDB read)
 * - Message broker (RabbitMQ)
 * - Command/query handlers
 * - Projections (read-model updaters)
 */
export class AuthorServiceApp {
  private commandBus: InMemoryCommandBus;
  private queryBus: InMemoryQueryBus;
  private authorRepository: PostgresAuthorRepository;
  private authorReadRepository: MongoAuthorReadRepository;
  private eventPublisher: RabbitMQEventPublisher;

  constructor() {
    this.commandBus = new InMemoryCommandBus();
    this.queryBus = new InMemoryQueryBus();
    this.authorRepository = new PostgresAuthorRepository();
    this.authorReadRepository = new MongoAuthorReadRepository();
    this.eventPublisher = new RabbitMQEventPublisher();
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Author Service...');
    console.log(`   Environment: ${config.nodeEnv}`);

    await this.connectDatabases();
    this.registerHandlers();
    await this.startProjections();

    console.log('✅ Author Service started successfully!');
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping Author Service...');

    await closeRabbitMQ();
    await closeMongo();
    await closePool();

    console.log('✅ Author Service stopped');
  }

  getCommandBus(): InMemoryCommandBus {
    return this.commandBus;
  }

  getQueryBus(): InMemoryQueryBus {
    return this.queryBus;
  }

  getReadRepository(): MongoAuthorReadRepository {
    return this.authorReadRepository;
  }

  async healthCheck(): Promise<{ postgres: boolean; mongodb: boolean; rabbitmq: boolean }> {
    return {
      postgres: await postgresHealthCheck(),
      mongodb: await mongoHealthCheck(),
      rabbitmq: await rabbitHealthCheck(),
    };
  }

  // ==========================================================================
  // Private methods
  // ==========================================================================

  private async connectDatabases(): Promise<void> {
    console.log('📦 Connecting to databases...');

    await initializeDatabase();
    await connectMongo();
    await connectRabbitMQ();

    console.log('📦 PostgreSQL: Will connect on first query');
  }

  private registerHandlers(): void {
    console.log('📝 Registering command handlers...');

    this.commandBus.register(
      CreateAuthorCommand,
      new CreateAuthorHandler(this.authorRepository, this.eventPublisher)
    );

    this.commandBus.register(
      UpdateAuthorCommand,
      new UpdateAuthorHandler(this.authorRepository, this.eventPublisher)
    );

    this.commandBus.register(
      DeleteAuthorCommand,
      new DeleteAuthorHandler(this.authorRepository, this.eventPublisher)
    );

    console.log('   ✓ CreateAuthorHandler');
    console.log('   ✓ UpdateAuthorHandler');
    console.log('   ✓ DeleteAuthorHandler');
  }

  private async startProjections(): Promise<void> {
    console.log('📊 Starting projections...');

    const projections = new AuthorProjections();
    const router = createProjectionRouter(projections);

    await subscribeToEvents('library.author.*', 'author-service.projections', router);

    console.log('   ✓ Author projections listening on: library.author.*');
  }
}

// ==========================================================================
// Main entry point
// ==========================================================================

const app = new AuthorServiceApp();

const isMainModule = import.meta.url.endsWith(process.argv[1]!.replace(/\\/g, '/'));

if (isMainModule) {
  app.start().catch((error) => {
    console.error('❌ Failed to start Author Service:', error);
    process.exit(1);
  });
}

const shutdown = async () => {
  await app.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { app };
