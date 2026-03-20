import { useMutation } from '@apollo/client';
import { DELETE_AUTHOR } from '../graphql/mutations';
import { GET_AUTHORS } from '../graphql/queries';
import { Button } from './ui/Button';

interface Author {
  id: string;
  name: string;
  nationality: string | null;
  createdAt: string;
}

interface AuthorListProps {
  authors: Author[];
  onEdit: (author: Author) => void;
}

export function AuthorList({ authors, onEdit }: AuthorListProps) {
  const [deleteAuthor] = useMutation(DELETE_AUTHOR, {
    refetchQueries: [{ query: GET_AUTHORS, variables: { sortBy: 'name', sortOrder: 'asc' } }],
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete author "${name}"?`)) return;
    await deleteAuthor({ variables: { id } });
  };

  if (authors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
        No authors yet. Add your first author.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nationality</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {authors.map((author) => (
            <tr key={author.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{author.name}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{author.nationality || '—'}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(author)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(author.id, author.name)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
