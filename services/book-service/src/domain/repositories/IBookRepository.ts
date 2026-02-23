import { Book } from '../aggregates/Book.js';
import { BookId } from '../value-objects/BookId.js';

/**
 * Repository interface for Book aggregate.
 *
 * This is a domain interface - the actual implementation
 * lives in the infrastructure layer.
 *
 * Following DDD principles:
 * - Repository works only with aggregate roots
 * - Provides collection-like interface
 * - Abstracts persistence details
 */
export interface IBookRepository {
  /**
   * Find a book by its ID
   */
  findById(id: BookId): Promise<Book | null>;

  /**
   * Find a book by ISBN
   */
  findByIsbn(isbn: string): Promise<Book | null>;

  /**
   * Save a book (create or update)
   */
  save(book: Book): Promise<void>;

  /**
   * Delete a book
   */
  delete(id: BookId): Promise<void>;

  /**
   * Check if a book exists
   */
  exists(id: BookId): Promise<boolean>;

  /**
   * Get the next available ID (for some ID generation strategies)
   */
  nextId(): BookId;
}
