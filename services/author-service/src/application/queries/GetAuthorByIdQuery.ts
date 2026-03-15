import { Query } from '@library/shared-kernel';

export interface GetAuthorByIdQueryPayload {
  authorId: string;
}

export class GetAuthorByIdQuery extends Query<GetAuthorByIdQueryPayload> {
  constructor(authorId: string) {
    super({ authorId });
  }
}
