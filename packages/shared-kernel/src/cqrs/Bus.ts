import { Command, ICommandBus, ICommandHandler } from './Command.js';
import { Query, IQueryBus, IQueryHandler } from './Query.js';

/**
 * Simple in-memory implementation of Command Bus.
 * Useful for development and testing.
 *
 * For production, consider using a more robust solution with:
 * - Middleware support (logging, validation, authorization)
 * - Retry policies
 * - Circuit breakers
 *
 * @example
 * const commandBus = new InMemoryCommandBus();
 *
 * // Register handler
 * commandBus.register(CreateBookCommand, new CreateBookHandler(repository));
 *
 * // Execute command
 * const bookId = await commandBus.execute<string>(
 *   new CreateBookCommand({ title: 'DDD', authorId: '123', pageCount: 500 })
 * );
 */
export class InMemoryCommandBus implements ICommandBus {
  private handlers = new Map<string, ICommandHandler<Command, unknown>>();

  register<TCommand extends Command, TResult = void>(
    commandClass: new (...args: unknown[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>
  ): void {
    const commandName = commandClass.name;

    if (this.handlers.has(commandName)) {
      throw new Error(`Handler for command '${commandName}' is already registered`);
    }

    this.handlers.set(commandName, handler as ICommandHandler<Command, unknown>);
  }

  async execute<TResult = void>(command: Command): Promise<TResult> {
    const commandName = command.constructor.name;
    const handler = this.handlers.get(commandName);

    if (!handler) {
      throw new Error(`No handler registered for command '${commandName}'`);
    }

    return handler.execute(command) as Promise<TResult>;
  }

  /**
   * Check if a handler is registered for a command type
   */
  hasHandler(commandClass: new (...args: unknown[]) => Command): boolean {
    return this.handlers.has(commandClass.name);
  }

  /**
   * Clear all registered handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

/**
 * Simple in-memory implementation of Query Bus.
 * Useful for development and testing.
 *
 * @example
 * const queryBus = new InMemoryQueryBus();
 *
 * // Register handler
 * queryBus.register(GetBooksByYearQuery, new GetBooksByYearHandler(readRepository));
 *
 * // Execute query
 * const books = await queryBus.execute<BookReadModel[]>(
 *   new GetBooksByYearQuery({ year: 2024 })
 * );
 */
export class InMemoryQueryBus implements IQueryBus {
  private handlers = new Map<string, IQueryHandler<Query, unknown>>();

  register<TQuery extends Query, TResult>(
    queryClass: new (...args: unknown[]) => TQuery,
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    const queryName = queryClass.name;

    if (this.handlers.has(queryName)) {
      throw new Error(`Handler for query '${queryName}' is already registered`);
    }

    this.handlers.set(queryName, handler as IQueryHandler<Query, unknown>);
  }

  async execute<TResult>(query: Query): Promise<TResult> {
    const queryName = query.constructor.name;
    const handler = this.handlers.get(queryName);

    if (!handler) {
      throw new Error(`No handler registered for query '${queryName}'`);
    }

    return handler.execute(query) as Promise<TResult>;
  }

  /**
   * Check if a handler is registered for a query type
   */
  hasHandler(queryClass: new (...args: unknown[]) => Query): boolean {
    return this.handlers.has(queryClass.name);
  }

  /**
   * Clear all registered handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

/**
 * Combined CQRS Bus that provides both command and query functionality
 */
export class CQRSBus {
  public readonly commands: ICommandBus;
  public readonly queries: IQueryBus;

  constructor(commandBus?: ICommandBus, queryBus?: IQueryBus) {
    this.commands = commandBus ?? new InMemoryCommandBus();
    this.queries = queryBus ?? new InMemoryQueryBus();
  }

  /**
   * Execute a command
   */
  async executeCommand<TResult = void>(command: Command): Promise<TResult> {
    return this.commands.execute<TResult>(command);
  }

  /**
   * Execute a query
   */
  async executeQuery<TResult>(query: Query): Promise<TResult> {
    return this.queries.execute<TResult>(query);
  }
}
