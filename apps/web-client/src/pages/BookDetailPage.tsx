import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_BOOK } from '../graphql/queries';
import { BookDetail } from '../components/BookDetail';

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(GET_BOOK, { variables: { id } });

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading…</div>;
  }

  if (error || !data?.book) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Book not found.</p>
        <Link to="/books" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-800">
          ← Back to books
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/books" className="mb-4 inline-block text-sm text-indigo-600 hover:text-indigo-800">
        ← Back to books
      </Link>
      <BookDetail book={data.book} />
    </div>
  );
}
