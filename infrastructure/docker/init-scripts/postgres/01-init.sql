-- =============================================================================
-- Library Management System - PostgreSQL Initialization
-- =============================================================================

-- Create databases for each service
CREATE DATABASE library_books;
CREATE DATABASE library_authors;
CREATE DATABASE library_stats;

-- Connect to library_books and create schema
\c library_books;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Books table (Write Model)
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    author_id UUID NOT NULL,
    page_count INTEGER NOT NULL CHECK (page_count > 0),
    isbn VARCHAR(20),
    year_read INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'TO_READ',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    cover_url TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes table
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    page INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chapter VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domain Events table (Event Store)
CREATE TABLE domain_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB,
    version INTEGER NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_books_author_id ON books(author_id);
CREATE INDEX idx_books_year_read ON books(year_read);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_quotes_book_id ON quotes(book_id);
CREATE INDEX idx_notes_book_id ON notes(book_id);
CREATE INDEX idx_domain_events_aggregate ON domain_events(aggregate_id, aggregate_type);
CREATE INDEX idx_domain_events_type ON domain_events(event_type);
CREATE INDEX idx_domain_events_unprocessed ON domain_events(processed_at) WHERE processed_at IS NULL;

-- Connect to library_authors
\c library_authors;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Authors table
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    biography TEXT,
    nationality VARCHAR(100),
    total_books INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domain Events table
CREATE TABLE domain_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB,
    version INTEGER NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_authors_name ON authors(name);
CREATE INDEX idx_author_events_aggregate ON domain_events(aggregate_id, aggregate_type);

-- Connect to library_stats
\c library_stats;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Yearly stats table
CREATE TABLE yearly_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL UNIQUE,
    total_books INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly stats table
CREATE TABLE monthly_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    book_count INTEGER DEFAULT 0,
    page_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year, month)
);

-- Indexes
CREATE INDEX idx_yearly_stats_year ON yearly_stats(year);
CREATE INDEX idx_monthly_stats_year_month ON monthly_stats(year, month);

-- Success message
\echo 'PostgreSQL initialization completed successfully!'
