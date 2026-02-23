import { v4 as uuidv4 } from 'uuid';

/**
 * Metadata attached to queries
 */
export interface QueryMetadata {
  /** Unique identifier of the query */
  queryId: string;
  /** When the query was created */
  timestamp: Date;
  /** Correlation ID for tracking */
  correlationId?: string;
  /** User who issued the query */
  userId?: string;
  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Base class for Queries in CQRS pattern.
 *
 * Queries represent a request to read data without changing system state.
 * They should be named descriptively (GetBookById, FindBooksByYear, ListAuthors).
 *
 * Queries:
 * - Read data without side effects
 * - Can be cached
 * - Can be handled by multiple handlers (for different read models)
 * - Return DTOs/Read Models, not domain entities
 *
 * @example
 * interface GetBooksByYearPayload {
 *   year: number;
 *   sortBy?: 'title' | 'pageCount' | 'rating';
 *   sortOrder?: 'asc' | 'desc';
 *   limit?: number;
 *   offset?: number;
 * }
 *
 * class GetBooksByYearQuery extends Query<GetBooksByYearPayload> {
 *   constructor(payload: GetBooksByYearPayload) {
 *     super(payload);
 *   }
 * }
 *
 * // Usage
 * const query = new GetBooksByYearQuery({
 *   year: 2024,
 *   sortBy: 'pageCount',
 *   sortOrder: 'desc',
 * });
 */
export abstract class Query<TPayload = unknown> {
  public readonly queryId: string;
  public readonly timestamp: Date;
  public readonly metadata: QueryMetadata;

  protected constructor(
    public readonly payload: TPayload,
    metadata?: Partial<QueryMetadata>
  ) {
    this.queryId = metadata?.queryId ?? uuidv4();
    this.timestamp = metadata?.timestamp ?? new Date();
    this.metadata = {
      queryId: this.queryId,
      timestamp: this.timestamp,
      correlationId: metadata?.correlationId,
      userId: metadata?.userId,
    };
  }

  /**
   * Get the name of this query (class name)
   */
  get queryName(): string {
    return this.constructor.name;
  }

  /**
   * Create a copy with correlation ID for tracking
   */
  withCorrelation(correlationId: string): this {
    const Constructor = this.constructor as new (
      payload: TPayload,
      metadata?: Partial<QueryMetadata>
    ) => this;

    return new Constructor(this.payload, {
      ...this.metadata,
      correlationId,
    });
  }

  /**
   * Create a copy with user ID
   */
  withUser(userId: string): this {
    const Constructor = this.constructor as new (
      payload: TPayload,
      metadata?: Partial<QueryMetadata>
    ) => this;

    return new Constructor(this.payload, {
      ...this.metadata,
      userId,
    });
  }

  /**
   * Generate cache key for this query
   */
  getCacheKey(): string {
    return `${this.queryName}:${JSON.stringify(this.payload)}`;
  }
}

/**
 * Interface for query handlers
 *
 * Query handlers retrieve and return read models.
 * They should be optimized for read performance.
 */
export interface IQueryHandler<TQuery extends Query, TResult> {
  execute(query: TQuery): Promise<TResult>;
}

/**
 * Interface for the query bus
 *
 * The query bus routes queries to their handlers.
 */
export interface IQueryBus {
  /**
   * Execute a query and return the result
   */
  execute<TResult>(query: Query): Promise<TResult>;

  /**
   * Register a handler for a query type
   */
  register<TQuery extends Query, TResult>(
    queryClass: new (...args: unknown[]) => TQuery,
    handler: IQueryHandler<TQuery, TResult>
  ): void;
}

/**
 * Decorator to mark a class as a query handler
 * (for use with dependency injection frameworks)
 * 
 * Note: Requires reflect-metadata package to be installed and imported
 */
export function QueryHandler<TQuery extends Query>(
  _queryClass: new (...args: unknown[]) => TQuery
): ClassDecorator {
  return (_target: object) => {
    // Decorator implementation for DI frameworks
    // Will be implemented when we add a DI container
  };
}

/**
 * Common pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Helper to create paginated results
 */
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: PaginationParams
): PaginatedResult<T> {
  return {
    items,
    total,
    limit: pagination.limit,
    offset: pagination.offset,
    hasMore: pagination.offset + items.length < total,
  };
}
