import { UniqueId } from './UniqueId.js';

/**
 * Base class for Entities.
 *
 * Entities are objects that have a distinct identity that runs through time
 * and different representations. Two entities are equal if they have the same ID,
 * regardless of their other attributes.
 *
 * @example
 * class Quote extends Entity<QuoteId> {
 *   private constructor(
 *     id: QuoteId,
 *     private _content: string,
 *     private _page?: number
 *   ) {
 *     super(id);
 *   }
 *
 *   static create(props: { content: string; page?: number }): Quote {
 *     return new Quote(QuoteId.generate(), props.content, props.page);
 *   }
 *
 *   get content(): string { return this._content; }
 *   get page(): number | undefined { return this._page; }
 *
 *   updateContent(content: string): void {
 *     if (!content.trim()) throw new Error('Content cannot be empty');
 *     this._content = content;
 *   }
 * }
 */
export abstract class Entity<TId extends UniqueId> {
  protected constructor(protected readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }

  /**
   * Check equality with another Entity.
   * Two Entities are equal if they have the same ID.
   */
  equals(other: Entity<TId> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof Entity)) {
      return false;
    }
    return this._id.equals(other._id);
  }

  /**
   * Get hash code for the entity (based on ID)
   */
  hashCode(): string {
    return this._id.value;
  }
}
