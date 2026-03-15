// Commands
export {
  CreateAuthorCommand,
  UpdateAuthorCommand,
  DeleteAuthorCommand,
  type CreateAuthorCommandPayload,
  type UpdateAuthorCommandPayload,
  type DeleteAuthorCommandPayload,
} from './commands/index.js';

// Handlers
export {
  CreateAuthorHandler,
  UpdateAuthorHandler,
  DeleteAuthorHandler,
  type CreateAuthorResult,
} from './handlers/index.js';

// Queries
export {
  GetAuthorByIdQuery,
  GetAllAuthorsQuery,
  type GetAuthorByIdQueryPayload,
  type GetAllAuthorsQueryPayload,
  type AuthorSortField,
  type SortOrder,
} from './queries/index.js';

// DTOs
export {
  type AuthorListItemDto,
  type AuthorDetailsDto,
} from './dtos/index.js';
