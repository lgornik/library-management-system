import { Query } from '@library/shared-kernel';

export type AuthorSortField = 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface GetAllAuthorsQueryPayload {
  sortBy?: AuthorSortField;
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
}

export class GetAllAuthorsQuery extends Query<GetAllAuthorsQueryPayload> {
  constructor(payload: GetAllAuthorsQueryPayload = {}) {
    super({
      sortBy: 'name',
      sortOrder: 'asc',
      limit: 50,
      offset: 0,
      ...payload,
    });
  }
}
