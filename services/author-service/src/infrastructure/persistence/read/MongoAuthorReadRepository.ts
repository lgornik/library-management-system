import { Collection, Sort } from 'mongodb';
import { getCollection, Collections } from './mongodb.js';
import { AuthorDocument } from './ReadModels.js';
import { AuthorDetailsDto, AuthorListItemDto, AuthorSortField, SortOrder } from '../../../application/index.js';

/**
 * Read-only repository for querying authors from MongoDB.
 */
export class MongoAuthorReadRepository {
  private get collection(): Collection<AuthorDocument> {
    return getCollection<AuthorDocument>(Collections.AUTHORS);
  }

  async findById(authorId: string): Promise<AuthorDetailsDto | null> {
    const doc = await this.collection.findOne({ _id: authorId });

    if (!doc) {
      return null;
    }

    return this.toDetailsDto(doc);
  }

  async findAll(
    sortBy: AuthorSortField = 'name',
    sortOrder: SortOrder = 'asc',
    limit: number = 50,
    offset: number = 0
  ): Promise<AuthorListItemDto[]> {
    const sort: Sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const docs = await this.collection
      .find({})
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .toArray();

    return docs.map((doc) => this.toListItemDto(doc));
  }

  async search(searchTerm: string, limit: number = 20): Promise<AuthorListItemDto[]> {
    const docs = await this.collection
      .find({ name: { $regex: searchTerm, $options: 'i' } })
      .limit(limit)
      .toArray();

    return docs.map((doc) => this.toListItemDto(doc));
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  private toListItemDto(doc: AuthorDocument): AuthorListItemDto {
    return {
      id: doc._id,
      name: doc.name,
      nationality: doc.nationality,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private toDetailsDto(doc: AuthorDocument): AuthorDetailsDto {
    return {
      id: doc._id,
      name: doc.name,
      biography: doc.biography,
      nationality: doc.nationality,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
