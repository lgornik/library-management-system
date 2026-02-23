import amqp from 'amqplib';
import { DomainEvent, IDomainEventPublisher } from '@library/shared-kernel';
import { config } from '../config/index.js';

let connection: any = null;
let channel: any = null;

const EXCHANGE_NAME = 'library.events';
const EXCHANGE_TYPE = 'topic';

export async function connectRabbitMQ(): Promise<any> {
  if (channel) {
    return channel;
  }

  try {
    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
      durable: true,
    });

    console.log('🐰 RabbitMQ: Connected successfully');

    connection.on('close', () => {
      console.log('🐰 RabbitMQ: Connection closed');
      connection = null;
      channel = null;
    });

    connection.on('error', (err: Error) => {
      console.error('❌ RabbitMQ connection error:', err);
    });

    return channel;
  } catch (error) {
    console.error('❌ RabbitMQ connection error:', error);
    throw error;
  }
}

export function getChannel(): any {
  if (!channel) {
    throw new Error('RabbitMQ not connected. Call connectRabbitMQ() first.');
  }
  return channel;
}

export async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log('🐰 RabbitMQ: Connection closed');
  } catch (error) {
    console.error('❌ Error closing RabbitMQ:', error);
  }
}

export class RabbitMQEventPublisher implements IDomainEventPublisher {
  async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
    const ch = getChannel();
    const routingKey = event.eventName;
    const message = Buffer.from(JSON.stringify(event.toJSON()));

    ch.publish(EXCHANGE_NAME, routingKey, message, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
      messageId: event.eventId,
      headers: {
        eventName: event.eventName,
        aggregateId: event.getAggregateId(),
        correlationId: event.metadata.correlationId,
      },
    });

    console.log(`📤 Event published: ${event.eventName}`, {
      eventId: event.eventId,
      aggregateId: event.getAggregateId(),
    });
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}

export async function subscribeToEvents(
  eventPattern: string,
  queueName: string,
  handler: (event: { eventName: string; payload: unknown; metadata: unknown }) => Promise<void>
): Promise<void> {
  const ch = getChannel();

  await ch.assertQueue(queueName, { durable: true });
  await ch.bindQueue(queueName, EXCHANGE_NAME, eventPattern);
  await ch.prefetch(1);

  console.log(`🐰 Subscribed to: ${eventPattern} -> ${queueName}`);

  await ch.consume(
    queueName,
    async (msg: any) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        console.log(`📥 Event received: ${event.eventName}`, { eventId: event.eventId });

        await handler(event);
        ch.ack(msg);
      } catch (error) {
        console.error('❌ Error processing event:', error);
        ch.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}

export async function healthCheck(): Promise<boolean> {
  return channel !== null && connection !== null;
}