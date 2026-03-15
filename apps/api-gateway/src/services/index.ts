import { BookServiceApp } from '@library/book-service';
import { AuthorServiceApp } from '@library/author-service';

let bookService: BookServiceApp;
let authorService: AuthorServiceApp;

/**
 * Initialize and start both microservices.
 */
export async function startServices(): Promise<void> {
  bookService = new BookServiceApp();
  authorService = new AuthorServiceApp();

  await bookService.start();
  await authorService.start();
}

/**
 * Gracefully stop both microservices.
 */
export async function stopServices(): Promise<void> {
  await bookService.stop();
  await authorService.stop();
}

export function getBookService(): BookServiceApp {
  return bookService;
}

export function getAuthorService(): AuthorServiceApp {
  return authorService;
}
