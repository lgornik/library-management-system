import { PoolClient } from 'pg';
import { Author, AuthorId, IAuthorRepository } from '../../../domain/index.js';
import { query, transaction } from './postgres.js';

interface AuthorRow {
  id: string;
  name: string;
  biography: string | null;
  nationality: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * PostgreSQL implementation of IAuthorRepository (Write Model).
 */
export class PostgresAuthorRepository implements IAuthorRepository {
  async findById(id: AuthorId): Promise<Author | null> {
    const result = await query<AuthorRow>(`SELECT * FROM authors WHERE id = $1`, [id.value]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.toAggregate(result.rows[0]!);
  }

  async findByName(name: string): Promise<Author[]> {
    const result = await query<AuthorRow>(`SELECT * FROM authors WHERE LOWER(name) LIKE LOWER($1)`, [
      `%${name}%`,
    ]);

    return result.rows.map((row) => this.toAggregate(row));
  }

  async save(author: Author): Promise<void> {
    await transaction(async (client) => {
      const exists = await this.existsInTransaction(client, author.id);

      if (exists) {
        await this.update(client, author);
      } else {
        await this.insert(client, author);
      }
    });
  }

  async delete(id: AuthorId): Promise<void> {
    await transaction(async (client) => {
      await client.query(`DELETE FROM authors WHERE id = $1`, [id.value]);
    });
  }

  async exists(id: AuthorId): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM authors WHERE id = $1) as exists`,
      [id.value]
    );
    return result.rows[0]?.exists ?? false;
  }

  nextId(): AuthorId {
    return AuthorId.generate();
  }

  // ==========================================================================
  // Private methods
  // ==========================================================================

  private async existsInTransaction(client: PoolClient, id: AuthorId): Promise<boolean> {
    const result = await client.query(
      `SELECT EXISTS(SELECT 1 FROM authors WHERE id = $1) as exists`,
      [id.value]
    );
    return result.rows[0]?.exists ?? false;
  }

  private async insert(client: PoolClient, author: Author): Promise<void> {
    await client.query(
      `INSERT INTO authors (id, name, biography, nationality, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        author.id.value,
        author.name,
        author.biography,
        author.nationality,
        author.version + 1,
        author.createdAt,
        author.updatedAt,
      ]
    );
  }

  private async update(client: PoolClient, author: Author): Promise<void> {
    const result = await client.query(
      `UPDATE authors
       SET name = $2, biography = $3, nationality = $4,
           version = version + 1, updated_at = $5
       WHERE id = $1 AND version = $6
       RETURNING version`,
      [
        author.id.value,
        author.name,
        author.biography,
        author.nationality,
        author.updatedAt,
        author.version,
      ]
    );

    if (result.rowCount === 0) {
      throw new Error(`Optimistic concurrency conflict for Author ${author.id.value}`);
    }
  }

  private toAggregate(row: AuthorRow): Author {
    return Author.reconstitute({
      id: row.id,
      name: row.name,
      biography: row.biography,
      nationality: row.nationality,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
