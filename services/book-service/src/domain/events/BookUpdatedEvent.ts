import { DomainEvent } from '@library/shared-kernel';

/**
 * Payload for BookUpdatedEvent
 */
export interface BookUpdatedEventPayload {
  bookId: string;
  changes: {
    title?: string;
    pageCount?: number;
    yearRead?: number | null;
    rating?: number | null;
    status?: string;
  };
  updatedAt: Date;
}

/**
 * Event raised when book details are updated.
 *
 * Contains only the changed fields for efficient processing.
 */
export class BookUpdatedEvent extends DomainEvent<BookUpdatedEventPayload> {
  static readonly EVENT_NAME = 'library.book.updated';

  constructor(payload: BookUpdatedEventPayload) {
    super(BookUpdatedEvent.EVENT_NAME, payload);
  }

  getAggregateId(): string {
    return this.payload.bookId;
  }
}
