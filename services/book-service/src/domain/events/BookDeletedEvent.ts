import { DomainEvent } from '@library/shared-kernel';

/**
 * Payload for BookDeletedEvent
 */
export interface BookDeletedEventPayload {
  bookId: string;
  authorId: string;
  pageCount: number;
  yearRead: number | null;
}

/**
 * Event raised when a book is deleted from the library.
 *
 * Contains info needed by other services to update their state:
 * - Author service needs authorId to decrement book count
 * - Stats service needs yearRead to update yearly statistics
 */
export class BookDeletedEvent extends DomainEvent<BookDeletedEventPayload> {
  static readonly EVENT_NAME = 'library.book.deleted';

  constructor(payload: BookDeletedEventPayload) {
    super(BookDeletedEvent.EVENT_NAME, payload);
  }

  getAggregateId(): string {
    return this.payload.bookId;
  }
}
