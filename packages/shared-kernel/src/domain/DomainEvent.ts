import { v4 as uuidv4 } from 'uuid';

/**
 * Metadata attached to every domain event
 */
export interface EventMetadata {
  /** Unique identifier of the event */
  eventId: string;
  /** When the event occurred */
  occurredAt: Date;
  /** Optional correlation ID for tracking related events */
  correlationId?: string;
  /** Optional causation ID (ID of the event that caused this one) */
  causationId?: string;
  /** Optional user ID who triggered the action */
  userId?: string;
  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Base class for Domain Events.
 *
 * Domain Events represent something important that happened in the domain.
 * They are immutable facts that have occurred in the past.
 *
 * @example
 * interface BookCreatedPayload {
 *   bookId: string;
 *   title: string;
 *   authorId: string;
 *   pageCount: number;
 * }
 *
 * class BookCreatedEvent extends DomainEvent<BookCreatedPayload> {
 *   static readonly EVENT_NAME = 'library.book.created';
 *
 *   constructor(payload: BookCreatedPayload) {
 *     super(BookCreatedEvent.EVENT_NAME, payload);
 *   }
 * }
 */
export abstract class DomainEvent<TPayload = unknown> {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly metadata: EventMetadata;

  protected constructor(
    public readonly eventName: string,
    public readonly payload: TPayload,
    metadata?: Partial<EventMetadata>
  ) {
    this.eventId = metadata?.eventId ?? uuidv4();
    this.occurredAt = metadata?.occurredAt ?? new Date();
    this.metadata = {
      eventId: this.eventId,
      occurredAt: this.occurredAt,
      correlationId: metadata?.correlationId,
      causationId: metadata?.causationId,
      userId: metadata?.userId,
    };

    // Freeze the event to ensure immutability
    Object.freeze(this.payload);
    Object.freeze(this.metadata);
    Object.freeze(this);
  }

  /**
   * Get the aggregate ID this event belongs to.
   * Override this in subclasses to extract the aggregate ID from the payload.
   */
  getAggregateId(): string | undefined {
    const payload = this.payload as Record<string, unknown>;
    return (payload['aggregateId'] as string) ?? (payload['id'] as string);
  }

  /**
   * Serialize the event for transport/storage
   */
  toJSON(): {
    eventId: string;
    eventName: string;
    payload: TPayload;
    occurredAt: string;
    metadata: EventMetadata;
  } {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      payload: this.payload,
      occurredAt: this.occurredAt.toISOString(),
      metadata: this.metadata,
    };
  }

  /**
   * Create event with correlation/causation tracking
   */
  withCorrelation(correlationId: string, causationId?: string): this {
    const Constructor = this.constructor as new (
      payload: TPayload,
      metadata?: Partial<EventMetadata>
    ) => this;

    return new Constructor(this.payload, {
      ...this.metadata,
      correlationId,
      causationId: causationId ?? this.eventId,
    });
  }
}

/**
 * Interface for domain event handlers
 */
export interface IDomainEventHandler<TEvent extends DomainEvent = DomainEvent> {
  handle(event: TEvent): Promise<void>;
}

/**
 * Interface for the domain event publisher
 */
export interface IDomainEventPublisher {
  publish<TEvent extends DomainEvent>(event: TEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

/**
 * Interface for domain event subscriber
 */
export interface IDomainEventSubscriber {
  subscribe<TEvent extends DomainEvent>(
    eventName: string,
    handler: IDomainEventHandler<TEvent>
  ): Promise<void>;
  unsubscribe(eventName: string): Promise<void>;
}
