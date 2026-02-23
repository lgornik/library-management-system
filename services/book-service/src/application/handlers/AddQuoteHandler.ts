import { ICommandHandler, IDomainEventPublisher, EntityNotFoundException } from '@library/shared-kernel';
import { AddQuoteCommand } from '../commands/AddQuoteCommand.js';
import { IBookRepository, BookId } from '../../domain/index.js';

/**
 * Result of adding a quote
 */
export interface AddQuoteResult {
  quoteId: string;
}

/**
 * Handler for AddQuoteCommand.
 */
export class AddQuoteHandler implements ICommandHandler<AddQuoteCommand, AddQuoteResult> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: AddQuoteCommand): Promise<AddQuoteResult> {
    const { bookId, content, page } = command.payload;

    // Load the aggregate
    const book = await this.bookRepository.findById(BookId.fromString(bookId));

    if (!book) {
      throw new EntityNotFoundException('Book', bookId);
    }

    // Add quote (domain logic + validation + event raising)
    const quote = book.addQuote(content, page);

    // Persist changes
    await this.bookRepository.save(book);

    // Publish domain events
    await this.eventPublisher.publishAll([...book.domainEvents]);
    book.clearDomainEvents();

    return { quoteId: quote.id.value };
  }
}
