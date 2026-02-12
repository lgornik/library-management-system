/**
 * Base class for all domain exceptions.
 *
 * Domain exceptions represent violations of business rules or invariants.
 * They should be caught at the application layer and translated to appropriate
 * responses for the client.
 *
 * @example
 * class InvalidISBNException extends DomainException {
 *   constructor(isbn: string) {
 *     super(`Invalid ISBN format: ${isbn}`, 'INVALID_ISBN');
 *   }
 * }
 *
 * // Usage in domain
 * if (!isValidISBN(isbn)) {
 *   throw new InvalidISBNException(isbn);
 * }
 */
export class DomainException extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string = 'DOMAIN_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainException';
    this.code = code;
    this.timestamp = new Date();
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): {
    name: string;
    message: string;
    code: string;
    timestamp: string;
    details?: Record<string, unknown>;
  } {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      details: this.details,
    };
  }
}

/**
 * Exception thrown when an entity is not found
 */
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id '${id}' was not found`, 'ENTITY_NOT_FOUND', {
      entityName,
      id,
    });
    this.name = 'EntityNotFoundException';
  }
}

/**
 * Exception thrown when a business rule is violated
 */
export class BusinessRuleViolationException extends DomainException {
  constructor(rule: string, details?: Record<string, unknown>) {
    super(`Business rule violated: ${rule}`, 'BUSINESS_RULE_VIOLATION', details);
    this.name = 'BusinessRuleViolationException';
  }
}

/**
 * Exception thrown when validation fails
 */
export class ValidationException extends DomainException {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const message = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    super(`Validation failed: ${message}`, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationException';
    this.errors = errors;
  }

  static single(field: string, message: string): ValidationException {
    return new ValidationException([{ field, message }]);
  }
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Exception thrown on concurrency conflicts
 */
export class ConcurrencyException extends DomainException {
  constructor(entityName: string, id: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrency conflict for ${entityName} '${id}': expected version ${expectedVersion}, but found ${actualVersion}`,
      'CONCURRENCY_CONFLICT',
      { entityName, id, expectedVersion, actualVersion }
    );
    this.name = 'ConcurrencyException';
  }
}

/**
 * Exception thrown when an operation is not authorized
 */
export class UnauthorizedException extends DomainException {
  constructor(operation: string, reason?: string) {
    super(
      `Not authorized to perform operation: ${operation}${reason ? `. Reason: ${reason}` : ''}`,
      'UNAUTHORIZED',
      { operation, reason }
    );
    this.name = 'UnauthorizedException';
  }
}
