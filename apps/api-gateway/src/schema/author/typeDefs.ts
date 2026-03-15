export const authorTypeDefs = /* GraphQL */ `
  # ===========================================================================
  # Enums
  # ===========================================================================

  enum AuthorSortField {
    name
    createdAt
  }

  # ===========================================================================
  # Types
  # ===========================================================================

  type Author {
    id: ID!
    name: String!
    biography: String
    nationality: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # ===========================================================================
  # Inputs
  # ===========================================================================

  input CreateAuthorInput {
    name: String!
    biography: String
    nationality: String
  }

  input UpdateAuthorInput {
    authorId: ID!
    name: String
    biography: String
    nationality: String
  }

  # ===========================================================================
  # Queries & Mutations
  # ===========================================================================

  extend type Query {
    author(id: ID!): Author
    authors(
      sortBy: AuthorSortField
      sortOrder: SortOrder
      limit: Int
      offset: Int
    ): [Author!]!
  }

  extend type Mutation {
    createAuthor(input: CreateAuthorInput!): Author!
    updateAuthor(input: UpdateAuthorInput!): Author!
    deleteAuthor(id: ID!): Boolean!
  }
`;
