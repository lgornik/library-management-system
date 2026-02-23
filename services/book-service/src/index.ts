import { InMemoryCommandBus, InMemoryQueryBus } from '@library/shared-kernel';

// Infrastructure
import {
  config,
  connectMongo,
  closeMongo,
  connectRabbitMQ,
  closeRabbitMQ,
  closePool,
  PostgresBookRepository,
  MongoBookReadRepository,
  RabbitMQEventPublisher,
  BookProjections,
  createProjectionRouter,
  subscribeToEvents,
  postgresHealthCheck,
  mongoHealthCheck,
  rabbitHealthCheck,
} from './infrastructure/index.js';

// Application
import {
  CreateBookCommand,
  UpdateBookCommand,
  DeleteBookCommand,
  MarkBookAsFinishedCommand,
  AddQuoteCommand,
  CreateBookHandler,
  UpdateBookHandler,
  DeleteBookHandler,
  MarkBookAsFinishedHandler,
  AddQuoteHandler,
} from './application/index.js';

/**
 * Book Service Application
 *
 * This is the main entry point that wires everything together:
 * - Connects to databases (PostgreSQL, MongoDB)
 * - Connects to message broker (RabbitMQ)
 * - Registers command/query handlers
 * - Starts event subscriptions for projections
 */
export class BookServiceApp {
  private commandBus: InMemoryCommandBus;
  private queryBus: InMemoryQueryBus;
  private bookRepository: PostgresBookRepository;
  private bookReadRepository: MongoBookReadRepository;
  private eventPublisher: RabbitMQEventPublisher;

  constructor() {
    this.commandBus = new InMemoryCommandBus();
    this.queryBus = new InMemoryQueryBus();
    this.bookRepository = new PostgresBookRepository();
    this.bookReadRepository = new MongoBookReadRepository();
    this.eventPublisher = new RabbitMQEventPublisher();
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    console.log('🚀 Starting Book Service...');
    console.log(`   Environment: ${config.nodeEnv}`);

    // Connect to databases
    await this.connectDatabases();

    // Register command handlers
    this.registerHandlers();

    // Start event subscriptions (projections)
    await this.startProjections();

    console.log('✅ Book Service started successfully!');
  }

  /**
   * Stop the service gracefully
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Book Service...');

    await closeRabbitMQ();
    await closeMongo();
    await closePool();

    console.log('✅ Book Service stopped');
  }

  /**
   * Get the command bus for executing commands
   */
  getCommandBus(): InMemoryCommandBus {
    return this.commandBus;
  }

  /**
   * Get the query bus for executing queries
   */
  getQueryBus(): InMemoryQueryBus {
    return this.queryBus;
  }

  /**
   * Get the read repository for direct queries
   */
  getReadRepository(): MongoBookReadRepository {
    return this.bookReadRepository;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    postgres: boolean;
    mongodb: boolean;
    rabbitmq: boolean;
  }> {
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

    // Connect to MongoDB (Read Model)
    await connectMongo();

    // Connect to RabbitMQ (Event Bus)
    await connectRabbitMQ();

    // PostgreSQL connects lazily on first query
    console.log('📦 PostgreSQL: Will connect on first query');
  }

  private registerHandlers(): void {
    console.log('📝 Registering command handlers...');

    // Register command handlers
    this.commandBus.register(
      CreateBookCommand,
      new CreateBookHandler(this.bookRepository, this.eventPublisher)
    );

    this.commandBus.register(
      UpdateBookCommand,
      new UpdateBookHandler(this.bookRepository, this.eventPublisher)
    );

    this.commandBus.register(
      DeleteBookCommand,
      new DeleteBookHandler(this.bookRepository, this.eventPublisher)
    );

    this.commandBus.register(
      MarkBookAsFinishedCommand,
      new MarkBookAsFinishedHandler(this.bookRepository, this.eventPublisher)
    );

    this.commandBus.register(
      AddQuoteCommand,
      new AddQuoteHandler(this.bookRepository, this.eventPublisher)
    );

    console.log('   ✓ CreateBookHandler');
    console.log('   ✓ UpdateBookHandler');
    console.log('   ✓ DeleteBookHandler');
    console.log('   ✓ MarkBookAsFinishedHandler');
    console.log('   ✓ AddQuoteHandler');
  }

  private async startProjections(): Promise<void> {
    console.log('📊 Starting projections...');

    const projections = new BookProjections();
    const router = createProjectionRouter(projections);

    // Subscribe to all book events
    await subscribeToEvents(
      'library.book.*',
      'book-service.projections',
      router
    );

    console.log('   ✓ Book projections listening on: library.book.*');
  }
}

// ==========================================================================
// Main entry point
// ==========================================================================

const app = new BookServiceApp();

// Handle shutdown signals
process.on('SIGINT', async () => {
  await app.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await app.stop();
  process.exit(0);
});

// Start the service
app.start().catch((error) => {
  console.error('❌ Failed to start Book Service:', error);
  process.exit(1);
});

export { app };
