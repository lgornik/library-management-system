import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_AUTHORS } from '../graphql/queries';
import { AuthorList } from '../components/AuthorList';
import { AuthorForm } from '../components/AuthorForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export function AuthorsPage() {
  const { data, loading, error } = useQuery(GET_AUTHORS, {
    variables: { sortBy: 'name', sortOrder: 'asc' },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<{
    id: string;
    name: string;
    biography?: string | null;
    nationality?: string | null;
  } | null>(null);

  const openCreate = () => {
    setEditingAuthor(null);
    setModalOpen(true);
  };

  const openEdit = (author: { id: string; name: string; nationality: string | null }) => {
    setEditingAuthor(author);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAuthor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Authors</h1>
        <Button onClick={openCreate}>+ Add Author</Button>
      </div>

      {loading && <p className="text-gray-500">Loading authors...</p>}
      {error && <p className="text-red-600">Error: {error.message}</p>}
      {data && <AuthorList authors={data.authors} onEdit={openEdit} />}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingAuthor ? 'Edit Author' : 'New Author'}
      >
        <AuthorForm author={editingAuthor} onDone={closeModal} />
      </Modal>
    </div>
  );
}
