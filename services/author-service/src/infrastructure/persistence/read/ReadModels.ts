import { Document } from 'mongodb';

/**
 * Author document in MongoDB (Read Model)
 */
export interface AuthorDocument extends Document {
  _id: string; // Same as AuthorId from write model
  name: string;
  biography: string | null;
  nationality: string | null;
  createdAt: Date;
  updatedAt: Date;
}
