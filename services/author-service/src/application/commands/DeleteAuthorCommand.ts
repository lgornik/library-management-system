import { Command } from '@library/shared-kernel';

export interface DeleteAuthorCommandPayload {
  authorId: string;
}

export class DeleteAuthorCommand extends Command<DeleteAuthorCommandPayload> {
  constructor(authorId: string) {
    super({ authorId });
  }
}
