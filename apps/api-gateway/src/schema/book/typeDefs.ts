export const bookTypeDefs = /* GraphQL */ `
  # ===========================================================================
  # Enums
  # ===========================================================================

  enum ReadingStatus {
    TO_READ
    READING
    FINISHED
    ABANDONED
  }

  enum BookSortField {
    pageCount
    title
    rating
    createdAt
  }

  # ===========================================================================
  # Types
  # ===========================================================================

  type Quote {
    id: ID!
    content: String!
    page: Int
    createdAt: DateTime!
  }

  type Note {
    id: ID!
    content: String!
    chapter: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Book {
    id: ID!
    title: String!
    authorId: String!
    authorName: String!
    pageCount: Int!
    isbn: String
    yearRead: Int
    status: ReadingStatus!
    rating: Int
    coverUrl: String
    quotes: [Quote!]!
    notes: [Note!]!
    quotesCount: Int!
    notesCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    """
    Resolved author entity (cross-service)
    """
    author: Author
  }

  type AuthorYearStats {
    authorId: String!
    authorName: String!
    bookCount: Int!
    totalPages: Int!
    books: [AuthorYearStatsBook!]!
  }

  type AuthorYearStatsBook {
    id: ID!
    title: String!
    pageCount: Int!
    rating: Int
  }

  # ===========================================================================
  # Inputs
  # ===========================================================================

  input CreateBookInput {
    title: String!
    authorId: String!
    pageCount: Int!
    isbn: String
    yearRead: Int
    status: ReadingStatus
    rating: Int
    coverUrl: String
  }

  input UpdateBookInput {
    bookId: ID!
    title: String
    pageCount: Int
    yearRead: Int
    rating: Int
    coverUrl: String
    status: ReadingStatus
  }

  input MarkBookAsFinishedInput {
    bookId: ID!
    yearRead: Int!
    rating: Int
  }

  input AddQuoteInput {
    bookId: ID!
    content: String!
    page: Int
  }

  input AddNoteInput {
    bookId: ID!
    content: String!
    chapter: String
  }

  # ===========================================================================
  # Queries & Mutations
  # ===========================================================================

  extend type Query {
    book(id: ID!): Book
    books(
      year: Int!
      sortBy: BookSortField
      sortOrder: SortOrder
      limit: Int
      offset: Int
    ): [Book!]!
    authorStats(year: Int!, limit: Int): [AuthorYearStats!]!
  }

  extend type Mutation {
    createBook(input: CreateBookInput!): Book!
    updateBook(input: UpdateBookInput!): Book!
    deleteBook(id: ID!): Boolean!
    markBookAsFinished(input: MarkBookAsFinishedInput!): Book!
    addQuote(input: AddQuoteInput!): Book!
    addNote(input: AddNoteInput!): Book!
  }
`;
