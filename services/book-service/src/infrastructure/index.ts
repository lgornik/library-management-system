// Configuration
export { config } from './config/index.js';

// Write persistence (PostgreSQL)
export {
  getPool,
  closePool,
  query,
  transaction,
  healthCheck as postgresHealthCheck,
  PostgresBookRepository,
} from './persistence/write/index.js';

// Read persistence (MongoDB)
export {
  connectMongo,
  closeMongo,
  getDb,
  getCollection,
  Collections,
  healthCheck as mongoHealthCheck,
  MongoBookReadRepository,
  type BookDocument,
} from './persistence/read/index.js';

// Messaging (RabbitMQ)
export {
  connectRabbitMQ,
  closeRabbitMQ,
  RabbitMQEventPublisher,
  subscribeToEvents,
  healthCheck as rabbitHealthCheck,
  BookProjections,
  createProjectionRouter,
} from './messaging/index.js';
