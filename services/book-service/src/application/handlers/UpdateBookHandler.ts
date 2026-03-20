import { ICommandHandler, IDomainEventPublisher, EntityNotFoundException } from '@library/shared-kernel';
import { UpdateBookCommand } from '../commands/UpdateBookCommand.js';
import { IBookRepository, BookId, ReadingStatus, ReadingStatusUtils } from '../../domain/index.js';

/**
 * Handler for UpdateBookCommand.
 */
export class UpdateBookHandler implements ICommandHandler<UpdateBookCommand, void> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: UpdateBookCommand): Promise<void> {
    const { bookId, status, ...changes } = command.payload;

    // Load the aggregate
    const book = await this.bookRepository.findById(BookId.fromString(bookId));

    if (!book) {
      throw new EntityNotFoundException('Book', bookId);
    }

    // Apply detail changes (domain logic + validation happens here)
    book.updateDetails(changes);

    // Apply status change if requested
    if (status !== undefined) {
      const newStatus = ReadingStatusUtils.fromString(status);
      book.changeStatus(newStatus);
    }

    // Persist changes
    await this.bookRepository.save(book);

    // Publish domain events
    if (book.hasUncommittedEvents()) {
      await this.eventPublisher.publishAll([...book.domainEvents]);
      book.clearDomainEvents();
    }
  }
}
