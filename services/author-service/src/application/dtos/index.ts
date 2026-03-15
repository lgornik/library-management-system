/**
 * Read model for author list items
 */
export interface AuthorListItemDto {
  id: string;
  name: string;
  nationality: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Read model for full author details
 */
export interface AuthorDetailsDto {
  id: string;
  name: string;
  biography: string | null;
  nationality: string | null;
  createdAt: Date;
  updatedAt: Date;
}
