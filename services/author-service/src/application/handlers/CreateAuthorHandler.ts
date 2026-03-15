import { ICommandHandler, IDomainEventPublisher } from '@library/shared-kernel';
import { CreateAuthorCommand } from '../commands/CreateAuthorCommand.js';
import { Author, IAuthorRepository } from '../../domain/index.js';

export interface CreateAuthorResult {
  authorId: string;
}

export class CreateAuthorHandler
  implements ICommandHandler<CreateAuthorCommand, CreateAuthorResult>
{
  constructor(
    private readonly authorRepository: IAuthorRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: CreateAuthorCommand): Promise<CreateAuthorResult> {
    const { name, biography, nationality } = command.payload;

    const author = Author.create({ name, biography, nationality });

    await this.authorRepository.save(author);

    await this.eventPublisher.publishAll([...author.domainEvents]);
    author.clearDomainEvents();

    return { authorId: author.id.value };
  }
}
