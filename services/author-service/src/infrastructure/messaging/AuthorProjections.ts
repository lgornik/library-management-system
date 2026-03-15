import { getCollection, Collections } from '../persistence/read/mongodb.js';
import { AuthorDocument } from '../persistence/read/ReadModels.js';
import {
  AuthorCreatedEventPayload,
  AuthorUpdatedEventPayload,
  AuthorDeletedEventPayload,
} from '../../domain/index.js';

/**
 * Author Projections — Event Handlers that update the Read Model
 */
export class AuthorProjections {
  /**
   * Handle AuthorCreatedEvent
   */
  async onAuthorCreated(payload: AuthorCreatedEventPayload): Promise<void> {
    const collection = getCollection<AuthorDocument>(Collections.AUTHORS);

    const document: AuthorDocument = {
      _id: payload.authorId,
      name: payload.name,
      biography: payload.biography,
      nationality: payload.nationality,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(document);
    console.log(`📊 Projection: Author created in read model: ${payload.authorId}`);
  }

  /**
   * Handle AuthorUpdatedEvent
   */
  async onAuthorUpdated(payload: AuthorUpdatedEventPayload): Promise<void> {
    const collection = getCollection<AuthorDocument>(Collections.AUTHORS);

    const updateFields: Partial<AuthorDocument> = {
      updatedAt: payload.updatedAt,
    };

    if (payload.changes.name !== undefined) {
      updateFields.name = payload.changes.name;
    }
    if (payload.changes.biography !== undefined) {
      updateFields.biography = payload.changes.biography;
    }
    if (payload.changes.nationality !== undefined) {
      updateFields.nationality = payload.changes.nationality;
    }
    await collection.updateOne

    console.log(`📊 Projection: Author updated in read model: ${payload.authorId}`);
  }

  /**
   * Handle AuthorDeletedEvent
   */
  async onAuthorDeleted(payload: AuthorDeletedEventPayload): Promise<void> {
    const collection = getCollection<AuthorDocument>(Collections.AUTHORS);

    await collection.deleteOne({ _id: payload.authorId });

    console.log(`📊 Projection: Author deleted from read model: ${payload.authorId}`);
  }
}

/**
 * Create event router that dispatches events to the correct projection handler
 */
export function createProjectionRouter(projections: AuthorProjections) {
  return async (event: { eventName: string; payload: unknown }) => {
    switch (event.eventName) {
      case 'library.author.created':
        await projections.onAuthorCreated(event.payload as AuthorCreatedEventPayload);
        break;

      case 'library.author.updated':
        await projections.onAuthorUpdated(event.payload as AuthorUpdatedEventPayload);
        break;

      case 'library.author.deleted':
        await projections.onAuthorDeleted(event.payload as AuthorDeletedEventPayload);
        break;

      default:
        console.log(`⚠️ Unknown event type: ${event.eventName}`);
    }
  };
}
