import {
  ICommandHandler,
  IDomainEventPublisher,
  EntityNotFoundException,
} from '@library/shared-kernel';
import { DeleteAuthorCommand } from '../commands/DeleteAuthorCommand.js';
import { IAuthorRepository, AuthorId } from '../../domain/index.js';

export class DeleteAuthorHandler implements ICommandHandler<DeleteAuthorCommand, void> {
  constructor(
    private readonly authorRepository: IAuthorRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: DeleteAuthorCommand): Promise<void> {
    const { authorId } = command.payload;
    const id = AuthorId.fromString(authorId);

    const author = await this.authorRepository.findById(id);

    if (!author) {
      throw new EntityNotFoundException('Author', authorId);
    }

    author.markAsDeleted();

    await this.authorRepository.delete(id);

    await this.eventPublisher.publishAll([...author.domainEvents]);
  }
}
