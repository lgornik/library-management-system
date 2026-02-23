import { ICommandHandler, IDomainEventPublisher, EntityNotFoundException } from '@library/shared-kernel';
import { UpdateBookCommand } from '../commands/UpdateBookCommand.js';
import { IBookRepository, BookId } from '../../domain/index.js';

/**
 * Handler for UpdateBookCommand.
 */
export class UpdateBookHandler implements ICommandHandler<UpdateBookCommand, void> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: UpdateBookCommand): Promise<void> {
    const { bookId, ...changes } = command.payload;

    // Load the aggregate
    const book = await this.bookRepository.findById(BookId.fromString(bookId));

    if (!book) {
      throw new EntityNotFoundException('Book', bookId);
    }

    // Apply changes (domain logic + validation happens here)
    book.updateDetails(changes);

    // Persist changes
    await this.bookRepository.save(book);

    // Publish domain events
    if (book.hasUncommittedEvents()) {
      await this.eventPublisher.publishAll([...book.domainEvents]);
      book.clearDomainEvents();
    }
  }
}
