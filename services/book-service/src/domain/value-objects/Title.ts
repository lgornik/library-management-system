import { SimpleValueObject, DomainException } from '@library/shared-kernel';

/**
 * Book title Value Object.
 *
 * Encapsulates validation and normalization of book titles.
 *
 * @example
 * const title = Title.create('  Domain-Driven Design  ');
 * console.log(title.value); // 'Domain-Driven Design'
 */
export class Title extends SimpleValueObject<string> {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 500;

  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a Title with validation and normalization
   */
  static create(title: string): Title {
    if (!title || typeof title !== 'string') {
      throw new DomainException('Title is required', 'INVALID_TITLE');
    }

    const normalized = this.normalize(title);

    if (normalized.length < this.MIN_LENGTH) {
      throw new DomainException('Title cannot be empty', 'INVALID_TITLE', {
        title,
        minLength: this.MIN_LENGTH,
      });
    }

    if (normalized.length > this.MAX_LENGTH) {
      throw new DomainException(
        `Title cannot exceed ${this.MAX_LENGTH} characters`,
        'INVALID_TITLE',
        { title, maxLength: this.MAX_LENGTH }
      );
    }

    return new Title(normalized);
  }

  /**
   * Create Title from string (for reconstitution from DB)
   */
  static fromString(value: string): Title {
    return new Title(value);
  }

  /**
   * Normalize title: trim whitespace, collapse multiple spaces
   */
  private static normalize(title: string): string {
    return title.trim().replace(/\s+/g, ' ');
  }

  /**
   * Get title in lowercase (for searching/comparison)
   */
  get lowercase(): string {
    return this.value.toLowerCase();
  }

  /**
   * Get title for URL slug
   */
  get slug(): string {
    return this.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Check if title contains a search term (case-insensitive)
   */
  contains(searchTerm: string): boolean {
    return this.lowercase.includes(searchTerm.toLowerCase());
  }
}
