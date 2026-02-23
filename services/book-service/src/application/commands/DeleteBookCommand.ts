import { Command } from '@library/shared-kernel';

/**
 * Payload for DeleteBookCommand
 */
export interface DeleteBookCommandPayload {
  bookId: string;
}

/**
 * Command to delete a book from the library.
 */
export class DeleteBookCommand extends Command<DeleteBookCommandPayload> {
  constructor(payload: DeleteBookCommandPayload) {
    super(payload);
  }
}
