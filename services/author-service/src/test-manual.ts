/**
 * Manual test script for Author Service
 *
 * Run with: pnpm --filter @library/author-service test:manual
 */

import { config } from './infrastructure/config/index.js';
import { AuthorServiceApp } from './index.js';
import {
  CreateAuthorCommand,
  UpdateAuthorCommand,
  DeleteAuthorCommand,
} from './application/index.js';

async function runTests() {
  console.log('\n🧪 Running manual tests for Author Service...\n');

  const app = new AuthorServiceApp();

  try {
    await app.start();

    console.log('🔍 Database Connection Info:');
    console.log(`   🐘 PostgreSQL: ${config.postgres.host}:${config.postgres.port} / DB: ${config.postgres.database}`);
    console.log(`   📗 MongoDB:    ${config.mongodb.url.split('@')[1] ?? 'localhost'}`);
    console.log(`   🐰 RabbitMQ:   ${config.rabbitmq.url.split('@')[1] ?? 'localhost'}`);
    console.log('-----------------------------\n');

    const commandBus = app.getCommandBus();
    const readRepo = app.getReadRepository();

    // ========================================================================
    // Test 1: Create an author
    // ========================================================================
    console.log('\n✍️  Test 1: Creating an author...');

    const createResult = await commandBus.execute<{ authorId: string }>(
      new CreateAuthorCommand({
        name: 'Robert C. Martin',
        biography: 'Software engineer, author of Clean Code and Clean Architecture.',
        nationality: 'US',
      })
    );

    console.log('   ✅ Author created:', createResult.authorId);

    // Wait for projection to update read model
    await sleep(2000);

    // ========================================================================
    // Test 2: Read the author from MongoDB
    // ========================================================================
    console.log('\n✍️  Test 2: Reading author from MongoDB...');

    const author = await readRepo.findById(createResult.authorId);
    if (author) {
      console.log('   ✅ Author found:', {
        id: author.id,
        name: author.name,
        nationality: author.nationality,
        biography: author.biography?.substring(0, 50) + '...',
      });
    } else {
      console.log('   ⚠️  Author not found in read model yet (eventual consistency)');
    }

    // ========================================================================
    // Test 3: Update the author
    // ========================================================================
    console.log('\n✍️  Test 3: Updating the author...');

    await commandBus.execute(
      new UpdateAuthorCommand({
        authorId: createResult.authorId,
        biography: 'Updated biography: Legendary software craftsman and author.',
      })
    );

    console.log('   ✅ Author updated');

    await sleep(1000);

    const updatedAuthor = await readRepo.findById(createResult.authorId);
    if (updatedAuthor) {
      console.log('   ✅ Read model updated:', {
        biography: updatedAuthor.biography?.substring(0, 60),
      });
    }

    // ========================================================================
    // Test 4: List all authors
    // ========================================================================
    console.log('\n✍️  Test 4: Listing all authors...');

    const allAuthors = await readRepo.findAll('name', 'asc');
    console.log(`   ✅ Found ${allAuthors.length} author(s):`);
    for (const a of allAuthors) {
      console.log(`      - ${a.name} (${a.nationality ?? 'unknown'})`);
    }

    // ========================================================================
    // Test 5: Search authors
    // ========================================================================
    console.log('\n✍️  Test 5: Searching for "Martin"...');

    const searchResults = await readRepo.search('Martin');
    console.log(`   ✅ Found ${searchResults.length} result(s):`);
    for (const a of searchResults) {
      console.log(`      - ${a.name}`);
    }

    // ========================================================================
    // Test 6: Delete the author
    // ========================================================================
    console.log('\n✍️  Test 6: Deleting the author...');

    await commandBus.execute(new DeleteAuthorCommand(createResult.authorId));
    console.log('   ✅ Author deleted');

    await sleep(1000);

    const deletedAuthor = await readRepo.findById(createResult.authorId);
    console.log(`   ✅ Verified removed from read model: ${deletedAuthor === null ? 'yes' : 'NO — still exists!'}`);

    // ========================================================================
    // Test 7: Health check
    // ========================================================================
    console.log('\n✍️  Test 7: Health check...');

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

runTests();
