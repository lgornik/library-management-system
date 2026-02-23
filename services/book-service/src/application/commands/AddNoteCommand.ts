import { Command } from '@library/shared-kernel';

/**
 * Payload for AddNoteCommand
 */
export interface AddNoteCommandPayload {
  bookId: string;
  content: string;
  chapter?: string;
}

/**
 * Command to add a note to a book.
 */
export class AddNoteCommand extends Command<AddNoteCommandPayload> {
  constructor(payload: AddNoteCommandPayload) {
    super(payload);
  }
}
