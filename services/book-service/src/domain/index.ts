// Aggregates
export { Book, type CreateBookProps } from './aggregates/index.js';

// Entities
export { Quote, QuoteId, Note, NoteId } from './entities/index.js';

// Value Objects
export {
  BookId,
  ISBN,
  PageCount,
  Title,
  Rating,
  ReadingStatus,
  ReadingStatusUtils,
} from './value-objects/index.js';

// Events
export {
  BookCreatedEvent,
  BookUpdatedEvent,
  BookDeletedEvent,
  BookFinishedEvent,
  QuoteAddedEvent,
  type BookCreatedEventPayload,
  type BookUpdatedEventPayload,
  type BookDeletedEventPayload,
  type BookFinishedEventPayload,
  type QuoteAddedEventPayload,
} from './events/index.js';

// Repositories
export { type IBookRepository } from './repositories/index.js';
