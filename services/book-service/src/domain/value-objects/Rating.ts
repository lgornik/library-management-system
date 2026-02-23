import { SimpleValueObject, DomainException } from '@library/shared-kernel';

/**
 * Book rating Value Object (1-5 stars).
 *
 * @example
 * const rating = Rating.create(4);
 * console.log(rating.stars); // '★★★★☆'
 */
export class Rating extends SimpleValueObject<number> {
  private static readonly MIN_RATING = 1;
  private static readonly MAX_RATING = 5;

  private constructor(value: number) {
    super(value);
  }

  /**
   * Create a Rating with validation
   */
  static create(rating: number): Rating {
    if (!Number.isInteger(rating)) {
      throw new DomainException('Rating must be an integer', 'INVALID_RATING', { rating });
    }

    if (rating < this.MIN_RATING || rating > this.MAX_RATING) {
      throw new DomainException(
        `Rating must be between ${this.MIN_RATING} and ${this.MAX_RATING}`,
        'INVALID_RATING',
        { rating, minRating: this.MIN_RATING, maxRating: this.MAX_RATING }
      );
    }

    return new Rating(rating);
  }

  /**
   * Create Rating from number (for reconstitution from DB)
   */
  static fromNumber(value: number): Rating {
    return new Rating(value);
  }

  /**
   * Get star representation
   */
  get stars(): string {
    const filled = '★'.repeat(this.value);
    const empty = '☆'.repeat(Rating.MAX_RATING - this.value);
    return filled + empty;
  }

  /**
   * Check if this is a high rating (4+)
   */
  get isHighRating(): boolean {
    return this.value >= 4;
  }

  /**
   * Check if this is a low rating (2 or less)
   */
  get isLowRating(): boolean {
    return this.value <= 2;
  }

  /**
   * Get description of the rating
   */
  get description(): string {
    switch (this.value) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Unknown';
    }
  }
}
