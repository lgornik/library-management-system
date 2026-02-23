import { Query } from '@library/shared-kernel';

/**
 * Query to get a book by its ID
 */
export interface GetBookByIdQueryPayload {
  bookId: string;
}

export class GetBookByIdQuery extends Query<GetBookByIdQueryPayload> {
  constructor(bookId: string) {
    super({ bookId });
  }
}
