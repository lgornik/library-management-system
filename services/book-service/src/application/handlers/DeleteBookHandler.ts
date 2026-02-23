import { ICommandHandler, IDomainEventPublisher, EntityNotFoundException } from '@library/shared-kernel';
import { DeleteBookCommand } from '../commands/DeleteBookCommand.js';
import { IBookRepository, BookId } from '../../domain/index.js';

/**
 * Handler for DeleteBookCommand.
 */
export class DeleteBookHandler implements ICommandHandler<DeleteBookCommand, void> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: DeleteBookCommand): Promise<void> {
    const { bookId } = command.payload;
    const id = BookId.fromString(bookId);

    // Load the aggregate to get data for the event
    const book = await this.bookRepository.findById(id);

    if (!book) {
      throw new EntityNotFoundException('Book', bookId);
    }

    // Mark as deleted (raises BookDeletedEvent)
    book.markAsDeleted();

    // Delete from repository
    await this.bookRepository.delete(id);

    // Publish domain events
    await this.eventPublisher.publishAll([...book.domainEvents]);
  }
}
