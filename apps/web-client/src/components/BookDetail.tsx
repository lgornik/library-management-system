import { useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import { MARK_BOOK_FINISHED, ADD_QUOTE, ADD_NOTE, DELETE_BOOK } from '../graphql/mutations';
import { GET_BOOK } from '../graphql/queries';
import { StatusBadge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { useNavigate } from 'react-router-dom';

interface Quote { id: string; content: string; page: number | null; createdAt: string }
interface Note { id: string; content: string; chapter: string | null; createdAt: string }
interface BookData {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  pageCount: number;
  isbn: string | null;
  yearRead: number | null;
  status: string;
  rating: number | null;
  coverUrl: string | null;
  quotes: Quote[];
  notes: Note[];
  author: { id: string; name: string; nationality: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export function BookDetail({ book }: { book: BookData }) {
  const navigate = useNavigate();
  const refetchQueries = [{ query: GET_BOOK, variables: { id: book.id } }];

  const [deleteBook] = useMutation(DELETE_BOOK);
  const [markFinished, { loading: markingFinished }] = useMutation(MARK_BOOK_FINISHED, { refetchQueries });
  const [addQuote, { loading: addingQuote }] = useMutation(ADD_QUOTE, { refetchQueries });
  const [addNote, { loading: addingNote }] = useMutation(ADD_NOTE, { refetchQueries });

  // Mark as finished form
  const [finishYear, setFinishYear] = useState(String(new Date().getFullYear()));
  const [finishRating, setFinishRating] = useState('');

  // Quote form
  const [quoteContent, setQuoteContent] = useState('');
  const [quotePage, setQuotePage] = useState('');

  // Note form
  const [noteContent, setNoteContent] = useState('');
  const [noteChapter, setNoteChapter] = useState('');

  const handleDelete = async () => {
    if (!confirm(`Delete "${book.title}"?`)) return;
    await deleteBook({ variables: { id: book.id } });
    navigate('/books');
  };

  const handleMarkFinished = async (e: FormEvent) => {
    e.preventDefault();
    await markFinished({
      variables: {
        input: {
          bookId: book.id,
          yearRead: parseInt(finishYear, 10),
          rating: finishRating ? parseInt(finishRating, 10) : undefined,
        },
      },
    });
  };

  const handleAddQuote = async (e: FormEvent) => {
    e.preventDefault();
    if (!quoteContent.trim()) return;
    await addQuote({
      variables: {
        input: {
          bookId: book.id,
          content: quoteContent.trim(),
          page: quotePage ? parseInt(quotePage, 10) : undefined,
        },
      },
    });
    setQuoteContent('');
    setQuotePage('');
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    await addNote({
      variables: {
        input: {
          bookId: book.id,
          content: noteContent.trim(),
          chapter: noteChapter.trim() || undefined,
        },
      },
    });
    setNoteContent('');
    setNoteChapter('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
          <p className="mt-1 text-gray-500">
            by {book.authorName}
            {book.author?.nationality && ` (${book.author.nationality})`}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Status</p>
          <div className="mt-1"><StatusBadge status={book.status} /></div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Pages</p>
          <p className="mt-1 text-sm font-semibold">{book.pageCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Year Read</p>
          <p className="mt-1 text-sm font-semibold">{book.yearRead ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Rating</p>
          <p className="mt-1 text-sm font-semibold">
            {book.rating != null ? '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating) : '—'}
          </p>
        </div>
        {book.isbn && (
          <div className="col-span-2">
            <p className="text-xs font-medium uppercase text-gray-500">ISBN</p>
            <p className="mt-1 text-sm font-mono">{book.isbn}</p>
          </div>
        )}
      </div>

      {/* Mark as finished (only for non-finished books) */}
      {book.status !== 'FINISHED' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Mark as Finished</h2>
          <form onSubmit={handleMarkFinished} className="flex items-end gap-3">
            <Input label="Year" type="number" value={finishYear} onChange={(e) => setFinishYear(e.target.value)} className="w-24" />
            <Input label="Rating (1-5)" type="number" min={1} max={5} value={finishRating} onChange={(e) => setFinishRating(e.target.value)} className="w-24" />
            <Button type="submit" disabled={markingFinished} size="sm">
              {markingFinished ? 'Saving...' : 'Mark Finished'}
            </Button>
          </form>
        </div>
      )}

      {/* Quotes */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Quotes ({book.quotes.length})</h2>
        {book.quotes.length > 0 && (
          <ul className="mb-4 space-y-2">
            {book.quotes.map((q) => (
              <li key={q.id} className="rounded bg-gray-50 p-3 text-sm italic text-gray-700">
                "{q.content}"{q.page != null && <span className="ml-2 text-xs text-gray-400">— p. {q.page}</span>}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddQuote} className="flex items-end gap-3">
          <div className="flex-1">
            <Textarea placeholder="Quote text..." value={quoteContent} onChange={(e) => setQuoteContent(e.target.value)} />
          </div>
          <Input placeholder="Page" type="number" value={quotePage} onChange={(e) => setQuotePage(e.target.value)} className="w-20" />
          <Button type="submit" size="sm" disabled={addingQuote || !quoteContent.trim()}>Add</Button>
        </form>
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Notes ({book.notes.length})</h2>
        {book.notes.length > 0 && (
          <ul className="mb-4 space-y-2">
            {book.notes.map((n) => (
              <li key={n.id} className="rounded bg-gray-50 p-3 text-sm text-gray-700">
                {n.chapter && <span className="mb-1 block text-xs font-medium text-gray-500">{n.chapter}</span>}
                {n.content}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddNote} className="flex items-end gap-3">
          <div className="flex-1">
            <Textarea placeholder="Note..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
          </div>
          <Input placeholder="Chapter" value={noteChapter} onChange={(e) => setNoteChapter(e.target.value)} className="w-32" />
          <Button type="submit" size="sm" disabled={addingNote || !noteContent.trim()}>Add</Button>
        </form>
      </div>
    </div>
  );
}
