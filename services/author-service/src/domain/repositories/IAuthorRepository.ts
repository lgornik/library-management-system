import { Author } from '../aggregates/Author.js';
import { AuthorId } from '../value-objects/AuthorId.js';

/**
 * Repository interface for Author aggregate.
 *
 * Domain interface — actual implementation lives in the infrastructure layer.
 */
export interface IAuthorRepository {
  findById(id: AuthorId): Promise<Author | null>;
  findByName(name: string): Promise<Author[]>;
  save(author: Author): Promise<void>;
  delete(id: AuthorId): Promise<void>;
  exists(id: AuthorId): Promise<boolean>;
  nextId(): AuthorId;
}
