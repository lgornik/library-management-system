import { UniqueId } from './UniqueId.js';
import { Entity } from './Entity.js';
import { DomainEvent } from './DomainEvent.js';

/**
 * Base class for Aggregate Roots.
 *
 * Aggregate Root is the main entity of an Aggregate - a cluster of domain objects
 * that can be treated as a single unit. All external access to the aggregate
 * must go through the Aggregate Root.
 *
 * Aggregate Roots:
 * - Maintain consistency boundaries
 * - Collect and manage domain events
 * - Enforce all invariants within the aggregate
 *
 * @example
 * class Book extends AggregateRoot<BookId> {
 *   private props: BookProps;
 *
 *   private constructor(id: BookId, props: BookProps) {
 *     super(id);
 *     this.props = props;
 *   }
 *
 *   static create(props: CreateBookProps): Book {
 *     const book = new Book(BookId.generate(), {
 *       ...props,
 *       quotes: [],
 *       status: ReadingStatus.TO_READ,
 *     });
 *
 *     book.addDomainEvent(new BookCreatedEvent({
 *       bookId: book.id.value,
 *       title: props.title,
 *     }));
 *
 *     return book;
 *   }
 *
 *   addQuote(content: string): void {
 *     const quote = Quote.create({ content });
 *     this.props.quotes.push(quote);
 *
 *     this.addDomainEvent(new QuoteAddedEvent({
 *       bookId: this.id.value,
 *       quoteId: quote.id.value,
 *     }));
 *   }
 * }
 */
export abstract class AggregateRoot<TId extends UniqueId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  protected constructor(id: TId) {
    super(id);
  }

  /**
   * Get all uncommitted domain events
   */
  get domainEvents(): readonly DomainEvent[] {
    return Object.freeze([...this._domainEvents]);
  }

  /**
   * Get the version number for optimistic concurrency
   */
  get version(): number {
    return this._version;
  }

  /**
   * Set the version (used when reconstituting from persistence)
   */
  protected setVersion(version: number): void {
    this._version = version;
  }

  /**
   * Increment version after successful persistence
   */
  incrementVersion(): void {
    this._version++;
  }

  /**
   * Add a domain event to be published after the aggregate is persisted
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Clear all domain events (call after publishing)
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if there are uncommitted domain events
   */
  hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * Get count of uncommitted events
   */
  uncommittedEventsCount(): number {
    return this._domainEvents.length;
  }
}

/**
 * Interface for Aggregate Repository
 *
 * Repositories are responsible for persisting and retrieving aggregates.
 * They should only work with Aggregate Roots, never with internal entities.
 */
export interface IAggregateRepository<
  TAggregate extends AggregateRoot<TId>,
  TId extends UniqueId,
> {
  /**
   * Find an aggregate by its ID
   */
  findById(id: TId): Promise<TAggregate | null>;

  /**
   * Save (create or update) an aggregate
   */
  save(aggregate: TAggregate): Promise<void>;

  /**
   * Delete an aggregate
   */
  delete(id: TId): Promise<void>;

  /**
   * Check if an aggregate exists
   */
  exists(id: TId): Promise<boolean>;
}
