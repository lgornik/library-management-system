import { Command } from '@library/shared-kernel';
import { ReadingStatus } from '../../domain/index.js';

/**
 * Payload for CreateBookCommand
 */
export interface CreateBookCommandPayload {
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
 * Command to create a new book in the library.
 *
 * @example
 * const command = new CreateBookCommand({
 *   title: 'Domain-Driven Design',
 *   authorId: 'author-123',
 *   pageCount: 560,
 *   isbn: '978-0321125217',
 *   yearRead: 2024,
 *   status: ReadingStatus.FINISHED,
 *   rating: 5,
 * });
 */
export class CreateBookCommand extends Command<CreateBookCommandPayload> {
  constructor(payload: CreateBookCommandPayload) {
    super(payload);
  }
}
