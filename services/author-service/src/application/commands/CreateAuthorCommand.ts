import { Command } from '@library/shared-kernel';

export interface CreateAuthorCommandPayload {
  name: string;
  biography?: string;
  nationality?: string;
}

export class CreateAuthorCommand extends Command<CreateAuthorCommandPayload> {
  constructor(payload: CreateAuthorCommandPayload) {
    super(payload);
  }
}
