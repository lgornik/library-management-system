import { DomainEvent } from '@library/shared-kernel';

/**
 * Payload for BookCreatedEvent
 */
export interface BookCreatedEventPayload {
  bookId: string;
  title: string;
  authorId: string;
  pageCount: number;
  isbn: string | null;
  yearRead: number | null;
  status: string;
}

/**
 * Event raised when a new book is added to the library.
 *
 * This event is consumed by:
 * - Read model projections (to update MongoDB)
 * - Author service (to update author's book count)
 * - Stats service (to update reading statistics)
 */
export class BookCreatedEvent extends DomainEvent<BookCreatedEventPayload> {
  static readonly EVENT_NAME = 'library.book.created';

  constructor(payload: BookCreatedEventPayload) {
    super(BookCreatedEvent.EVENT_NAME, payload);
  }

  getAggregateId(): string {
    return this.payload.bookId;
  }
}
