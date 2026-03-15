import { UniqueId } from '@library/shared-kernel';

/**
 * Unique identifier for an Author aggregate.
 */
export class AuthorId extends UniqueId {
  private constructor(value: string) {
    super(value);
  }

  static generate(): AuthorId {
    return new AuthorId(this.generateUUID());
  }

  static fromString(value: string): AuthorId {
    if (!value || value.trim().length === 0) {
      throw new Error('AuthorId cannot be empty');
    }
    return new AuthorId(value);
  }

  static isValid(value: string): boolean {
    return this.isValidUUID(value);
  }
}
