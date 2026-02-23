import { DomainEvent } from '@library/shared-kernel';

/**
 * Payload for QuoteAddedEvent
 */
export interface QuoteAddedEventPayload {
  bookId: string;
  quoteId: string;
  content: string;
  page: number | null;
}

/**
 * Event raised when a quote is added to a book.
 */
export class QuoteAddedEvent extends DomainEvent<QuoteAddedEventPayload> {
  static readonly EVENT_NAME = 'library.book.quote_added';

  constructor(payload: QuoteAddedEventPayload) {
    super(QuoteAddedEvent.EVENT_NAME, payload);
  }

  getAggregateId(): string {
    return this.payload.bookId;
  }
}
