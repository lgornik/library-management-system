import { Command } from '@library/shared-kernel';

/**
 * Payload for MarkBookAsFinishedCommand
 */
export interface MarkBookAsFinishedCommandPayload {
  bookId: string;
  yearRead: number;
  rating?: number;
}

/**
 * Command to mark a book as finished.
 *
 * This is a significant business event that triggers statistics updates.
 */
export class MarkBookAsFinishedCommand extends Command<MarkBookAsFinishedCommandPayload> {
  constructor(payload: MarkBookAsFinishedCommandPayload) {
    super(payload);
  }
}
