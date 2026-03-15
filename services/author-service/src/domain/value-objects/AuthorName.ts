import { SimpleValueObject, DomainException } from '@library/shared-kernel';

/**
 * Author name Value Object.
 */
export class AuthorName extends SimpleValueObject<string> {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 300;

  private constructor(value: string) {
    super(value);
  }

  static create(name: string): AuthorName {
    if (!name || typeof name !== 'string') {
      throw new DomainException('Author name is required', 'INVALID_AUTHOR_NAME');
    }

    const normalized = name.trim().replace(/\s+/g, ' ');

    if (normalized.length < this.MIN_LENGTH) {
      throw new DomainException('Author name cannot be empty', 'INVALID_AUTHOR_NAME', { name });
    }

    if (normalized.length > this.MAX_LENGTH) {
      throw new DomainException(
        `Author name cannot exceed ${this.MAX_LENGTH} characters`,
        'INVALID_AUTHOR_NAME',
        { name, maxLength: this.MAX_LENGTH }
      );
    }

    return new AuthorName(normalized);
  }

  static fromString(value: string): AuthorName {
    return new AuthorName(value);
  }

  get lowercase(): string {
    return this.value.toLowerCase();
  }
}
