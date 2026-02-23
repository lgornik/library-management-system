/**
 * Read model for book list items
 */
export interface BookListItemDto {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  pageCount: number;
  yearRead: number | null;
  status: string;
  rating: number | null;
  coverUrl: string | null;
  quotesCount: number;
  notesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Read model for full book details
 */
export interface BookDetailsDto {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  pageCount: number;
  isbn: string | null;
  yearRead: number | null;
  status: string;
  rating: number | null;
  coverUrl: string | null;
  quotes: QuoteDto[];
  notes: NoteDto[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Read model for quotes
 */
export interface QuoteDto {
  id: string;
  content: string;
  page: number | null;
  createdAt: Date;
}

/**
 * Read model for notes
 */
export interface NoteDto {
  id: string;
  content: string;
  chapter: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Author statistics for a specific year
 */
export interface AuthorYearStatsDto {
  authorId: string;
  authorName: string;
  bookCount: number;
  totalPages: number;
  books: {
    id: string;
    title: string;
    pageCount: number;
    rating: number | null;
  }[];
}

/**
 * Yearly reading statistics
 */
export interface YearlyStatsDto {
  year: number;
  totalBooks: number;
  totalPages: number;
  averageRating: number | null;
  averagePagesPerBook: number;
  longestBook: {
    id: string;
    title: string;
    pageCount: number;
  } | null;
  shortestBook: {
    id: string;
    title: string;
    pageCount: number;
  } | null;
}
