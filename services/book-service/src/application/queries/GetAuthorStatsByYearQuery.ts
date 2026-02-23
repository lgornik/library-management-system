import { Query } from '@library/shared-kernel';

/**
 * Query to get author statistics for a specific year
 * (sorted by book count descending)
 */
export interface GetAuthorStatsByYearQueryPayload {
  year: number;
  limit?: number;
}

export class GetAuthorStatsByYearQuery extends Query<GetAuthorStatsByYearQueryPayload> {
  constructor(year: number, limit: number = 20) {
    super({ year, limit });
  }
}
