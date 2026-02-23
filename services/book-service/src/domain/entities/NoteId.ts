import { UniqueId } from '@library/shared-kernel';

/**
 * Unique identifier for a Note entity.
 */
export class NoteId extends UniqueId {
  private constructor(value: string) {
    super(value);
  }

  static generate(): NoteId {
    return new NoteId(this.generateUUID());
  }

  static fromString(value: string): NoteId {
    if (!value || value.trim().length === 0) {
      throw new Error('NoteId cannot be empty');
    }
    return new NoteId(value);
  }
}
