import { ICommandHandler, IDomainEventPublisher, EntityNotFoundException } from '@library/shared-kernel';
import { MarkBookAsFinishedCommand } from '../commands/MarkBookAsFinishedCommand.js';
import { IBookRepository, BookId } from '../../domain/index.js';

/**
 * Handler for MarkBookAsFinishedCommand.
 *
 * This is a significant business operation that triggers:
 * - BookFinishedEvent
 * - Statistics updates
 * - Possibly notifications
 */
export class MarkBookAsFinishedHandler implements ICommandHandler<MarkBookAsFinishedCommand, void> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: MarkBookAsFinishedCommand): Promise<void> {
    const { bookId, yearRead, rating } = command.payload;

    // Load the aggregate
    const book = await this.bookRepository.findById(BookId.fromString(bookId));

    if (!book) {
      throw new EntityNotFoundException('Book', bookId);
    }

    // Mark as finished (domain logic + event raising)
    book.markAsFinished(yearRead, rating);

    // Persist changes
    await this.bookRepository.save(book);

    // Publish domain events
    await this.eventPublisher.publishAll([...book.domainEvents]);
    book.clearDomainEvents();
  }
}
