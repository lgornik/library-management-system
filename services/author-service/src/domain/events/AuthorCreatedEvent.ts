import { DomainEvent } from '@library/shared-kernel';

export interface AuthorCreatedEventPayload {
  authorId: string;
  name: string;
  biography: string | null;
  nationality: string | null;
}

/**
 * Event raised when a new author is created.
 */
export class AuthorCreatedEvent extends DomainEvent<AuthorCreatedEventPayload> {
  static readonly EVENT_NAME = 'library.author.created';

  constructor(payload: AuthorCreatedEventPayload) {
    super(AuthorCreatedEvent.EVENT_NAME, payload);
  }

  getAggregateId(): string {
    return this.payload.authorId;
  }
}
