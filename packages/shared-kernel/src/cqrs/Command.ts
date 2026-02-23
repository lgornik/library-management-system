import { v4 as uuidv4 } from 'uuid';

/**
 * Metadata attached to commands
 */
export interface CommandMetadata {
  /** Unique identifier of the command */
  commandId: string;
  /** When the command was created */
  timestamp: Date;
  /** Correlation ID for tracking */
  correlationId?: string;
  /** User who issued the command */
  userId?: string;
  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Base class for Commands in CQRS pattern.
 *
 * Commands represent an intent to change the system state.
 * They should be named in imperative mood (CreateBook, UpdateAuthor, DeleteQuote).
 *
 * Commands:
 * - Represent intent to change state
 * - Should be validated before execution
 * - Are handled by exactly one handler
 * - Should not return domain data (only success/failure or ID)
 *
 * @example
 * interface CreateBookPayload {
 *   title: string;
 *   authorId: string;
 *   pageCount: number;
 *   isbn?: string;
 * }
 *
 * class CreateBookCommand extends Command<CreateBookPayload> {
 *   constructor(payload: CreateBookPayload) {
 *     super(payload);
 *   }
 * }
 *
 * // Usage
 * const command = new CreateBookCommand({
 *   title: 'Domain-Driven Design',
 *   authorId: 'author-123',
 *   pageCount: 560,
 * });
 */
export abstract class Command<TPayload = unknown> {
  public readonly commandId: string;
  public readonly timestamp: Date;
  public readonly metadata: CommandMetadata;

  protected constructor(
    public readonly payload: TPayload,
    metadata?: Partial<CommandMetadata>
  ) {
    this.commandId = metadata?.commandId ?? uuidv4();
    this.timestamp = metadata?.timestamp ?? new Date();
    this.metadata = {
      commandId: this.commandId,
      timestamp: this.timestamp,
      correlationId: metadata?.correlationId,
      userId: metadata?.userId,
    };
  }

  /**
   * Get the name of this command (class name)
   */
  get commandName(): string {
    return this.constructor.name;
  }

  /**
   * Create a copy with correlation ID for tracking
   */
  withCorrelation(correlationId: string): this {
    const Constructor = this.constructor as new (
      payload: TPayload,
      metadata?: Partial<CommandMetadata>
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
      metadata?: Partial<CommandMetadata>
    ) => this;

    return new Constructor(this.payload, {
      ...this.metadata,
      userId,
    });
  }
}

/**
 * Result of command execution
 */
export type CommandResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: CommandError };

export interface CommandError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Interface for command handlers
 *
 * Each command should have exactly one handler.
 * The handler is responsible for:
 * - Validating the command
 * - Loading aggregates
 * - Executing domain logic
 * - Persisting changes
 * - Publishing domain events
 */
export interface ICommandHandler<TCommand extends Command, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}

/**
 * Interface for the command bus
 *
 * The command bus routes commands to their handlers.
 */
export interface ICommandBus {
  /**
   * Execute a command and return the result
   */
  execute<TResult = void>(command: Command): Promise<TResult>;

  /**
   * Register a handler for a command type
   */
  register<TCommand extends Command, TResult = void>(
    commandClass: new (...args: unknown[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>
  ): void;
}

/**
 * Decorator to mark a class as a command handler
 * (for use with dependency injection frameworks)
 * 
 * Note: Requires reflect-metadata package to be installed and imported
 */
export function CommandHandler<TCommand extends Command>(
  _commandClass: new (...args: unknown[]) => TCommand
): ClassDecorator {
  return (_target: object) => {
    // Decorator implementation for DI frameworks
    // Will be implemented when we add a DI container
  };
}
