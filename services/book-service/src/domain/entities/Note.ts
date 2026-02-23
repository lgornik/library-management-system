import { Entity, DomainException } from '@library/shared-kernel';
import { NoteId } from './NoteId.js';
import { BookId } from '../value-objects/BookId.js';

/**
 * Note entity - represents personal notes about a book.
 *
 * Notes differ from Quotes:
 * - Quotes are exact text from the book
 * - Notes are personal thoughts, insights, summaries
 *
 * @example
 * const note = Note.create({
 *   bookId: BookId.fromString('book-123'),
 *   content: 'The author makes a compelling argument about...',
 *   chapter: 'Chapter 3: Design Patterns',
 * });
 */
export class Note extends Entity<NoteId> {
  private _bookId: BookId;
  private _content: string;
  private _chapter: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: NoteId,
    bookId: BookId,
    content: string,
    chapter: string | null,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id);
    this._bookId = bookId;
    this._content = content;
    this._chapter = chapter;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  /**
   * Create a new Note
   */
  static create(props: { bookId: BookId; content: string; chapter?: string }): Note {
    const { bookId, content, chapter } = props;

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new DomainException('Note content cannot be empty', 'INVALID_NOTE');
    }

    if (content.length > 10000) {
      throw new DomainException('Note content cannot exceed 10000 characters', 'INVALID_NOTE', {
        maxLength: 10000,
        actualLength: content.length,
      });
    }

    // Validate chapter if provided
    if (chapter !== undefined && chapter !== null && chapter.length > 255) {
      throw new DomainException('Chapter name cannot exceed 255 characters', 'INVALID_NOTE', {
        maxLength: 255,
        actualLength: chapter.length,
      });
    }

    const now = new Date();
    return new Note(
      NoteId.generate(),
      bookId,
      content.trim(),
      chapter?.trim() ?? null,
      now,
      now
    );
  }

  /**
   * Reconstitute a Note from persistence
   */
  static reconstitute(props: {
    id: string;
    bookId: string;
    content: string;
    chapter: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Note {
    return new Note(
      NoteId.fromString(props.id),
      BookId.fromString(props.bookId),
      props.content,
      props.chapter,
      props.createdAt,
      props.updatedAt
    );
  }

  // Getters
  get bookId(): BookId {
    return this._bookId;
  }

  get content(): string {
    return this._content;
  }

  get chapter(): string | null {
    return this._chapter;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Update the note content
   */
  updateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new DomainException('Note content cannot be empty', 'INVALID_NOTE');
    }

    if (content.length > 10000) {
      throw new DomainException('Note content cannot exceed 10000 characters', 'INVALID_NOTE');
    }

    this._content = content.trim();
    this._updatedAt = new Date();
  }

  /**
   * Update the chapter reference
   */
  updateChapter(chapter: string | null): void {
    if (chapter !== null && chapter.length > 255) {
      throw new DomainException('Chapter name cannot exceed 255 characters', 'INVALID_NOTE');
    }

    this._chapter = chapter?.trim() ?? null;
    this._updatedAt = new Date();
  }

  /**
   * Get a preview of the note (first N characters)
   */
  getPreview(maxLength: number = 150): string {
    if (this._content.length <= maxLength) {
      return this._content;
    }
    return this._content.substring(0, maxLength).trim() + '...';
  }

  /**
   * Convert to plain object
   */
  toObject(): {
    id: string;
    bookId: string;
    content: string;
    chapter: string | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.value,
      bookId: this._bookId.value,
      content: this._content,
      chapter: this._chapter,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
