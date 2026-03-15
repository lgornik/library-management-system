import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { ApolloServer } from '@apollo/server';
import assert from 'node:assert';

// =============================================================================
// Mock services BEFORE importing schema (which imports resolvers → services)
// =============================================================================

const mockBookReadRepo = {
  findById: vi.fn(),
  findByYear: vi.fn(),
  getAuthorStatsByYear: vi.fn(),
  findAll: vi.fn(),
};

const mockAuthorReadRepo = {
  findById: vi.fn(),
  findAll: vi.fn(),
};

const mockCommandBus = {
  execute: vi.fn(),
};

const mockQueryBus = {
  execute: vi.fn(),
};

const mockBookService = {
  getCommandBus: () => mockCommandBus,
  getQueryBus: () => mockQueryBus,
  getReadRepository: () => mockBookReadRepo,
  healthCheck: vi.fn(),
};

const mockAuthorService = {
  getCommandBus: () => mockCommandBus,
  getQueryBus: () => mockQueryBus,
  getReadRepository: () => mockAuthorReadRepo,
  healthCheck: vi.fn(),
};

vi.mock('../../src/services/index.js', () => ({
  getBookService: () => mockBookService,
  getAuthorService: () => mockAuthorService,
  startServices: vi.fn(),
  stopServices: vi.fn(),
}));

// Import schema AFTER mocks are set up
import { schema } from '../../src/schema/index.js';

// =============================================================================
// Test server
// =============================================================================

let server: ApolloServer;

beforeAll(() => {
  server = new ApolloServer({ schema });
});

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Fixtures
// =============================================================================

const sampleBook = {
  id: 'book-1',
  title: 'Domain-Driven Design',
  authorId: 'author-1',
  authorName: 'Eric Evans',
  pageCount: 560,
  isbn: '978-0321125217',
  yearRead: 2024,
  status: 'FINISHED',
  rating: 5,
  coverUrl: null,
  quotes: [],
  notes: [],
  quotesCount: 0,
  notesCount: 0,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-06-20'),
};

const sampleAuthor = {
  id: 'author-1',
  name: 'Eric Evans',
  biography: 'Software engineer and author',
  nationality: 'American',
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
};

// =============================================================================
// Tests
// =============================================================================

describe('GraphQL API Gateway', () => {
  // ===========================================================================
  // Health
  // ===========================================================================
  describe('Query: health', () => {
    it('should return aggregated health from both services', async () => {
      mockBookService.healthCheck.mockResolvedValue({
        postgres: true,
        mongodb: true,
        rabbitmq: true,
      });
      mockAuthorService.healthCheck.mockResolvedValue({
        postgres: true,
        mongodb: true,
        rabbitmq: false,
      });

      const response = await server.executeOperation({
        query: `query { health { bookService { postgres mongodb rabbitmq } authorService { postgres mongodb rabbitmq } } }`,
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.health).toEqual({
        bookService: { postgres: true, mongodb: true, rabbitmq: true },
        authorService: { postgres: true, mongodb: true, rabbitmq: false },
      });
    });
  });

  // ===========================================================================
  // Book Queries
  // ===========================================================================
  describe('Query: book', () => {
    it('should return a book by ID', async () => {
      mockBookReadRepo.findById.mockResolvedValue(sampleBook);

      const response = await server.executeOperation({
        query: `query ($id: ID!) { book(id: $id) { id title authorName pageCount status rating } }`,
        variables: { id: 'book-1' },
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.book).toMatchObject({
        id: 'book-1',
        title: 'Domain-Driven Design',
        authorName: 'Eric Evans',
        pageCount: 560,
        status: 'FINISHED',
        rating: 5,
      });
      expect(mockBookReadRepo.findById).toHaveBeenCalledWith('book-1');
    });

    it('should return null for non-existent book', async () => {
      mockBookReadRepo.findById.mockResolvedValue(null);

      const response = await server.executeOperation({
        query: `query { book(id: "nonexistent") { id } }`,
      });

      assert(response.body.kind === 'single');
      expect(response.body.singleResult.data?.book).toBeNull();
    });
  });

  describe('Query: books', () => {
    it('should return books for a given year', async () => {
      mockBookReadRepo.findByYear.mockResolvedValue([sampleBook]);

      const response = await server.executeOperation({
        query: `query { books(year: 2024, sortBy: pageCount, sortOrder: desc, limit: 10) { id title } }`,
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.books).toHaveLength(1);
      expect(data?.books[0]).toMatchObject({ id: 'book-1', title: 'Domain-Driven Design' });
      expect(mockBookReadRepo.findByYear).toHaveBeenCalledWith(
        2024,
        'pageCount',
        'desc',
        10,
        undefined,
      );
    });
  });

  describe('Query: authorStats', () => {
    it('should return author stats for a year', async () => {
      const stats = [
        {
          authorId: 'author-1',
          authorName: 'Eric Evans',
          bookCount: 2,
          totalPages: 1100,
          books: [
            { id: 'book-1', title: 'DDD', pageCount: 560, rating: 5 },
            { id: 'book-2', title: 'DDD Reference', pageCount: 540, rating: 4 },
          ],
        },
      ];
      mockBookReadRepo.getAuthorStatsByYear.mockResolvedValue(stats);

      const response = await server.executeOperation({
        query: `query { authorStats(year: 2024) { authorName bookCount totalPages } }`,
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.authorStats[0]).toMatchObject({
        authorName: 'Eric Evans',
        bookCount: 2,
        totalPages: 1100,
      });
    });
  });

  // ===========================================================================
  // Author Queries
  // ===========================================================================
  describe('Query: author', () => {
    it('should return an author by ID', async () => {
      mockAuthorReadRepo.findById.mockResolvedValue(sampleAuthor);

      const response = await server.executeOperation({
        query: `query ($id: ID!) { author(id: $id) { id name biography nationality } }`,
        variables: { id: 'author-1' },
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.author).toMatchObject({
        id: 'author-1',
        name: 'Eric Evans',
        biography: 'Software engineer and author',
        nationality: 'American',
      });
    });
  });

  describe('Query: authors', () => {
    it('should return all authors with pagination', async () => {
      mockAuthorReadRepo.findAll.mockResolvedValue([sampleAuthor]);

      const response = await server.executeOperation({
        query: `query { authors(sortBy: name, sortOrder: asc, limit: 20) { id name } }`,
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.authors).toHaveLength(1);
      expect(mockAuthorReadRepo.findAll).toHaveBeenCalledWith('name', 'asc', 20, undefined);
    });
  });

  // ===========================================================================
  // Book Mutations
  // ===========================================================================
  describe('Mutation: createBook', () => {
    it('should create a book and return it', async () => {
      mockCommandBus.execute.mockResolvedValue({ bookId: 'book-new' });
      mockBookReadRepo.findById.mockResolvedValue({ ...sampleBook, id: 'book-new' });

      const response = await server.executeOperation({
        query: `mutation ($input: CreateBookInput!) {
          createBook(input: $input) { id title pageCount }
        }`,
        variables: {
          input: {
            title: 'Clean Code',
            authorId: 'author-1',
            pageCount: 464,
          },
        },
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.createBook).toMatchObject({ id: 'book-new' });
      expect(mockCommandBus.execute).toHaveBeenCalledOnce();
      expect(mockBookReadRepo.findById).toHaveBeenCalledWith('book-new');
    });
  });

  describe('Mutation: deleteBook', () => {
    it('should delete a book and return true', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      const response = await server.executeOperation({
        query: `mutation { deleteBook(id: "book-1") }`,
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.deleteBook).toBe(true);
    });
  });

  describe('Mutation: markBookAsFinished', () => {
    it('should mark book as finished', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);
      mockBookReadRepo.findById.mockResolvedValue({
        ...sampleBook,
        status: 'FINISHED',
        yearRead: 2024,
        rating: 5,
      });

      const response = await server.executeOperation({
        query: `mutation ($input: MarkBookAsFinishedInput!) {
          markBookAsFinished(input: $input) { id status yearRead rating }
        }`,
        variables: {
          input: { bookId: 'book-1', yearRead: 2024, rating: 5 },
        },
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.markBookAsFinished).toMatchObject({
        status: 'FINISHED',
        yearRead: 2024,
        rating: 5,
      });
    });
  });

  describe('Mutation: addQuote', () => {
    it('should add a quote to a book', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);
      mockBookReadRepo.findById.mockResolvedValue({
        ...sampleBook,
        quotes: [{ id: 'q-1', content: 'Great quote', page: 42, createdAt: new Date() }],
      });

      const response = await server.executeOperation({
        query: `mutation ($input: AddQuoteInput!) {
          addQuote(input: $input) { id quotes { content page } }
        }`,
        variables: {
          input: { bookId: 'book-1', content: 'Great quote', page: 42 },
        },
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.addQuote.quotes).toHaveLength(1);
      expect(data?.addQuote.quotes[0]).toMatchObject({ content: 'Great quote', page: 42 });
    });
  });

  // ===========================================================================
  // Author Mutations
  // ===========================================================================
  describe('Mutation: createAuthor', () => {
    it('should create an author and return it', async () => {
      mockCommandBus.execute.mockResolvedValue({ authorId: 'author-new' });
      mockAuthorReadRepo.findById.mockResolvedValue({ ...sampleAuthor, id: 'author-new' });

      const response = await server.executeOperation({
        query: `mutation ($input: CreateAuthorInput!) {
          createAuthor(input: $input) { id name }
        }`,
        variables: {
          input: { name: 'Martin Fowler', nationality: 'British' },
        },
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.createAuthor).toMatchObject({ id: 'author-new' });
    });
  });

  describe('Mutation: deleteAuthor', () => {
    it('should delete an author and return true', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      const response = await server.executeOperation({
        query: `mutation { deleteAuthor(id: "author-1") }`,
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.deleteAuthor).toBe(true);
    });
  });

  // ===========================================================================
  // Cross-service resolution
  // ===========================================================================
  describe('Cross-service: Book.author', () => {
    it('should resolve author for a book', async () => {
      mockBookReadRepo.findById.mockResolvedValue(sampleBook);
      mockAuthorReadRepo.findById.mockResolvedValue(sampleAuthor);

      const response = await server.executeOperation({
        query: `query { book(id: "book-1") { title author { id name nationality } } }`,
      });

      assert(response.body.kind === 'single');
      const { data, errors } = response.body.singleResult;

      expect(errors).toBeUndefined();
      expect(data?.book.author).toMatchObject({
        id: 'author-1',
        name: 'Eric Evans',
        nationality: 'American',
      });
      // Verify cross-service call
      expect(mockAuthorReadRepo.findById).toHaveBeenCalledWith('author-1');
    });

    it('should return null author if not found', async () => {
      mockBookReadRepo.findById.mockResolvedValue(sampleBook);
      mockAuthorReadRepo.findById.mockRejectedValue(new Error('Not found'));

      const response = await server.executeOperation({
        query: `query { book(id: "book-1") { title author { id } } }`,
      });

      assert(response.body.kind === 'single');
      expect(response.body.singleResult.data?.book.author).toBeNull();
    });
  });

  // ===========================================================================
  // Schema validation
  // ===========================================================================
  describe('Schema validation', () => {
    it('should reject missing required fields in CreateBookInput', async () => {
      const response = await server.executeOperation({
        query: `mutation { createBook(input: { title: "Test" }) { id } }`,
      });

      assert(response.body.kind === 'single');
      expect(response.body.singleResult.errors).toBeDefined();
    });

    it('should reject invalid enum value for ReadingStatus', async () => {
      const response = await server.executeOperation({
        query: `mutation {
          createBook(input: {
            title: "Test"
            authorId: "a-1"
            pageCount: 100
            status: INVALID_STATUS
          }) { id }
        }`,
      });

      assert(response.body.kind === 'single');
      expect(response.body.singleResult.errors).toBeDefined();
    });

    it('should reject query without required year arg for books', async () => {
      const response = await server.executeOperation({
        query: `query { books { id } }`,
      });

      assert(response.body.kind === 'single');
      expect(response.body.singleResult.errors).toBeDefined();
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================
  describe('Error handling', () => {
    it('should return GraphQL error when service throws', async () => {
      mockBookReadRepo.findById.mockRejectedValue(new Error('Database connection failed'));

      const response = await server.executeOperation({
        query: `query { book(id: "book-1") { id } }`,
      });

      assert(response.body.kind === 'single');
      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors![0]!.message).toBe('Database connection failed');
    });

    it('should return GraphQL error when command fails', async () => {
      mockCommandBus.execute.mockRejectedValue(new Error('Book with ISBN already exists'));

      const response = await server.executeOperation({
        query: `mutation {
          createBook(input: { title: "Dup", authorId: "a-1", pageCount: 100, isbn: "dup" }) { id }
        }`,
      });

      assert(response.body.kind === 'single');
      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors![0]!.message).toContain('ISBN already exists');
    });
  });
});
