import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * Base class for all unique identifiers in the domain.
 * Provides type-safe IDs that prevent mixing different entity types.
 *
 * @example
 * class BookId extends UniqueId {
 *   private readonly _brand!: 'BookId'; // Prevents type mixing
 *
 *   static generate(): BookId {
 *     return new BookId(uuidv4());
 *   }
 *
 *   static fromString(id: string): BookId {
 *     return new BookId(id);
 *   }
 * }
 */
export abstract class UniqueId {
  constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new Error('ID cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: UniqueId | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof UniqueId)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }

  /**
   * Generate a new UUID v4
   */
  protected static generateUUID(): string {
    return uuidv4();
  }

  /**
   * Validate if a string is a valid UUID
   */
  protected static isValidUUID(id: string): boolean {
    return uuidValidate(id);
  }
}

/**
 * Generic UUID-based identifier.
 * Use this when you need a simple ID without custom type branding.
 */
export class UUID extends UniqueId {
  private constructor(value: string) {
    super(value);
  }

  static generate(): UUID {
    return new UUID(UniqueId.generateUUID());
  }

  static fromString(value: string): UUID {
    if (!UniqueId.isValidUUID(value)) {
      throw new Error(`Invalid UUID format: ${value}`);
    }
    return new UUID(value);
  }

  static isValid(value: string): boolean {
    return UniqueId.isValidUUID(value);
  }
}
