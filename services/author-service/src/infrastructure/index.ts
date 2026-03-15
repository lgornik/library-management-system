// Configuration
export { config } from './config/index.js';

// Write persistence (PostgreSQL)
export {
  getPool,
  closePool,
  query,
  transaction,
  healthCheck as postgresHealthCheck,
  initializeDatabase,
  PostgresAuthorRepository,
} from './persistence/write/index.js';

// Read persistence (MongoDB)
export {
  connectMongo,
  closeMongo,
  getDb,
  getCollection,
  Collections,
  healthCheck as mongoHealthCheck,
  MongoAuthorReadRepository,
  type AuthorDocument,
} from './persistence/read/index.js';

// Messaging (RabbitMQ)
export {
  connectRabbitMQ,
  closeRabbitMQ,
  RabbitMQEventPublisher,
  subscribeToEvents,
  healthCheck as rabbitHealthCheck,
  AuthorProjections,
  createProjectionRouter,
} from './messaging/index.js';
