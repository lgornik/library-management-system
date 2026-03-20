import { useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_AUTHOR, UPDATE_AUTHOR } from '../graphql/mutations';
import { GET_AUTHORS } from '../graphql/queries';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';

interface AuthorFormProps {
  author?: { id: string; name: string; biography?: string | null; nationality?: string | null } | null;
  onDone: () => void;
}

export function AuthorForm({ author, onDone }: AuthorFormProps) {
  const isEdit = !!author;
  const [name, setName] = useState(author?.name ?? '');
  const [biography, setBiography] = useState(author?.biography ?? '');
  const [nationality, setNationality] = useState(author?.nationality ?? '');

  const refetchQueries = [{ query: GET_AUTHORS, variables: { sortBy: 'name', sortOrder: 'asc' } }];

  const [createAuthor, { loading: creating }] = useMutation(CREATE_AUTHOR, { refetchQueries });
  const [updateAuthor, { loading: updating }] = useMutation(UPDATE_AUTHOR, { refetchQueries });

  const loading = creating || updating;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEdit) {
      await updateAuthor({
        variables: {
          input: {
            authorId: author!.id,
            name: name.trim(),
            biography: biography.trim() || null,
            nationality: nationality.trim() || null,
          },
        },
      });
    } else {
      await createAuthor({
        variables: {
          input: {
            name: name.trim(),
            biography: biography.trim() || undefined,
            nationality: nationality.trim() || undefined,
          },
        },
      });
    }
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
      <Textarea label="Biography" value={biography} onChange={(e) => setBiography(e.target.value)} />
      <Input label="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
