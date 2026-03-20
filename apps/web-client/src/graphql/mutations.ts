import { gql } from '@apollo/client';

// =============================================================================
// Book mutations
// =============================================================================

export const CREATE_BOOK = gql`
  mutation CreateBook($input: CreateBookInput!) {
    createBook(input: $input) {
      id
      title
      authorName
      pageCount
      status
    }
  }
`;

export const UPDATE_BOOK = gql`
  mutation UpdateBook($input: UpdateBookInput!) {
    updateBook(input: $input) {
      id
      title
      pageCount
      yearRead
      rating
      coverUrl
      status
    }
  }
`;

export const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id)
  }
`;

export const MARK_BOOK_FINISHED = gql`
  mutation MarkBookAsFinished($input: MarkBookAsFinishedInput!) {
    markBookAsFinished(input: $input) {
      id
      status
      yearRead
      rating
    }
  }
`;

export const ADD_QUOTE = gql`
  mutation AddQuote($input: AddQuoteInput!) {
    addQuote(input: $input) {
      id
      quotes {
        id
        content
        page
        createdAt
      }
    }
  }
`;

export const ADD_NOTE = gql`
  mutation AddNote($input: AddNoteInput!) {
    addNote(input: $input) {
      id
      notes {
        id
        content
        chapter
        createdAt
        updatedAt
      }
    }
  }
`;

// =============================================================================
// Author mutations
// =============================================================================

export const CREATE_AUTHOR = gql`
  mutation CreateAuthor($input: CreateAuthorInput!) {
    createAuthor(input: $input) {
      id
      name
      nationality
    }
  }
`;

export const UPDATE_AUTHOR = gql`
  mutation UpdateAuthor($input: UpdateAuthorInput!) {
    updateAuthor(input: $input) {
      id
      name
      biography
      nationality
    }
  }
`;

export const DELETE_AUTHOR = gql`
  mutation DeleteAuthor($id: ID!) {
    deleteAuthor(id: $id)
  }
`;
