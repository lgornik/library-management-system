import { AggregateRoot, DomainException } from '@library/shared-kernel';
import { AuthorId, AuthorName } from '../value-objects/index.js';
import {
  AuthorCreatedEvent,
  AuthorUpdatedEvent,
  AuthorDeletedEvent,
} from '../events/index.js';

/**
 * Props for creating a new Author
 */
export interface CreateAuthorProps {
  name: string;
  biography?: string;
  nationality?: string;
}

/**
 * Internal state of the Author aggregate
 */
interface AuthorState {
  name: AuthorName;
  biography: string | null;
  nationality: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Author Aggregate Root
 *
 * Encapsulates author details and all modifications through the aggregate root.
 *
 * @example
 * const author = Author.create({ name: 'Robert C. Martin', nationality: 'US' });
 * author.updateDetails({ biography: 'Software engineer and author' });
 */
export class Author extends AggregateRoot<AuthorId> {
  private state: AuthorState;

  private constructor(id: AuthorId, state: AuthorState) {
    super(id);
    this.state = state;
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  static create(props: CreateAuthorProps): Author {
    const id = AuthorId.generate();
    const now = new Date();

    if (!props.name || props.name.trim().length === 0) {
      throw new DomainException('Author name is required', 'INVALID_AUTHOR');
    }

    const name = AuthorName.create(props.name);

    const state: AuthorState = {
      name,
      biography: props.biography?.trim() || null,
      nationality: props.nationality?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    const author = new Author(id, state);

    author.addDomainEvent(
      new AuthorCreatedEvent({
        authorId: id.value,
        name: name.value,
        biography: state.biography,
        nationality: state.nationality,
      })
    );

    return author;
  }

  /**
   * Reconstitute an Author from persistence. Does NOT raise domain events.
   */
  static reconstitute(props: {
    id: string;
    name: string;
    biography: string | null;
    nationality: string | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Author {
    const state: AuthorState = {
      name: AuthorName.fromString(props.name),
      biography: props.biography,
      nationality: props.nationality,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    const author = new Author(AuthorId.fromString(props.id), state);
    author.setVersion(props.version);
    return author;
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  get name(): string {
    return this.state.name.value;
  }

  get biography(): string | null {
    return this.state.biography;
  }

  get nationality(): string | null {
    return this.state.nationality;
  }

  get createdAt(): Date {
    return this.state.createdAt;
  }

  get updatedAt(): Date {
    return this.state.updatedAt;
  }

  // ==========================================================================
  // Commands (Business Operations)
  // ==========================================================================

  updateDetails(changes: {
    name?: string;
    biography?: string | null;
    nationality?: string | null;
  }): void {
    const actualChanges: Record<string, unknown> = {};

    if (changes.name !== undefined) {
      const newName = AuthorName.create(changes.name);
      if (newName.value !== this.state.name.value) {
        this.state.name = newName;
        actualChanges['name'] = newName.value;
      }
    }

    if (changes.biography !== undefined) {
      const newBio = changes.biography?.trim() || null;
      if (newBio !== this.state.biography) {
        this.state.biography = newBio;
        actualChanges['biography'] = newBio;
      }
    }

    if (changes.nationality !== undefined) {
      const newNat = changes.nationality?.trim() || null;
      if (newNat !== this.state.nationality) {
        this.state.nationality = newNat;
        actualChanges['nationality'] = newNat;
      }
    }

    if (Object.keys(actualChanges).length > 0) {
      this.state.updatedAt = new Date();

      this.addDomainEvent(
        new AuthorUpdatedEvent({
          authorId: this.id.value,
          changes: actualChanges as AuthorUpdatedEvent['payload']['changes'],
          updatedAt: this.state.updatedAt,
        })
      );
    }
  }

  /**
   * Mark the author for deletion.
   */
  markAsDeleted(): void {
    this.addDomainEvent(
      new AuthorDeletedEvent({
        authorId: this.id.value,
      })
    );
  }

  // ==========================================================================
  // Serialization
  // ==========================================================================

  toObject(): {
    id: string;
    name: string;
    biography: string | null;
    nationality: string | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.value,
      name: this.state.name.value,
      biography: this.state.biography,
      nationality: this.state.nationality,
      version: this.version,
      createdAt: this.state.createdAt,
      updatedAt: this.state.updatedAt,
    };
  }
}
