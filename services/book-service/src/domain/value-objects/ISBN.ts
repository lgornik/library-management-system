import { SimpleValueObject, DomainException } from '@library/shared-kernel';

/**
 * ISBN (International Standard Book Number) Value Object.
 *
 * Supports both ISBN-10 and ISBN-13 formats.
 * Validates checksum to ensure the ISBN is valid.
 *
 * @example
 * const isbn = ISBN.create('978-0-13-468599-1');
 * console.log(isbn.value); // '9780134685991'
 * console.log(isbn.formatted); // '978-0-13-468599-1'
 */
export class ISBN extends SimpleValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create an ISBN from a string.
   * Accepts various formats (with or without dashes/spaces).
   */
  static create(isbn: string): ISBN {
    const normalized = this.normalize(isbn);

    if (!this.isValid(normalized)) {
      throw new DomainException(`Invalid ISBN: ${isbn}`, 'INVALID_ISBN', { isbn });
    }

    return new ISBN(normalized);
  }

  /**
   * Create ISBN without validation (for reconstitution from DB)
   */
  static fromString(value: string): ISBN {
    return new ISBN(value);
  }

  /**
   * Check if an ISBN is valid (without throwing)
   */
  static isValid(isbn: string): boolean {
    const normalized = this.normalize(isbn);

    if (normalized.length === 10) {
      return this.validateISBN10(normalized);
    }
    if (normalized.length === 13) {
      return this.validateISBN13(normalized);
    }
    return false;
  }

  /**
   * Remove dashes and spaces from ISBN
   */
  private static normalize(isbn: string): string {
    return isbn.replace(/[-\s]/g, '').toUpperCase();
  }

  /**
   * Validate ISBN-10 checksum
   */
  private static validateISBN10(isbn: string): boolean {
    if (!/^[0-9]{9}[0-9X]$/.test(isbn)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbn[i]!, 10) * (10 - i);
    }

    const check = isbn[9] === 'X' ? 10 : parseInt(isbn[9]!, 10);
    sum += check;

    return sum % 11 === 0;
  }

  /**
   * Validate ISBN-13 checksum
   */
  private static validateISBN13(isbn: string): boolean {
    if (!/^[0-9]{13}$/.test(isbn)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn[i]!, 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }

    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(isbn[12]!, 10);
  }

  /**
   * Check if this is ISBN-10 format
   */
  get isISBN10(): boolean {
    return this.value.length === 10;
  }

  /**
   * Check if this is ISBN-13 format
   */
  get isISBN13(): boolean {
    return this.value.length === 13;
  }

  /**
   * Convert ISBN-10 to ISBN-13
   */
  toISBN13(): string {
    if (this.isISBN13) {
      return this.value;
    }

    const isbn12 = '978' + this.value.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn12[i]!, 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    return isbn12 + check;
  }

  /**
   * Get formatted ISBN with dashes
   */
  get formatted(): string {
    if (this.isISBN13) {
      // Format: 978-X-XX-XXXXXX-X
      return `${this.value.slice(0, 3)}-${this.value.slice(3, 4)}-${this.value.slice(4, 6)}-${this.value.slice(6, 12)}-${this.value.slice(12)}`;
    }
    // ISBN-10 format: X-XXX-XXXXX-X
    return `${this.value.slice(0, 1)}-${this.value.slice(1, 4)}-${this.value.slice(4, 9)}-${this.value.slice(9)}`;
  }
}
