// Aggregates
export { Author, type CreateAuthorProps } from './aggregates/index.js';

// Value Objects
export { AuthorId, AuthorName } from './value-objects/index.js';

// Events
export {
  AuthorCreatedEvent,
  AuthorUpdatedEvent,
  AuthorDeletedEvent,
  type AuthorCreatedEventPayload,
  type AuthorUpdatedEventPayload,
  type AuthorDeletedEventPayload,
} from './events/index.js';

// Repositories
export { type IAuthorRepository } from './repositories/index.js';
