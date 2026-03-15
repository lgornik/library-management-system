import { DomainEvent } from '@library/shared-kernel';

export interface AuthorDeletedEventPayload {
  authorId: string;
}

/**
 * Event raised when an author is deleted.
 */
export class AuthorDeletedEvent extends DomainEvent<AuthorDeletedEventPayload> {
  static readonly EVENT_NAME = 'library.author.deleted';

  constructor(payload: AuthorDeletedEventPayload) {
    super(AuthorDeletedEvent.EVENT_NAME, payload);
  }

  getAggregateId(): string {
    return this.payload.authorId;
  }
}
