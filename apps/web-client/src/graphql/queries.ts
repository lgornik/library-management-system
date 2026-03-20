import { gql } from '@apollo/client';

export const GET_HEALTH = gql`
  query GetHealth {
    health {
      bookService {
        postgres
        mongodb
        rabbitmq
      }
      authorService {
        postgres
        mongodb
        rabbitmq
      }
    }
  }
`;

export const GET_BOOKS = gql`
  query GetBooks($year: Int!, $sortBy: BookSortField, $sortOrder: SortOrder, $limit: Int, $offset: Int) {
    books(year: $year, sortBy: $sortBy, sortOrder: $sortOrder, limit: $limit, offset: $offset) {
      id
      title
      authorId
      authorName
      pageCount
      yearRead
      status
      rating
      quotesCount
      notesCount
      createdAt
    }
  }
`;

export const GET_BOOK = gql`
  query GetBook($id: ID!) {
    book(id: $id) {
      id
      title
      authorId
      authorName
      pageCount
      isbn
      yearRead
      status
      rating
      coverUrl
      quotesCount
      notesCount
      quotes {
        id
        content
        page
        createdAt
      }
      notes {
        id
        content
        chapter
        createdAt
        updatedAt
      }
      author {
        id
        name
        nationality
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_AUTHORS = gql`
  query GetAuthors($sortBy: AuthorSortField, $sortOrder: SortOrder, $limit: Int, $offset: Int) {
    authors(sortBy: $sortBy, sortOrder: $sortOrder, limit: $limit, offset: $offset) {
      id
      name
      nationality
      createdAt
    }
  }
`;

export const GET_AUTHOR = gql`
  query GetAuthor($id: ID!) {
    author(id: $id) {
      id
      name
      biography
      nationality
      createdAt
      updatedAt
    }
  }
`;

export const GET_AUTHOR_STATS = gql`
  query GetAuthorStats($year: Int!, $limit: Int) {
    authorStats(year: $year, limit: $limit) {
      authorId
      authorName
      bookCount
      totalPages
      books {
        id
        title
        pageCount
        rating
      }
    }
  }
`;
