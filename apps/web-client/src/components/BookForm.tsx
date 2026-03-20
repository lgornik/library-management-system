import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_BOOK, UPDATE_BOOK } from '../graphql/mutations';
import { GET_AUTHORS } from '../graphql/queries';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export interface EditableBook {
  id: string;
  title: string;
  authorId: string;
  pageCount: number;
  isbn?: string | null;
  yearRead?: number | null;
  status: string;
  rating?: number | null;
  coverUrl?: string | null;
}

interface BookFormProps {
  onDone: () => void;
  defaultYear: number;
  book?: EditableBook | null;
}

export function BookForm({ onDone, defaultYear, book }: BookFormProps) {
  const isEdit = !!book;
  const [title, setTitle] = useState(book?.title ?? '');
  const [authorId, setAuthorId] = useState(book?.authorId ?? '');
  const [pageCount, setPageCount] = useState(book ? String(book.pageCount) : '');
  const [isbn, setIsbn] = useState(book?.isbn ?? '');
  const [status, setStatus] = useState(book?.status ?? 'TO_READ');
  const [rating, setRating] = useState(book?.rating != null ? String(book.rating) : '');
  const [yearRead, setYearRead] = useState(book?.yearRead != null ? String(book.yearRead) : String(defaultYear));
  const [error, setError] = useState<string | null>(null);

  const { data: authorsData } = useQuery(GET_AUTHORS, {
    variables: { sortBy: 'name', sortOrder: 'asc', limit: 200 },
  });

  const [createBook, { loading: creating }] = useMutation(CREATE_BOOK);
  const [updateBook, { loading: updating }] = useMutation(UPDATE_BOOK, {
    refetchQueries: ['GetBooks'],
    awaitRefetchQueries: true,
  });
  const loading = creating || updating;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !authorId || !pageCount) return;

    try {
      if (isEdit) {
        const input: Record<string, unknown> = {
          bookId: book!.id,
          title: title.trim(),
          pageCount: parseInt(pageCount, 10),
          yearRead: yearRead ? parseInt(yearRead, 10) : null,
          rating: rating ? parseInt(rating, 10) : null,
        };
        if (status !== book!.status) {
          input.status = status;
        }
        await updateBook({ variables: { input } });
      } else {
        await createBook({
          variables: {
            input: {
              title: title.trim(),
              authorId,
              pageCount: parseInt(pageCount, 10),
              isbn: isbn.trim() || undefined,
              status,
              rating: rating ? parseInt(rating, 10) : undefined,
              yearRead: yearRead ? parseInt(yearRead, 10) : undefined,
            },
          },
        });
      }
      onDone();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    }
  };

  const authorOptions = [
    { value: '', label: '— Select author —' },
    ...(authorsData?.authors?.map((a: { id: string; name: string }) => ({
      value: a.id,
      label: a.name,
    })) ?? []),
  ];

  const statusOptions = [
    { value: 'TO_READ', label: 'To Read' },
    { value: 'READING', label: 'Reading' },
    { value: 'FINISHED', label: 'Finished' },
    { value: 'ABANDONED', label: 'Abandoned' },
  ];

  const ratingOptions = [
    { value: '', label: 'No rating' },
    { value: '1', label: '★ (1)' },
    { value: '2', label: '★★ (2)' },
    { value: '3', label: '★★★ (3)' },
    { value: '4', label: '★★★★ (4)' },
    { value: '5', label: '★★★★★ (5)' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      <Select label="Author" required disabled={isEdit} options={authorOptions} value={authorId} onChange={(e) => setAuthorId(e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Pages" type="number" required min={1} value={pageCount} onChange={(e) => setPageCount(e.target.value)} />
        <Input label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Select label="Status" options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Select label="Rating" options={ratingOptions} value={rating} onChange={(e) => setRating(e.target.value)} />
        <Input label="Year Read" type="number" value={yearRead} onChange={(e) => setYearRead(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={loading || !title.trim() || !authorId || !pageCount}>
          {loading ? 'Saving...' : isEdit ? 'Update Book' : 'Create Book'}
        </Button>
      </div>
    </form>
  );
}
