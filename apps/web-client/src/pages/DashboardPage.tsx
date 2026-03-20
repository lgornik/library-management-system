import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_HEALTH, GET_BOOKS, GET_AUTHOR_STATS } from '../graphql/queries';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

function HealthDot({ ok }: { ok: boolean | undefined }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-400'}`}
    />
  );
}

export function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [year] = useState(currentYear);

  const { data: healthData } = useQuery(GET_HEALTH, { pollInterval: 30_000 });
  const { data: booksData } = useQuery(GET_BOOKS, {
    variables: { year, sortBy: 'title', sortOrder: 'asc' },
  });
  const { data: statsData } = useQuery(GET_AUTHOR_STATS, {
    variables: { year, limit: 5 },
  });

  const health = healthData?.health;
  const books = booksData?.books ?? [];
  const stats = statsData?.authorStats ?? [];

  const totalBooks = books.length;
  const totalPages = books.reduce(
    (sum: number, b: { pageCount: number }) => sum + b.pageCount,
    0,
  );
  const finishedCount = books.filter(
    (b: { status: string }) => b.status === 'FINISHED',
  ).length;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard — {year}</h1>

      {/* Health */}
      {health && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Service Health</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-1 font-medium text-gray-600">Book Service</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <HealthDot ok={health.bookService.postgres} /> Postgres
                </li>
                <li className="flex items-center gap-2">
                  <HealthDot ok={health.bookService.mongodb} /> MongoDB
                </li>
                <li className="flex items-center gap-2">
                  <HealthDot ok={health.bookService.rabbitmq} /> RabbitMQ
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-1 font-medium text-gray-600">Author Service</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <HealthDot ok={health.authorService.postgres} /> Postgres
                </li>
                <li className="flex items-center gap-2">
                  <HealthDot ok={health.authorService.mongodb} /> MongoDB
                </li>
                <li className="flex items-center gap-2">
                  <HealthDot ok={health.authorService.rabbitmq} /> RabbitMQ
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{totalBooks}</p>
          <p className="mt-1 text-xs text-gray-500">Books</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{totalPages.toLocaleString()}</p>
          <p className="mt-1 text-xs text-gray-500">Pages</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{finishedCount}</p>
          <p className="mt-1 text-xs text-gray-500">Finished</p>
        </div>
      </div>

      {/* Top authors */}
      {stats.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Top Authors ({year})</h2>
          <ul className="divide-y divide-gray-100">
            {stats.map(
              (s: {
                authorId: string;
                authorName: string;
                bookCount: number;
                totalPages: number;
              }) => (
                <li key={s.authorId} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{s.authorName}</span>
                  <div className="flex items-center gap-3">
                    <Badge color="indigo">
                      {s.bookCount} {s.bookCount === 1 ? 'book' : 'books'}
                    </Badge>
                    <span className="text-xs text-gray-400">{s.totalPages} pp.</span>
                  </div>
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          to="/books"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          View all books →
        </Link>
        <Link
          to="/authors"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Manage authors →
        </Link>
      </div>
    </div>
  );
}
