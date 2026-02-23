export {
  connectRabbitMQ,
  closeRabbitMQ,
  getChannel,
  RabbitMQEventPublisher,
  subscribeToEvents,
  healthCheck,
} from './rabbitmq.js';

export { BookProjections, createProjectionRouter } from './BookProjections.js';
