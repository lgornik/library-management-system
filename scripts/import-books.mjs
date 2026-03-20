/**
 * Import script: reads books-import.json and populates the database
 * via the GraphQL API (authors first, then books, then quotes/notes).
 *
 * Usage: node scripts/import-books.mjs
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const API_URL = 'http://localhost:4000/graphql';
const JSON_PATH = resolve(import.meta.dirname, '..', 'books-import.json');

// ---------------------------------------------------------------------------
// GraphQL helper
// ---------------------------------------------------------------------------

async function gql(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const CREATE_AUTHOR = `
  mutation CreateAuthor($input: CreateAuthorInput!) {
    createAuthor(input: $input) { id name }
  }
`;

const CREATE_BOOK = `
  mutation CreateBook($input: CreateBookInput!) {
    createBook(input: $input) { id title }
  }
`;

const ADD_QUOTE = `
  mutation AddQuote($input: AddQuoteInput!) {
    addQuote(input: $input) { id }
  }
`;

const ADD_NOTE = `
  mutation AddNote($input: AddNoteInput!) {
    addNote(input: $input) { id }
  }
`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Load JSON
  const raw = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
  const books = raw.Library[0].Book;
  console.log(`📚 Loaded ${books.length} books from JSON\n`);

  // 2. Extract unique author names
  const authorNames = [...new Set(
    books
      .map((b) => b.Author?.trim())
      .filter(Boolean),
  )];
  console.log(`👤 Found ${authorNames.length} unique authors`);

  // 3. Create authors
  const authorMap = new Map(); // name -> id
  for (const name of authorNames) {
    try {
      const data = await gql(CREATE_AUTHOR, { input: { name } });
      authorMap.set(name, data.createAuthor.id);
      console.log(`   ✓ ${name}`);
    } catch (err) {
      console.error(`   ✗ ${name}: ${err.message}`);
    }
  }

  console.log(`\n📖 Importing books...`);

  // 4. Create books + quotes + notes
  let created = 0;
  let skipped = 0;

  for (const book of books) {
    const authorName = book.Author?.trim();
    const authorId = authorMap.get(authorName);

    if (!authorId) {
      console.log(`   ⊘ Skipping "${book.Title}" (no author)`);
      skipped++;
      continue;
    }

    const pageCount = book.Pages ?? 0;
    if (pageCount <= 0) {
      // pageCount is required and must be > 0
      console.log(`   ⊘ Skipping "${book.Title}" (no page count)`);
      skipped++;
      continue;
    }

    // Domain requires yearRead when status is FINISHED
    const hasYear = book.YearRead != null;
    const status = (book.IsRead && hasYear) ? 'FINISHED' : 'TO_READ';
    const yearRead = hasYear ? book.YearRead : undefined;

    try {
      const data = await gql(CREATE_BOOK, {
        input: {
          title: book.Title,
          authorId,
          pageCount,
          status,
          ...(yearRead && { yearRead }),
        },
      });

      const bookId = data.createBook.id;
      console.log(`   ✓ ${book.Title}`);
      created++;

      // Add quotes (split by newline if multiple)
      if (book.Quote) {
        const quotes = book.Quote
          .split('\n')
          .map((q) => q.trim().replace(/^"|"$/g, ''))
          .filter((q) => q.length > 0);

        for (const content of quotes) {
          try {
            await gql(ADD_QUOTE, { input: { bookId, content } });
          } catch { /* ignore quote errors */ }
        }
        if (quotes.length > 0) {
          console.log(`     💬 ${quotes.length} quote(s)`);
        }
      }

      // Add notes
      if (book.Notes) {
        try {
          await gql(ADD_NOTE, { input: { bookId, content: book.Notes } });
          console.log(`     📝 1 note`);
        } catch { /* ignore note errors */ }
      }

      // Small delay to avoid overwhelming the API
      await new Promise((r) => setTimeout(r, 50));
    } catch (err) {
      console.error(`   ✗ "${book.Title}": ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ Import complete: ${created} books created, ${skipped} skipped`);
}

main().catch((err) => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
