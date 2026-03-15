import { DomainEvent } from '@library/shared-kernel';

export interface AuthorUpdatedEventPayload {
  authorId: string;
  changes: {
    name?: string;
    biography?: string | null;
    nationality?: string | null;
  };
  updatedAt: Date;
}

/**
 * Event raised when an author is updated.
 */
export class AuthorUpdatedEvent extends DomainEvent<AuthorUpdatedEventPayload> {
  static readonly EVENT_NAME = 'library.author.updated';

  constructor(payload: AuthorUpdatedEventPayload) {
    super(AuthorUpdatedEvent.EVENT_NAME, payload);
  }

  getAggregateId(): string {
    return this.payload.authorId;
  }
}
