import { PoolClient } from 'pg';
import {
  Book,
  BookId,
  Quote,
  Note,
  IBookRepository,
} from '../../../domain/index.js';
import { query, transaction } from './postgres.js';

/**
 * Row type from PostgreSQL books table
 */
interface BookRow {
  id: string;
  title: string;
  author_id: string;
  page_count: number;
  isbn: string | null;
  year_read: number | null;
  status: string;
  rating: number | null;
  cover_url: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}

interface QuoteRow {
  id: string;
  book_id: string;
  content: string;
  page: number | null;
  created_at: Date;
}

interface NoteRow {
  id: string;
  book_id: string;
  content: string;
  chapter: string | null;
  created_at: Date;
}

/**
 * PostgreSQL implementation of IBookRepository.
 *
 * This is the Write Model repository - it persists the full Book aggregate
 * including quotes and notes.
 *
 * @example
 * const repository = new PostgresBookRepository();
 *
 * // Save a book
 * const book = Book.create({ title: 'DDD', authorId: '123', pageCount: 500 });
 * await repository.save(book);
 *
 * // Find a book
 * const found = await repository.findById(book.id);
 */
export class PostgresBookRepository implements IBookRepository {
  /**
   * Find a book by its ID, including quotes and notes
   */
  async findById(id: BookId): Promise<Book | null> {
    // Fetch book
    const bookResult = await query<BookRow>(
      `SELECT * FROM books WHERE id = $1`,
      [id.value]
    );

    if (bookResult.rows.length === 0) {
      return null;
    }

    const bookRow = bookResult.rows[0]!;

    // Fetch quotes
    const quotesResult = await query<QuoteRow>(
      `SELECT * FROM quotes WHERE book_id = $1 ORDER BY created_at`,
      [id.value]
    );

    // Fetch notes
    const notesResult = await query<NoteRow>(
      `SELECT * FROM notes WHERE book_id = $1 ORDER BY created_at`,
      [id.value]
    );

    // Reconstitute the aggregate
    return this.toAggregate(bookRow, quotesResult.rows, notesResult.rows);
  }

  /**
   * Find a book by ISBN
   */
  async findByIsbn(isbn: string): Promise<Book | null> {
    const result = await query<BookRow>(
      `SELECT * FROM books WHERE isbn = $1`,
      [isbn]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const bookRow = result.rows[0]!;

    // Fetch quotes and notes
    const quotesResult = await query<QuoteRow>(
      `SELECT * FROM quotes WHERE book_id = $1`,
      [bookRow.id]
    );
    const notesResult = await query<NoteRow>(
      `SELECT * FROM notes WHERE book_id = $1`,
      [bookRow.id]
    );

    return this.toAggregate(bookRow, quotesResult.rows, notesResult.rows);
  }

  /**
   * Save a book (insert or update)
   */
  async save(book: Book): Promise<void> {
    await transaction(async (client) => {
      const exists = await this.existsInTransaction(client, book.id);

      if (exists) {
        await this.update(client, book);
      } else {
        await this.insert(client, book);
      }

      // Sync quotes and notes
      await this.syncQuotes(client, book);
      await this.syncNotes(client, book);
    });
  }

  /**
   * Delete a book and its related entities
   */
  async delete(id: BookId): Promise<void> {
    await transaction(async (client) => {
      // Quotes and notes are deleted by CASCADE
      await client.query(`DELETE FROM books WHERE id = $1`, [id.value]);
    });
  }

  /**
   * Check if a book exists
   */
  async exists(id: BookId): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM books WHERE id = $1) as exists`,
      [id.value]
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Generate a new BookId
   */
  nextId(): BookId {
    return BookId.generate();
  }

  // ==========================================================================
  // Private methods
  // ==========================================================================

  private async existsInTransaction(client: PoolClient, id: BookId): Promise<boolean> {
    const result = await client.query(
      `SELECT EXISTS(SELECT 1 FROM books WHERE id = $1) as exists`,
      [id.value]
    );
    return result.rows[0]?.exists ?? false;
  }

  private async insert(client: PoolClient, book: Book): Promise<void> {
    await client.query(
      `INSERT INTO books (id, title, author_id, page_count, isbn, year_read, status, rating, cover_url, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        book.id.value,
        book.title,
        book.authorId,
        book.pageCount,
        book.isbn,
        book.yearRead,
        book.status,
        book.rating,
        book.coverUrl,
        book.version + 1,
        book.createdAt,
        book.updatedAt,
      ]
    );
  }

  private async update(client: PoolClient, book: Book): Promise<void> {
    const result = await client.query(
      `UPDATE books 
       SET title = $2, page_count = $3, isbn = $4, year_read = $5, status = $6, 
           rating = $7, cover_url = $8, version = version + 1, updated_at = $9
       WHERE id = $1 AND version = $10
       RETURNING version`,
      [
        book.id.value,
        book.title,
        book.pageCount,
        book.isbn,
        book.yearRead,
        book.status,
        book.rating,
        book.coverUrl,
        book.updatedAt,
        book.version,
      ]
    );

    if (result.rowCount === 0) {
      throw new Error(`Optimistic concurrency conflict for Book ${book.id.value}`);
    }
  }

  private async syncQuotes(client: PoolClient, book: Book): Promise<void> {
    // Get existing quote IDs
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM quotes WHERE book_id = $1`,
      [book.id.value]
    );
    const existingIds = new Set(existing.rows.map((r) => r.id));

    // Current quote IDs from aggregate
    const currentIds = new Set(book.quotes.map((q) => q.id.value));

    // Delete removed quotes
    for (const existingId of existingIds) {
      if (!currentIds.has(existingId)) {
        await client.query(`DELETE FROM quotes WHERE id = $1`, [existingId]);
      }
    }

    // Insert or update quotes
    for (const quote of book.quotes) {
      if (existingIds.has(quote.id.value)) {
        await client.query(
          `UPDATE quotes SET content = $2, page = $3 WHERE id = $1`,
          [quote.id.value, quote.content, quote.page]
        );
      } else {
        await client.query(
          `INSERT INTO quotes (id, book_id, content, page, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [quote.id.value, book.id.value, quote.content, quote.page, quote.createdAt]
        );
      }
    }
  }

  private async syncNotes(client: PoolClient, book: Book): Promise<void> {
    // Get existing note IDs
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM notes WHERE book_id = $1`,
      [book.id.value]
    );
    const existingIds = new Set(existing.rows.map((r) => r.id));

    // Current note IDs from aggregate
    const currentIds = new Set(book.notes.map((n) => n.id.value));

    // Delete removed notes
    for (const existingId of existingIds) {
      if (!currentIds.has(existingId)) {
        await client.query(`DELETE FROM notes WHERE id = $1`, [existingId]);
      }
    }

    // Insert or update notes
    for (const note of book.notes) {
      if (existingIds.has(note.id.value)) {
        await client.query(
          `UPDATE notes SET content = $2, chapter = $3 WHERE id = $1`,
          [note.id.value, note.content, note.chapter]
        );
      } else {
        await client.query(
          `INSERT INTO notes (id, book_id, content, chapter, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [note.id.value, book.id.value, note.content, note.chapter, note.createdAt]
        );
      }
    }
  }

  /**
   * Convert database rows to Book aggregate
   */
  private toAggregate(
    bookRow: BookRow,
    quoteRows: QuoteRow[],
    noteRows: NoteRow[]
  ): Book {
    const quotes = quoteRows.map((row) =>
      Quote.reconstitute({
        id: row.id,
        bookId: row.book_id,
        content: row.content,
        page: row.page,
        createdAt: row.created_at,
      })
    );

    const notes = noteRows.map((row) =>
      Note.reconstitute({
        id: row.id,
        bookId: row.book_id,
        content: row.content,
        chapter: row.chapter,
        createdAt: row.created_at,
        updatedAt: row.created_at, // Notes table doesn't have updated_at yet
      })
    );

    return Book.reconstitute({
      id: bookRow.id,
      title: bookRow.title,
      authorId: bookRow.author_id,
      pageCount: bookRow.page_count,
      isbn: bookRow.isbn,
      yearRead: bookRow.year_read,
      status: bookRow.status,
      rating: bookRow.rating,
      coverUrl: bookRow.cover_url,
      quotes,
      notes,
      version: bookRow.version,
      createdAt: bookRow.created_at,
      updatedAt: bookRow.updated_at,
    });
  }
}
