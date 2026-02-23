import { getCollection, Collections } from '../persistence/read/mongodb.js';
import { BookDocument } from '../persistence/read/ReadModels.js';
import {
  BookCreatedEventPayload,
  BookUpdatedEventPayload,
  BookDeletedEventPayload,
  QuoteAddedEventPayload,
} from '../../domain/index.js';

/**
 * Book Projections - Event Handlers that update the Read Model
 *
 * These handlers listen to domain events and update MongoDB documents
 * to keep the read model in sync with the write model.
 *
 * In CQRS, projections are responsible for:
 * - Transforming domain events into read-optimized documents
 * - Denormalizing data for fast queries
 * - Keeping the read model eventually consistent
 */
export class BookProjections {
  /**
   * Handle BookCreatedEvent
   * Creates a new book document in MongoDB
   */
  async onBookCreated(payload: BookCreatedEventPayload): Promise<void> {
    const collection = getCollection<BookDocument>(Collections.BOOKS);

    // TODO: Fetch author name from Author Service via gRPC
    // For now, we'll use a placeholder
    const authorName = await this.fetchAuthorName(payload.authorId);

    const document: BookDocument = {
      _id: payload.bookId,
      title: payload.title,
      authorId: payload.authorId,
      authorName: authorName,
      pageCount: payload.pageCount,
      isbn: payload.isbn,
      yearRead: payload.yearRead,
      status: payload.status,
      rating: null,
      coverUrl: null,
      quotes: [],
      notes: [],
      quotesCount: 0,
      notesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(document);
    console.log(`📊 Projection: Book created in read model: ${payload.bookId}`);
  }

  /**
   * Handle BookUpdatedEvent
   * Updates existing book document
   */
  async onBookUpdated(payload: BookUpdatedEventPayload): Promise<void> {
    const collection = getCollection<BookDocument>(Collections.BOOKS);

    const updateFields: Partial<BookDocument> = {
      updatedAt: payload.updatedAt,
    };

    if (payload.changes.title !== undefined) {
      updateFields.title = payload.changes.title;
    }
    if (payload.changes.pageCount !== undefined) {
      updateFields.pageCount = payload.changes.pageCount;
    }
    if (payload.changes.yearRead !== undefined) {
      updateFields.yearRead = payload.changes.yearRead;
    }
    if (payload.changes.rating !== undefined) {
      updateFields.rating = payload.changes.rating;
    }
    if (payload.changes.status !== undefined) {
      updateFields.status = payload.changes.status;
    }

    await collection.updateOne(
      { _id: payload.bookId },
      { $set: updateFields }
    );

    console.log(`📊 Projection: Book updated in read model: ${payload.bookId}`);
  }

  /**
   * Handle BookDeletedEvent
   * Removes book document from MongoDB
   */
  async onBookDeleted(payload: BookDeletedEventPayload): Promise<void> {
    const collection = getCollection<BookDocument>(Collections.BOOKS);

    await collection.deleteOne({ _id: payload.bookId });

    console.log(`📊 Projection: Book deleted from read model: ${payload.bookId}`);
  }

  /**
   * Handle QuoteAddedEvent
   * Adds quote to the book's quotes array
   */
  async onQuoteAdded(payload: QuoteAddedEventPayload): Promise<void> {
    const collection = getCollection<BookDocument>(Collections.BOOKS);

    const newQuote = {
      id: payload.quoteId,
      content: payload.content,
      page: payload.page,
      createdAt: new Date(),
    };

    await collection.updateOne(
      { _id: payload.bookId },
      {
        $push: { quotes: newQuote } as any,
        $inc: { quotesCount: 1 },
        $set: { updatedAt: new Date() },
      }
    );

    console.log(`📊 Projection: Quote added to book: ${payload.bookId}`);
  }

  /**
   * Fetch author name from Author Service
   * TODO: Implement gRPC call to Author Service
   */
  private async fetchAuthorName(authorId: string): Promise<string> {
    // Placeholder - will be replaced with gRPC call
    return `Author ${authorId.substring(0, 8)}`;
  }
}

/**
 * Create event router that dispatches events to the correct projection handler
 */
export function createProjectionRouter(projections: BookProjections) {
  return async (event: { eventName: string; payload: unknown }) => {
    switch (event.eventName) {
      case 'library.book.created':
        await projections.onBookCreated(event.payload as BookCreatedEventPayload);
        break;

      case 'library.book.updated':
        await projections.onBookUpdated(event.payload as BookUpdatedEventPayload);
        break;

      case 'library.book.deleted':
        await projections.onBookDeleted(event.payload as BookDeletedEventPayload);
        break;

      case 'library.book.quote_added':
        await projections.onQuoteAdded(event.payload as QuoteAddedEventPayload);
        break;

      case 'library.book.finished':
        // BookFinishedEvent also triggers an update
        // The rating and yearRead are already in the payload
        await projections.onBookUpdated({
          bookId: (event.payload as { bookId: string }).bookId,
          changes: {
            status: 'FINISHED',
            yearRead: (event.payload as { yearRead: number }).yearRead,
            rating: (event.payload as { rating: number | null }).rating,
          },
          updatedAt: new Date(),
        });
        break;

      default:
        console.log(`⚠️ Unknown event type: ${event.eventName}`);
    }
  };
}
