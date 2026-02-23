import { Query } from '@library/shared-kernel';

/**
 * Sort options for books
 */
export type BookSortField = 'pageCount' | 'title' | 'rating' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

/**
 * Query to get books read in a specific year
 */
export interface GetBooksByYearQueryPayload {
  year: number;
  sortBy?: BookSortField;
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
}

export class GetBooksByYearQuery extends Query<GetBooksByYearQueryPayload> {
  constructor(payload: GetBooksByYearQueryPayload) {
    super({
      sortBy: 'pageCount',
      sortOrder: 'desc',
      limit: 50,
      offset: 0,
      ...payload,
    });
  }
}
