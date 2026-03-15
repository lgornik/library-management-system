import { Command } from '@library/shared-kernel';

export interface UpdateAuthorCommandPayload {
  authorId: string;
  name?: string;
  biography?: string | null;
  nationality?: string | null;
}

export class UpdateAuthorCommand extends Command<UpdateAuthorCommandPayload> {
  constructor(payload: UpdateAuthorCommandPayload) {
    super(payload);
  }
}
