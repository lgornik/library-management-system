import { GraphQLError } from 'graphql';
import {
  CreateAuthorCommand,
  UpdateAuthorCommand,
  DeleteAuthorCommand,
  type CreateAuthorResult,
} from '@library/author-service';
import { getAuthorService } from '../../services/index.js';

// =============================================================================
// Helpers
// =============================================================================

function handleError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new GraphQLError(message, {
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  });
}

// =============================================================================
// Resolvers
// =============================================================================

export const authorResolvers = {
  // ===========================================================================
  // Queries
  // ===========================================================================
  Query: {
    async author(_: unknown, args: { id: string }) {
      try {
        const readRepo = getAuthorService().getReadRepository();
        return await readRepo.findById(args.id);
      } catch (error) {
        handleError(error);
      }
    },

    async authors(
      _: unknown,
      args: {
        sortBy?: string;
        sortOrder?: string;
        limit?: number;
        offset?: number;
      }
    ) {
      try {
        const readRepo = getAuthorService().getReadRepository();
        return await readRepo.findAll(
          (args.sortBy as 'name' | 'createdAt') ?? undefined,
          (args.sortOrder as 'asc' | 'desc') ?? undefined,
          args.limit ?? undefined,
          args.offset ?? undefined,
        );
      } catch (error) {
        handleError(error);
      }
    },
  },

  // ===========================================================================
  // Mutations
  // ===========================================================================
  Mutation: {
    async createAuthor(
      _: unknown,
      args: {
        input: {
          name: string;
          biography?: string;
          nationality?: string;
        };
      }
    ) {
      try {
        const commandBus = getAuthorService().getCommandBus();
        const result = await commandBus.execute<CreateAuthorResult>(
          new CreateAuthorCommand(args.input)
        );

        const readRepo = getAuthorService().getReadRepository();
        return await readRepo.findById(result.authorId);
      } catch (error) {
        handleError(error);
      }
    },

    async updateAuthor(
      _: unknown,
      args: {
        input: {
          authorId: string;
          name?: string;
          biography?: string;
          nationality?: string;
        };
      }
    ) {
      try {
        const commandBus = getAuthorService().getCommandBus();
        await commandBus.execute(new UpdateAuthorCommand(args.input));

        const readRepo = getAuthorService().getReadRepository();
        return await readRepo.findById(args.input.authorId);
      } catch (error) {
        handleError(error);
      }
    },

    async deleteAuthor(_: unknown, args: { id: string }) {
      try {
        const commandBus = getAuthorService().getCommandBus();
        await commandBus.execute(new DeleteAuthorCommand(args.id));
        return true;
      } catch (error) {
        handleError(error);
      }
    },
  },
};
