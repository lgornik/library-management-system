import { Link } from 'react-router-dom';
import { StatusBadge } from './ui/Badge';

interface Book {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  pageCount: number;
  status: string;
  rating: number | null;
  yearRead: number | null;
  quotesCount: number;
  notesCount: number;
}

interface BookListProps {
  books: Book[];
  sortBy?: string;
  sortOrder?: string;
  onSort?: (field: string) => void;
  onEdit?: (book: Book) => void;
}


function SortIndicator({ field, sortBy, sortOrder }: { field: string; sortBy?: string; sortOrder?: string }) {
  if (field !== sortBy) return <span className="ml-1 text-gray-300">↕</span>;
  return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
}

export function BookList({ books, sortBy, sortOrder, onSort, onEdit }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
        No books found for this year.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 w-10">Lp</th>
            <th
              className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
              onClick={() => onSort?.('title')}
            >
              Title<SortIndicator field="title" sortBy={sortBy} sortOrder={sortOrder} />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Author</th>
            <th
              className="cursor-pointer px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 hover:text-gray-700"
              onClick={() => onSort?.('pageCount')}
            >
              Pages<SortIndicator field="pageCount" sortBy={sortBy} sortOrder={sortOrder} />
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Q / N</th>
            <th className="px-4 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {books.map((book, index) => (
            <tr key={book.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-right text-sm text-gray-400">{index + 1}</td>
              <td className="px-4 py-3 text-sm">
                <Link to={`/books/${book.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                  {book.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{book.authorName}</td>
              <td className="px-4 py-3 text-right text-sm text-gray-500">{book.pageCount}</td>
              <td className="px-4 py-3 text-center"><StatusBadge status={book.status} /></td>
              <td className="px-4 py-3 text-right text-sm text-gray-400">
                {book.quotesCount} / {book.notesCount}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onEdit?.(book)}
                  className="text-xs text-gray-400 hover:text-indigo-600"
                  title="Edit"
                >
                  ✏
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
