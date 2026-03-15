import {
  ICommandHandler,
  IDomainEventPublisher,
  EntityNotFoundException,
} from '@library/shared-kernel';
import { UpdateAuthorCommand } from '../commands/UpdateAuthorCommand.js';
import { IAuthorRepository, AuthorId } from '../../domain/index.js';

export class UpdateAuthorHandler implements ICommandHandler<UpdateAuthorCommand, void> {
  constructor(
    private readonly authorRepository: IAuthorRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: UpdateAuthorCommand): Promise<void> {
    const { authorId, ...changes } = command.payload;

    const author = await this.authorRepository.findById(AuthorId.fromString(authorId));

    if (!author) {
      throw new EntityNotFoundException('Author', authorId);
    }

    author.updateDetails(changes);

    await this.authorRepository.save(author);

    if (author.hasUncommittedEvents()) {
      await this.eventPublisher.publishAll([...author.domainEvents]);
      author.clearDomainEvents();
    }
  }
}
