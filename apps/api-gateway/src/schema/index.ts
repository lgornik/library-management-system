import { makeExecutableSchema } from '@graphql-tools/schema';
import { scalarTypeDefs, scalarResolvers } from './scalars.js';
import { bookTypeDefs } from './book/typeDefs.js';
import { bookResolvers } from './book/resolvers.js';
import { authorTypeDefs } from './author/typeDefs.js';
import { authorResolvers } from './author/resolvers.js';
import { getBookService, getAuthorService } from '../services/index.js';

// =============================================================================
// Base types (required for `extend type Query / Mutation`)
// =============================================================================

const baseTypeDefs = /* GraphQL */ `
  enum SortOrder {
    asc
    desc
  }

  type HealthStatus {
    bookService: ServiceHealth!
    authorService: ServiceHealth!
  }

  type ServiceHealth {
    postgres: Boolean!
    mongodb: Boolean!
    rabbitmq: Boolean!
  }

  type Query {
    health: HealthStatus!
  }

  type Mutation {
    _empty: String
  }
`;

// =============================================================================
// Base resolvers
// =============================================================================

const baseResolvers = {
  Query: {
    async health() {
      const [bookHealth, authorHealth] = await Promise.all([
        getBookService().healthCheck(),
        getAuthorService().healthCheck(),
      ]);

      return {
        bookService: bookHealth,
        authorService: authorHealth,
      };
    },
  },
};

// =============================================================================
// Build executable schema
// =============================================================================

export const schema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, scalarTypeDefs, bookTypeDefs, authorTypeDefs],
  resolvers: [baseResolvers, scalarResolvers, bookResolvers, authorResolvers],
});
