import { Entity, DomainException } from '@library/shared-kernel';
import { QuoteId } from './QuoteId.js';
import { BookId } from '../value-objects/BookId.js';

/**
 * Quote entity - represents a memorable quote from a book.
 *
 * Quotes are entities (not value objects) because:
 * - They have identity (QuoteId)
 * - They can be updated independently
 * - They need to be tracked over time
 *
 * @example
 * const quote = Quote.create({
 *   bookId: BookId.fromString('book-123'),
 *   content: 'The only way to do great work is to love what you do.',
 *   page: 42,
 * });
 */
export class Quote extends Entity<QuoteId> {
  private _bookId: BookId;
  private _content: string;
  private _page: number | null;
  private _createdAt: Date;

  private constructor(
    id: QuoteId,
    bookId: BookId,
    content: string,
    page: number | null,
    createdAt: Date
  ) {
    super(id);
    this._bookId = bookId;
    this._content = content;
    this._page = page;
    this._createdAt = createdAt;
  }

  /**
   * Create a new Quote
   */
  static create(props: { bookId: BookId; content: string; page?: number }): Quote {
    const { bookId, content, page } = props;

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new DomainException('Quote content cannot be empty', 'INVALID_QUOTE');
    }

    if (content.length > 5000) {
      throw new DomainException('Quote content cannot exceed 5000 characters', 'INVALID_QUOTE', {
        maxLength: 5000,
        actualLength: content.length,
      });
    }

    // Validate page if provided
    if (page !== undefined && page !== null) {
      if (!Number.isInteger(page) || page < 1) {
        throw new DomainException('Page number must be a positive integer', 'INVALID_QUOTE', {
          page,
        });
      }
    }

    return new Quote(QuoteId.generate(), bookId, content.trim(), page ?? null, new Date());
  }

  /**
   * Reconstitute a Quote from persistence
   */
  static reconstitute(props: {
    id: string;
    bookId: string;
    content: string;
    page: number | null;
    createdAt: Date;
  }): Quote {
    return new Quote(
      QuoteId.fromString(props.id),
      BookId.fromString(props.bookId),
      props.content,
      props.page,
      props.createdAt
    );
  }

  // Getters
  get bookId(): BookId {
    return this._bookId;
  }

  get content(): string {
    return this._content;
  }

  get page(): number | null {
    return this._page;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Update the quote content
   */
  updateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new DomainException('Quote content cannot be empty', 'INVALID_QUOTE');
    }

    if (content.length > 5000) {
      throw new DomainException('Quote content cannot exceed 5000 characters', 'INVALID_QUOTE');
    }

    this._content = content.trim();
  }

  /**
   * Update the page number
   */
  updatePage(page: number | null): void {
    if (page !== null && (!Number.isInteger(page) || page < 1)) {
      throw new DomainException('Page number must be a positive integer', 'INVALID_QUOTE');
    }

    this._page = page;
  }

  /**
   * Get a preview of the quote (first N characters)
   */
  getPreview(maxLength: number = 100): string {
    if (this._content.length <= maxLength) {
      return this._content;
    }
    return this._content.substring(0, maxLength).trim() + '...';
  }

  /**
   * Convert to plain object
   */
  toObject(): {
    id: string;
    bookId: string;
    content: string;
    page: number | null;
    createdAt: Date;
  } {
    return {
      id: this.id.value,
      bookId: this._bookId.value,
      content: this._content,
      page: this._page,
      createdAt: this._createdAt,
    };
  }
}
