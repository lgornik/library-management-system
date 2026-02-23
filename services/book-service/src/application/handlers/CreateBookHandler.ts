import { ICommandHandler, IDomainEventPublisher } from '@library/shared-kernel';
import { CreateBookCommand } from '../commands/CreateBookCommand.js';
import { Book, IBookRepository } from '../../domain/index.js';

/**
 * Result of creating a book
 */
export interface CreateBookResult {
  bookId: string;
}

/**
 * Handler for CreateBookCommand.
 *
 * Responsibilities:
 * 1. Create the Book aggregate
 * 2. Persist the book
 * 3. Publish domain events
 *
 * @example
 * const handler = new CreateBookHandler(bookRepository, eventPublisher);
 *
 * const result = await handler.execute(new CreateBookCommand({
 *   title: 'Domain-Driven Design',
 *   authorId: 'author-123',
 *   pageCount: 560,
 * }));
 *
 * console.log(result.bookId); // 'book-456'
 */
export class CreateBookHandler implements ICommandHandler<CreateBookCommand, CreateBookResult> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: CreateBookCommand): Promise<CreateBookResult> {
    const { title, authorId, pageCount, isbn, yearRead, status, rating, coverUrl } =
      command.payload;

    // Check for duplicate ISBN
    if (isbn) {
      const existingBook = await this.bookRepository.findByIsbn(isbn);
      if (existingBook) {
        throw new Error(`Book with ISBN ${isbn} already exists`);
      }
    }

    // Create the aggregate (domain logic + validation happens here)
    const book = Book.create({
      title,
      authorId,
      pageCount,
      isbn,
      yearRead,
      status,
      rating,
      coverUrl,
    });

    // Persist the aggregate
    await this.bookRepository.save(book);

    // Publish domain events
    await this.eventPublisher.publishAll([...book.domainEvents]);

    // Clear events after publishing
    book.clearDomainEvents();

    return { bookId: book.id.value };
  }
}
