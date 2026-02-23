import { AggregateRoot, DomainException } from '@library/shared-kernel';
import {
  BookId,
  ISBN,
  PageCount,
  Title,
  Rating,
  ReadingStatus,
  ReadingStatusUtils,
} from '../value-objects/index.js';
import { Quote } from '../entities/Quote.js';
import { Note } from '../entities/Note.js';
import {
  BookCreatedEvent,
  BookUpdatedEvent,
  BookDeletedEvent,
  BookFinishedEvent,
  QuoteAddedEvent,
} from '../events/index.js';

/**
 * Props for creating a new Book
 */
export interface CreateBookProps {
  title: string;
  authorId: string;
  pageCount: number;
  isbn?: string;
  yearRead?: number;
  status?: ReadingStatus;
  rating?: number;
  coverUrl?: string;
}

/**
 * Internal state of the Book aggregate
 */
interface BookState {
  title: Title;
  authorId: string;
  pageCount: PageCount;
  isbn: ISBN | null;
  yearRead: number | null;
  status: ReadingStatus;
  rating: Rating | null;
  coverUrl: string | null;
  quotes: Quote[];
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Book Aggregate Root
 *
 * The Book aggregate is the central domain object that encapsulates:
 * - Book details (title, author, pages, etc.)
 * - Quotes (memorable passages from the book)
 * - Notes (personal thoughts and insights)
 *
 * All modifications go through the aggregate root to maintain consistency.
 *
 * @example
 * // Create a new book
 * const book = Book.create({
 *   title: 'Domain-Driven Design',
 *   authorId: 'author-123',
 *   pageCount: 560,
 *   isbn: '978-0321125217',
 * });
 *
 * // Add a quote
 * book.addQuote('The bounded context is a central pattern in DDD...', 42);
 *
 * // Mark as finished
 * book.markAsFinished(2024, 5);
 *
 * // Get domain events to publish
 * const events = book.domainEvents; // [BookCreatedEvent, QuoteAddedEvent, BookFinishedEvent]
 */
export class Book extends AggregateRoot<BookId> {
  private state: BookState;

  private constructor(id: BookId, state: BookState) {
    super(id);
    this.state = state;
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  /**
   * Create a new Book aggregate.
   * Validates all inputs and raises BookCreatedEvent.
   */
  static create(props: CreateBookProps): Book {
    const id = BookId.generate();
    const now = new Date();

    // Create and validate value objects
    const title = Title.create(props.title);
    const pageCount = PageCount.create(props.pageCount);
    const isbn = props.isbn ? ISBN.create(props.isbn) : null;
    const rating = props.rating ? Rating.create(props.rating) : null;
    const status = props.status ?? ReadingStatus.TO_READ;
    const yearRead = props.yearRead ?? null;

    // Validate authorId
    if (!props.authorId || props.authorId.trim().length === 0) {
      throw new DomainException('Author ID is required', 'INVALID_BOOK');
    }

    // Validate yearRead if provided
    if (yearRead !== null) {
      Book.validateYearRead(yearRead);
    }

    // If book is finished, yearRead should be set
    if (status === ReadingStatus.FINISHED && yearRead === null) {
      throw new DomainException(
        'Year read is required when book status is FINISHED',
        'INVALID_BOOK'
      );
    }

    const state: BookState = {
      title,
      authorId: props.authorId.trim(),
      pageCount,
      isbn,
      yearRead,
      status,
      rating,
      coverUrl: props.coverUrl?.trim() || null,
      quotes: [],
      notes: [],
      createdAt: now,
      updatedAt: now,
    };

    const book = new Book(id, state);

    // Raise domain event
    book.addDomainEvent(
      new BookCreatedEvent({
        bookId: id.value,
        title: title.value,
        authorId: state.authorId,
        pageCount: pageCount.value,
        isbn: isbn?.value ?? null,
        yearRead,
        status,
      })
    );

    return book;
  }

  /**
   * Reconstitute a Book from persistence.
   * Does NOT raise domain events.
   */
  static reconstitute(props: {
    id: string;
    title: string;
    authorId: string;
    pageCount: number;
    isbn: string | null;
    yearRead: number | null;
    status: string;
    rating: number | null;
    coverUrl: string | null;
    quotes: Quote[];
    notes: Note[];
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Book {
    const state: BookState = {
      title: Title.fromString(props.title),
      authorId: props.authorId,
      pageCount: PageCount.fromNumber(props.pageCount),
      isbn: props.isbn ? ISBN.fromString(props.isbn) : null,
      yearRead: props.yearRead,
      status: ReadingStatusUtils.fromString(props.status),
      rating: props.rating ? Rating.fromNumber(props.rating) : null,
      coverUrl: props.coverUrl,
      quotes: props.quotes,
      notes: props.notes,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    const book = new Book(BookId.fromString(props.id), state);
    book.setVersion(props.version);

    return book;
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  get title(): string {
    return this.state.title.value;
  }

  get authorId(): string {
    return this.state.authorId;
  }

  get pageCount(): number {
    return this.state.pageCount.value;
  }

  get isbn(): string | null {
    return this.state.isbn?.value ?? null;
  }

  get yearRead(): number | null {
    return this.state.yearRead;
  }

  get status(): ReadingStatus {
    return this.state.status;
  }

  get rating(): number | null {
    return this.state.rating?.value ?? null;
  }

  get coverUrl(): string | null {
    return this.state.coverUrl;
  }

  get quotes(): readonly Quote[] {
    return Object.freeze([...this.state.quotes]);
  }

  get notes(): readonly Note[] {
    return Object.freeze([...this.state.notes]);
  }

  get createdAt(): Date {
    return this.state.createdAt;
  }

  get updatedAt(): Date {
    return this.state.updatedAt;
  }

  get isFinished(): boolean {
    return this.state.status === ReadingStatus.FINISHED;
  }

  get isLongBook(): boolean {
    return this.state.pageCount.isLongBook;
  }

  // ==========================================================================
  // Commands (Business Operations)
  // ==========================================================================

  /**
   * Update book details.
   * Only provided fields will be updated.
   */
  updateDetails(changes: {
    title?: string;
    pageCount?: number;
    yearRead?: number | null;
    rating?: number | null;
    coverUrl?: string | null;
  }): void {
    const actualChanges: Record<string, unknown> = {};

    if (changes.title !== undefined) {
      const newTitle = Title.create(changes.title);
      if (newTitle.value !== this.state.title.value) {
        this.state.title = newTitle;
        actualChanges.title = newTitle.value;
      }
    }

    if (changes.pageCount !== undefined) {
      const newPageCount = PageCount.create(changes.pageCount);
      if (newPageCount.value !== this.state.pageCount.value) {
        this.state.pageCount = newPageCount;
        actualChanges.pageCount = newPageCount.value;
      }
    }

    if (changes.yearRead !== undefined) {
      if (changes.yearRead !== null) {
        Book.validateYearRead(changes.yearRead);
      }
      if (changes.yearRead !== this.state.yearRead) {
        this.state.yearRead = changes.yearRead;
        actualChanges.yearRead = changes.yearRead;
      }
    }

    if (changes.rating !== undefined) {
      const newRating = changes.rating !== null ? Rating.create(changes.rating) : null;
      const currentRating = this.state.rating?.value ?? null;
      if (newRating?.value !== currentRating) {
        this.state.rating = newRating;
        actualChanges.rating = newRating?.value ?? null;
      }
    }

    if (changes.coverUrl !== undefined) {
      const newCoverUrl = changes.coverUrl?.trim() || null;
      if (newCoverUrl !== this.state.coverUrl) {
        this.state.coverUrl = newCoverUrl;
        actualChanges.coverUrl = newCoverUrl;
      }
    }

    // Only raise event if something actually changed
    if (Object.keys(actualChanges).length > 0) {
      this.state.updatedAt = new Date();

      this.addDomainEvent(
        new BookUpdatedEvent({
          bookId: this.id.value,
          changes: actualChanges as BookUpdatedEvent['payload']['changes'],
          updatedAt: this.state.updatedAt,
        })
      );
    }
  }

  /**
   * Change the reading status.
   */
  changeStatus(newStatus: ReadingStatus): void {
    if (this.state.status === newStatus) {
      return; // No change
    }

    // Validate transition
    if (!ReadingStatusUtils.canTransition(this.state.status, newStatus)) {
      throw new DomainException(
        `Cannot transition from ${this.state.status} to ${newStatus}`,
        'INVALID_STATUS_TRANSITION',
        { currentStatus: this.state.status, newStatus }
      );
    }

    this.state.status = newStatus;
    this.state.updatedAt = new Date();

    this.addDomainEvent(
      new BookUpdatedEvent({
        bookId: this.id.value,
        changes: { status: newStatus },
        updatedAt: this.state.updatedAt,
      })
    );

    // If transitioning to FINISHED, also require yearRead
    if (newStatus === ReadingStatus.FINISHED && this.state.yearRead === null) {
      // Auto-set to current year
      this.state.yearRead = new Date().getFullYear();
    }
  }

  /**
   * Mark the book as finished.
   * This is a significant domain event.
   */
  markAsFinished(yearRead: number, rating?: number): void {
    Book.validateYearRead(yearRead);

    const newRating = rating !== undefined ? Rating.create(rating) : this.state.rating;

    this.state.status = ReadingStatus.FINISHED;
    this.state.yearRead = yearRead;
    this.state.rating = newRating;
    this.state.updatedAt = new Date();

    this.addDomainEvent(
      new BookFinishedEvent({
        bookId: this.id.value,
        authorId: this.state.authorId,
        title: this.state.title.value,
        pageCount: this.state.pageCount.value,
        yearRead,
        rating: newRating?.value ?? null,
        finishedAt: this.state.updatedAt,
      })
    );
  }

  /**
   * Add a quote from the book.
   */
  addQuote(content: string, page?: number): Quote {
    const quote = Quote.create({
      bookId: this.id,
      content,
      page,
    });

    this.state.quotes.push(quote);
    this.state.updatedAt = new Date();

    this.addDomainEvent(
      new QuoteAddedEvent({
        bookId: this.id.value,
        quoteId: quote.id.value,
        content: quote.content,
        page: quote.page,
      })
    );

    return quote;
  }

  /**
   * Remove a quote by ID.
   */
  removeQuote(quoteId: string): void {
    const index = this.state.quotes.findIndex((q) => q.id.value === quoteId);

    if (index === -1) {
      throw new DomainException('Quote not found', 'QUOTE_NOT_FOUND', { quoteId });
    }

    this.state.quotes.splice(index, 1);
    this.state.updatedAt = new Date();
  }

  /**
   * Add a personal note about the book.
   */
  addNote(content: string, chapter?: string): Note {
    const note = Note.create({
      bookId: this.id,
      content,
      chapter,
    });

    this.state.notes.push(note);
    this.state.updatedAt = new Date();

    return note;
  }

  /**
   * Remove a note by ID.
   */
  removeNote(noteId: string): void {
    const index = this.state.notes.findIndex((n) => n.id.value === noteId);

    if (index === -1) {
      throw new DomainException('Note not found', 'NOTE_NOT_FOUND', { noteId });
    }

    this.state.notes.splice(index, 1);
    this.state.updatedAt = new Date();
  }

  /**
   * Mark the book for deletion.
   * Raises BookDeletedEvent for cleanup in other services.
   */
  markAsDeleted(): void {
    this.addDomainEvent(
      new BookDeletedEvent({
        bookId: this.id.value,
        authorId: this.state.authorId,
        pageCount: this.state.pageCount.value,
        yearRead: this.state.yearRead,
      })
    );
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private static validateYearRead(year: number): void {
    const currentYear = new Date().getFullYear();

    if (!Number.isInteger(year)) {
      throw new DomainException('Year must be an integer', 'INVALID_YEAR');
    }

    if (year < 1900 || year > currentYear + 1) {
      throw new DomainException(
        `Year must be between 1900 and ${currentYear + 1}`,
        'INVALID_YEAR',
        { year, minYear: 1900, maxYear: currentYear + 1 }
      );
    }
  }

  // ==========================================================================
  // Serialization
  // ==========================================================================

  /**
   * Convert to plain object for persistence.
   */
  toObject(): {
    id: string;
    title: string;
    authorId: string;
    pageCount: number;
    isbn: string | null;
    yearRead: number | null;
    status: string;
    rating: number | null;
    coverUrl: string | null;
    quotes: ReturnType<Quote['toObject']>[];
    notes: ReturnType<Note['toObject']>[];
    version: number;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.value,
      title: this.state.title.value,
      authorId: this.state.authorId,
      pageCount: this.state.pageCount.value,
      isbn: this.state.isbn?.value ?? null,
      yearRead: this.state.yearRead,
      status: this.state.status,
      rating: this.state.rating?.value ?? null,
      coverUrl: this.state.coverUrl,
      quotes: this.state.quotes.map((q) => q.toObject()),
      notes: this.state.notes.map((n) => n.toObject()),
      version: this.version,
      createdAt: this.state.createdAt,
      updatedAt: this.state.updatedAt,
    };
  }
}
