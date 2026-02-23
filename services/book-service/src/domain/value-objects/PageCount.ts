import { SimpleValueObject, DomainException } from '@library/shared-kernel';

/**
 * Page count Value Object.
 *
 * Encapsulates validation logic for book page counts
 * and provides useful domain methods.
 *
 * @example
 * const pages = PageCount.create(350);
 * console.log(pages.isLongBook); // false
 * console.log(pages.estimatedReadingHours); // ~7 hours
 */
export class PageCount extends SimpleValueObject<number> {
  private static readonly MIN_PAGES = 1;
  private static readonly MAX_PAGES = 50000; // Reasonable upper limit
  private static readonly LONG_BOOK_THRESHOLD = 500;
  private static readonly PAGES_PER_HOUR = 50; // Average reading speed

  private constructor(value: number) {
    super(value);
  }

  /**
   * Create a PageCount with validation
   */
  static create(pages: number): PageCount {
    if (!Number.isInteger(pages)) {
      throw new DomainException('Page count must be an integer', 'INVALID_PAGE_COUNT', { pages });
    }

    if (pages < this.MIN_PAGES) {
      throw new DomainException(
        `Page count must be at least ${this.MIN_PAGES}`,
        'INVALID_PAGE_COUNT',
        { pages, minPages: this.MIN_PAGES }
      );
    }

    if (pages > this.MAX_PAGES) {
      throw new DomainException(
        `Page count cannot exceed ${this.MAX_PAGES}`,
        'INVALID_PAGE_COUNT',
        { pages, maxPages: this.MAX_PAGES }
      );
    }

    return new PageCount(pages);
  }

  /**
   * Create PageCount from number (for reconstitution from DB)
   */
  static fromNumber(value: number): PageCount {
    return new PageCount(value);
  }

  /**
   * Check if this is considered a long book (500+ pages)
   */
  get isLongBook(): boolean {
    return this.value >= PageCount.LONG_BOOK_THRESHOLD;
  }

  /**
   * Check if this is a short book (under 200 pages)
   */
  get isShortBook(): boolean {
    return this.value < 200;
  }

  /**
   * Estimate reading time in hours (at average pace)
   */
  get estimatedReadingHours(): number {
    return Math.round((this.value / PageCount.PAGES_PER_HOUR) * 10) / 10;
  }

  /**
   * Get a human-readable description of the book length
   */
  get lengthDescription(): string {
    if (this.value < 100) return 'very short';
    if (this.value < 200) return 'short';
    if (this.value < 400) return 'medium';
    if (this.value < 600) return 'long';
    return 'very long';
  }

  /**
   * Add pages (returns new PageCount)
   */
  add(pages: number): PageCount {
    return PageCount.create(this.value + pages);
  }
}
