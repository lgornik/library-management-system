import { Command } from '@library/shared-kernel';

/**
 * Payload for UpdateBookCommand
 */
export interface UpdateBookCommandPayload {
  bookId: string;
  title?: string;
  pageCount?: number;
  yearRead?: number | null;
  rating?: number | null;
  coverUrl?: string | null;
}

/**
 * Command to update book details.
 *
 * Only provided fields will be updated.
 */
export class UpdateBookCommand extends Command<UpdateBookCommandPayload> {
  constructor(payload: UpdateBookCommandPayload) {
    super(payload);
  }
}
