/**
 * Manual test script for Book Service
 *
 * Run with: pnpm --filter @library/book-service test:manual
 */

import { BookServiceApp } from './index.js';
import {
  CreateBookCommand,
  AddQuoteCommand,
  MarkBookAsFinishedCommand,
} from './application/index.js';
import { ReadingStatus } from './domain/index.js';

async function runTests() {
  console.log('\n🧪 Running manual tests...\n');

  const app = new BookServiceApp();

  try {
    await app.start();

    const commandBus = app.getCommandBus();
    const readRepo = app.getReadRepository();

    // Wait a bit for connections to stabilize
    await sleep(1000);

    // ========================================================================
    // Test 1: Create a book
    // ========================================================================
    console.log('\n📖 Test 1: Creating a book...');

    // Używamy poprawnych technicznie UUID (format 8-4-4-4-12)
    const VALID_AUTHOR_ID = '550e8400-e29b-41d2-a716-446655440000';

    const createResult = await commandBus.execute<{ bookId: string }>(
      new CreateBookCommand({
        title: 'Domain-Driven Design',
        authorId: VALID_AUTHOR_ID, // Teraz Postgres to zaakceptuje
        pageCount: 560,
        isbn: '9780321125217',
        yearRead: 2024,
        status: ReadingStatus.READING,
      })
    );

    console.log('   ✅ Book created:', createResult.bookId);

    // Wait for projection to update read model
    await sleep(2000);

    // ========================================================================
    // Test 2: Read the book from MongoDB
    // ========================================================================
    console.log('\n📖 Test 2: Reading book from MongoDB...');

    const book = await readRepo.findById(createResult.bookId);
    if (book) {
      console.log('   ✅ Book found:', {
        id: book.id,
        title: book.title,
        authorName: book.authorName,
        pageCount: book.pageCount,
        status: book.status,
      });
    } else {
      console.log('   ⚠️ Book not found in read model yet (eventual consistency)');
    }

    // ========================================================================
    // Test 3: Add a quote
    // ========================================================================
    console.log('\n📖 Test 3: Adding a quote...');

    const quoteResult = await commandBus.execute<{ quoteId: string }>(
      new AddQuoteCommand({
        bookId: createResult.bookId,
        content: 'The bounded context is explicitly defined by the domain expert.',
        page: 42,
      })
    );

    console.log('   ✅ Quote added:', quoteResult.quoteId);

    // Wait for projection
    await sleep(500);

    // ========================================================================
    // Test 4: Mark book as finished
    // ========================================================================
    console.log('\n📖 Test 4: Marking book as finished...');

    await commandBus.execute(
      new MarkBookAsFinishedCommand({
        bookId: createResult.bookId,
        yearRead: 2024,
        rating: 5,
      })
    );

    console.log('   ✅ Book marked as finished');

    // Wait for projection
    await sleep(500);

    // ========================================================================
    // Test 5: Get books by year
    // ========================================================================
    console.log('\n📖 Test 5: Getting books by year 2024...');

    const booksByYear = await readRepo.findByYear(2024, 'pageCount', 'desc');
    console.log(`   ✅ Found ${booksByYear.length} book(s):`);
    for (const b of booksByYear) {
      console.log(`      - ${b.title} (${b.pageCount} pages, rating: ${b.rating})`);
    }

    // ========================================================================
    // Test 6: Get author stats
    // ========================================================================
    console.log('\n📖 Test 6: Getting author statistics for 2024...');

    const authorStats = await readRepo.getAuthorStatsByYear(2024, 10);
    console.log(`   ✅ Found ${authorStats.length} author(s):`);
    for (const stat of authorStats) {
      console.log(`      - ${stat.authorName}: ${stat.bookCount} books, ${stat.totalPages} pages`);
    }

    // ========================================================================
    // Test 7: Health check
    // ========================================================================
    console.log('\n📖 Test 7: Health check...');

    const health = await app.healthCheck();
    console.log('   ✅ Health:', health);

    console.log('\n✅ All tests completed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await app.stop();
    process.exit(0);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run tests
runTests();
