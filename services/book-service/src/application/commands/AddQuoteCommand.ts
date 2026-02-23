import { Command } from '@library/shared-kernel';

/**
 * Payload for AddQuoteCommand
 */
export interface AddQuoteCommandPayload {
  bookId: string;
  content: string;
  page?: number;
}

/**
 * Command to add a quote to a book.
 */
export class AddQuoteCommand extends Command<AddQuoteCommandPayload> {
  constructor(payload: AddQuoteCommandPayload) {
    super(payload);
  }
}
