import { Collection, Sort } from 'mongodb';
import { getCollection, Collections } from './mongodb.js';
import { BookDocument } from './ReadModels.js';
import {
  BookListItemDto,
  BookDetailsDto,
  AuthorYearStatsDto,
  BookSortField,
  SortOrder,
} from '../../../application/index.js';

/**
 * Read-only repository for querying books from MongoDB.
 *
 * This repository is optimized for fast reads and returns DTOs directly.
 * It never modifies data - that's done by projections reacting to events.
 *
 * @example
 * const readRepo = new MongoBookReadRepository();
 *
 * // Get books by year, sorted by page count
 * const books = await readRepo.findByYear(2024, 'pageCount', 'desc');
 *
 * // Get author statistics
 * const stats = await readRepo.getAuthorStatsByYear(2024, 10);
 */
export class MongoBookReadRepository {
  private get collection(): Collection<BookDocument> {
    return getCollection<BookDocument>(Collections.BOOKS);
  }

  /**
   * Find a book by ID
   */
  async findById(bookId: string): Promise<BookDetailsDto | null> {
    const doc = await this.collection.findOne({ _id: bookId });

    if (!doc) {
      return null;
    }

    return this.toDetailsDto(doc);
  }

  /**
   * Find books by year with sorting and pagination
   */
  async findByYear(
    year: number,
    sortBy: BookSortField = 'pageCount',
    sortOrder: SortOrder = 'desc',
    limit: number = 50,
    offset: number = 0
  ): Promise<BookListItemDto[]> {
    const sort: Sort = { [this.mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

    const docs = await this.collection
      .find({ yearRead: year })
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .toArray();

    return docs.map((doc) => this.toListItemDto(doc));
  }

  /**
   * Count books by year
   */
  async countByYear(year: number): Promise<number> {
    return this.collection.countDocuments({ yearRead: year });
  }

  /**
   * Get all books (with pagination)
   */
  async findAll(
    sortBy: BookSortField = 'createdAt',
    sortOrder: SortOrder = 'desc',
    limit: number = 50,
    offset: number = 0
  ): Promise<BookListItemDto[]> {
    const sort: Sort = { [this.mapSortField(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

    const docs = await this.collection
      .find({})
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .toArray();

    return docs.map((doc) => this.toListItemDto(doc));
  }

  /**
   * Get author statistics for a specific year
   *
   * Returns authors sorted by book count (descending)
   */
  async getAuthorStatsByYear(year: number, limit: number = 20): Promise<AuthorYearStatsDto[]> {
    const pipeline = [
      // Filter by year
      { $match: { yearRead: year } },
      // Group by author
      {
        $group: {
          _id: '$authorId',
          authorName: { $first: '$authorName' },
          bookCount: { $sum: 1 },
          totalPages: { $sum: '$pageCount' },
          books: {
            $push: {
              id: '$_id',
              title: '$title',
              pageCount: '$pageCount',
              rating: '$rating',
            },
          },
        },
      },
      // Sort by book count descending
      { $sort: { bookCount: -1, totalPages: -1 } },
      // Limit results
      { $limit: limit },
    ];

    const results = await this.collection.aggregate(pipeline).toArray();

    return results.map((r) => ({
      authorId: r._id as string,
      authorName: r.authorName as string,
      bookCount: r.bookCount as number,
      totalPages: r.totalPages as number,
      books: r.books as Array<{
        id: string;
        title: string;
        pageCount: number;
        rating: number | null;
      }>,
    }));
  }

  /**
   * Search books by title or author name
   */
  async search(query: string, limit: number = 20): Promise<BookListItemDto[]> {
    const docs = await this.collection
      .find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { authorName: { $regex: query, $options: 'i' } },
        ],
      })
      .limit(limit)
      .toArray();

    return docs.map((doc) => this.toListItemDto(doc));
  }

  /**
   * Get available years (years with books)
   */
  async getAvailableYears(): Promise<number[]> {
    const years = await this.collection.distinct('yearRead', { yearRead: { $ne: null } });
    return (years as number[]).sort((a, b) => b - a);
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  private mapSortField(field: BookSortField): string {
    const mapping: Record<BookSortField, string> = {
      pageCount: 'pageCount',
      title: 'title',
      rating: 'rating',
      createdAt: 'createdAt',
    };
    return mapping[field];
  }

  private toListItemDto(doc: BookDocument): BookListItemDto {
    return {
      id: doc._id,
      title: doc.title,
      authorId: doc.authorId,
      authorName: doc.authorName,
      pageCount: doc.pageCount,
      yearRead: doc.yearRead,
      status: doc.status,
      rating: doc.rating,
      coverUrl: doc.coverUrl,
      quotesCount: doc.quotesCount,
      notesCount: doc.notesCount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private toDetailsDto(doc: BookDocument): BookDetailsDto {
    return {
      id: doc._id,
      title: doc.title,
      authorId: doc.authorId,
      authorName: doc.authorName,
      pageCount: doc.pageCount,
      isbn: doc.isbn,
      yearRead: doc.yearRead,
      status: doc.status,
      rating: doc.rating,
      coverUrl: doc.coverUrl,
      quotes: doc.quotes.map((q) => ({
        id: q.id,
        content: q.content,
        page: q.page,
        createdAt: q.createdAt,
      })),
      notes: doc.notes.map((n) => ({
        id: n.id,
        content: n.content,
        chapter: n.chapter,
        createdAt: n.createdAt,
        updatedAt: n.createdAt,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
