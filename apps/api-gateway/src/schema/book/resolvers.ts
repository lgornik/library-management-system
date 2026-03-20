import { GraphQLError } from 'graphql';
import {
  CreateBookCommand,
  UpdateBookCommand,
  DeleteBookCommand,
  MarkBookAsFinishedCommand,
  AddQuoteCommand,
  AddNoteCommand,
  type CreateBookResult,
  type CreateBookCommandPayload,
} from '@library/book-service';
import { getBookService, getAuthorService } from '../../services/index.js';

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

export const bookResolvers = {
  // ===========================================================================
  // Queries
  // ===========================================================================
  Query: {
    async book(_: unknown, args: { id: string }) {
      try {
        const readRepo = getBookService().getReadRepository();
        return await readRepo.findById(args.id);
      } catch (error) {
        handleError(error);
      }
    },

    async books(
      _: unknown,
      args: {
        year: number;
        sortBy?: string;
        sortOrder?: string;
        limit?: number;
        offset?: number;
      }
    ) {
      try {
        const readRepo = getBookService().getReadRepository();
        return await readRepo.findByYear(
          args.year,
          (args.sortBy as 'pageCount' | 'title' | 'rating' | 'createdAt') ?? undefined,
          (args.sortOrder as 'asc' | 'desc') ?? undefined,
          args.limit ?? undefined,
          args.offset ?? undefined,
        );
      } catch (error) {
        handleError(error);
      }
    },

    async authorStats(_: unknown, args: { year: number; limit?: number }) {
      try {
        const readRepo = getBookService().getReadRepository();
        return await readRepo.getAuthorStatsByYear(args.year, args.limit ?? undefined);
      } catch (error) {
        handleError(error);
      }
    },
  },

  // ===========================================================================
  // Mutations
  // ===========================================================================
  Mutation: {
    async createBook(
      _: unknown,
      args: {
        input: {
          title: string;
          authorId: string;
          pageCount: number;
          isbn?: string;
          yearRead?: number;
          status?: string;
          rating?: number;
          coverUrl?: string;
        };
      }
    ) {
      try {
        const commandBus = getBookService().getCommandBus();
        const result = await commandBus.execute<CreateBookResult>(
          new CreateBookCommand(args.input as CreateBookCommandPayload)
        );

        const readRepo = getBookService().getReadRepository();
        return await readRepo.findById(result.bookId);
      } catch (error) {
        handleError(error);
      }
    },

    async updateBook(
      _: unknown,
      args: {
        input: {
          bookId: string;
          title?: string;
          pageCount?: number;
          yearRead?: number;
          rating?: number;
          coverUrl?: string;
        };
      }
    ) {
      try {
        const commandBus = getBookService().getCommandBus();
        await commandBus.execute(new UpdateBookCommand(args.input));

        const readRepo = getBookService().getReadRepository();
        return await readRepo.findById(args.input.bookId);
      } catch (error) {
        handleError(error);
      }
    },

    async deleteBook(_: unknown, args: { id: string }) {
      try {
        const commandBus = getBookService().getCommandBus();
        await commandBus.execute(new DeleteBookCommand({ bookId: args.id }));
        return true;
      } catch (error) {
        handleError(error);
      }
    },

    async markBookAsFinished(
      _: unknown,
      args: {
        input: {
          bookId: string;
          yearRead: number;
          rating?: number;
        };
      }
    ) {
      try {
        const commandBus = getBookService().getCommandBus();
        await commandBus.execute(new MarkBookAsFinishedCommand(args.input));

        const readRepo = getBookService().getReadRepository();
        return await readRepo.findById(args.input.bookId);
      } catch (error) {
        handleError(error);
      }
    },

    async addQuote(
      _: unknown,
      args: {
        input: {
          bookId: string;
          content: string;
          page?: number;
        };
      }
    ) {
      try {
        const commandBus = getBookService().getCommandBus();
        await commandBus.execute(new AddQuoteCommand(args.input));

        const readRepo = getBookService().getReadRepository();
        return await readRepo.findById(args.input.bookId);
      } catch (error) {
        handleError(error);
      }
    },

    async addNote(
      _: unknown,
      args: {
        input: {
          bookId: string;
          content: string;
          chapter?: string;
        };
      }
    ) {
      try {
        const commandBus = getBookService().getCommandBus();
        await commandBus.execute(new AddNoteCommand(args.input));

        const readRepo = getBookService().getReadRepository();
        return await readRepo.findById(args.input.bookId);
      } catch (error) {
        handleError(error);
      }
    },
  },

  // ===========================================================================
  // Field resolvers
  // ===========================================================================
  Book: {
    async author(parent: { authorId: string }) {
      try {
        const readRepo = getAuthorService().getReadRepository();
        return await readRepo.findById(parent.authorId);
      } catch {
        // Author may not exist yet — return null
        return null;
      }
    },
  },
};

