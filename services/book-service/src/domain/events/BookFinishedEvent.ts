import { DomainEvent } from '@library/shared-kernel';

/**
 * Payload for BookFinishedEvent
 */
export interface BookFinishedEventPayload {
  bookId: string;
  authorId: string;
  title: string;
  pageCount: number;
  yearRead: number;
  rating: number | null;
  finishedAt: Date;
}

/**
 * Event raised when a book is marked as finished.
 *
 * This is a significant business event that triggers:
 * - Update of yearly reading statistics
 * - Update of author's finished book count
 * - Possible notification to user about achievement
 */
export class BookFinishedEvent extends DomainEvent<BookFinishedEventPayload> {
  static readonly EVENT_NAME = 'library.book.finished';

  constructor(payload: BookFinishedEventPayload) {
    super(BookFinishedEvent.EVENT_NAME, payload);
  }

  getAggregateId(): string {
    return this.payload.bookId;
  }
}
