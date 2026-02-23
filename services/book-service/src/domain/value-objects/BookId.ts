import { UniqueId } from '@library/shared-kernel';

/**
 * Unique identifier for a Book aggregate.
 *
 * Using a branded type prevents accidentally mixing BookId with other IDs.
 */
export class BookId extends UniqueId {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Generate a new BookId
   */
  static generate(): BookId {
    return new BookId(this.generateUUID());
  }

  /**
   * Create BookId from existing string (e.g., from database)
   */
  static fromString(value: string): BookId {
    if (!value || value.trim().length === 0) {
      throw new Error('BookId cannot be empty');
    }
    return new BookId(value);
  }

  /**
   * Check if a string is a valid BookId format
   */
  static isValid(value: string): boolean {
    return this.isValidUUID(value);
  }
}
