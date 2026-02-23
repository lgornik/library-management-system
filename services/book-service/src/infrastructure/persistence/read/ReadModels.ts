import { Document, ObjectId } from 'mongodb';

/**
 * Book document in MongoDB (Read Model)
 *
 * This is a denormalized view optimized for reading.
 * It includes author name directly to avoid joins.
 */
export interface BookDocument extends Document {
  _id: string; // Same as BookId from write model
  title: string;
  authorId: string;
  authorName: string; // Denormalized from Author service
  pageCount: number;
  isbn: string | null;
  yearRead: number | null;
  status: string;
  rating: number | null;
  coverUrl: string | null;
  quotes: QuoteDocument[];
  notes: NoteDocument[];
  quotesCount: number;
  notesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteDocument {
  id: string;
  content: string;
  page: number | null;
  createdAt: Date;
}

export interface NoteDocument {
  id: string;
  content: string;
  chapter: string | null;
  createdAt: Date;
}

/**
 * Author document for read model
 */
export interface AuthorDocument extends Document {
  _id: string;
  name: string;
  biography: string | null;
  nationality: string | null;
  totalBooks: number;
  totalPages: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Yearly statistics document
 */
export interface YearlyStatsDocument extends Document {
  _id: string; // Format: "year:2024"
  year: number;
  totalBooks: number;
  totalPages: number;
  averageRating: number | null;
  topAuthors: {
    authorId: string;
    authorName: string;
    bookCount: number;
    totalPages: number;
  }[];
  monthlyBreakdown: {
    month: number;
    bookCount: number;
    pageCount: number;
  }[];
  updatedAt: Date;
}
