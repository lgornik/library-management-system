// Commands
export {
  CreateBookCommand,
  UpdateBookCommand,
  DeleteBookCommand,
  MarkBookAsFinishedCommand,
  AddQuoteCommand,
  AddNoteCommand,
  type CreateBookCommandPayload,
  type UpdateBookCommandPayload,
  type DeleteBookCommandPayload,
  type MarkBookAsFinishedCommandPayload,
  type AddQuoteCommandPayload,
  type AddNoteCommandPayload,
} from './commands/index.js';

// Handlers
export {
  CreateBookHandler,
  UpdateBookHandler,
  DeleteBookHandler,
  MarkBookAsFinishedHandler,
  AddQuoteHandler,
  type CreateBookResult,
  type AddQuoteResult,
} from './handlers/index.js';

// Queries
export {
  GetBookByIdQuery,
  GetBooksByYearQuery,
  GetAuthorStatsByYearQuery,
  type GetBookByIdQueryPayload,
  type GetBooksByYearQueryPayload,
  type GetAuthorStatsByYearQueryPayload,
  type BookSortField,
  type SortOrder,
} from './queries/index.js';

// DTOs
export {
  type BookListItemDto,
  type BookDetailsDto,
  type QuoteDto,
  type NoteDto,
  type AuthorYearStatsDto,
  type YearlyStatsDto,
} from './dtos/index.js';
