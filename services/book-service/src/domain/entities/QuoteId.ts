import { UniqueId } from '@library/shared-kernel';

/**
 * Unique identifier for a Quote entity.
 */
export class QuoteId extends UniqueId {
  private constructor(value: string) {
    super(value);
  }

  static generate(): QuoteId {
    return new QuoteId(this.generateUUID());
  }

  static fromString(value: string): QuoteId {
    if (!value || value.trim().length === 0) {
      throw new Error('QuoteId cannot be empty');
    }
    return new QuoteId(value);
  }
}
