import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_BOOKS } from '../graphql/queries';
import { BookList } from '../components/BookList';
import { BookForm, type EditableBook } from '../components/BookForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export function BooksPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<EditableBook | null>(null);
  const [sortBy, setSortBy] = useState<string>('pageCount');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  const { data, loading, refetch } = useQuery(GET_BOOKS, {
    variables: { year, sortBy, sortOrder },
  });

  const books = data?.books ?? [];

  const handleDone = () => {
    setShowForm(false);
    setEditingBook(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Books</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              ←
            </button>
            <span className="min-w-[3rem] text-center text-sm font-semibold text-gray-700">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Book</Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading…</div>
      ) : (
        <BookList
          books={books}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onEdit={(book) => {
            setEditingBook(book);
            setShowForm(true);
          }}
          onSort={(field) => {
            if (field === sortBy) {
              setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortBy(field);
              setSortOrder(field === 'pageCount' ? 'desc' : 'asc');
            }
          }}
        />
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingBook(null); }} title={editingBook ? 'Edit Book' : 'Add Book'}>
        <BookForm onDone={handleDone} defaultYear={year} book={editingBook} />
      </Modal>
    </div>
  );
}
