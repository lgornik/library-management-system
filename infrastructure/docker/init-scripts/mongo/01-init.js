// =============================================================================
// Library Management System - MongoDB Initialization
// =============================================================================

// Switch to library_read database
db = db.getSiblingDB('library_read');

// Create collections with validation
db.createCollection('books', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'title', 'authorId', 'authorName', 'pageCount', 'status'],
      properties: {
        _id: { bsonType: 'string' },
        title: { bsonType: 'string' },
        authorId: { bsonType: 'string' },
        authorName: { bsonType: 'string' },
        pageCount: { bsonType: 'int', minimum: 1 },
        isbn: { bsonType: 'string' },
        yearRead: { bsonType: 'int' },
        status: { enum: ['TO_READ', 'READING', 'FINISHED', 'ABANDONED'] },
        rating: { bsonType: 'int', minimum: 1, maximum: 5 },
        coverUrl: { bsonType: 'string' },
        quotes: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['id', 'content'],
            properties: {
              id: { bsonType: 'string' },
              content: { bsonType: 'string' },
              page: { bsonType: 'int' }
            }
          }
        },
        notes: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['id', 'content'],
            properties: {
              id: { bsonType: 'string' },
              content: { bsonType: 'string' },
              chapter: { bsonType: 'string' }
            }
          }
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('authors', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name'],
      properties: {
        _id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        biography: { bsonType: 'string' },
        nationality: { bsonType: 'string' },
        totalBooks: { bsonType: 'int' },
        totalPages: { bsonType: 'int' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('yearlyStats', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'year'],
      properties: {
        _id: { bsonType: 'string' },
        year: { bsonType: 'int' },
        totalBooks: { bsonType: 'int' },
        totalPages: { bsonType: 'int' },
        averageRating: { bsonType: 'double' },
        topAuthors: { bsonType: 'array' },
        monthlyBreakdown: { bsonType: 'array' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for books collection
db.books.createIndex({ authorId: 1 });
db.books.createIndex({ yearRead: 1 });
db.books.createIndex({ status: 1 });
db.books.createIndex({ yearRead: 1, pageCount: -1 }); // For "books by year sorted by pages"
db.books.createIndex({ title: 'text', 'authorName': 'text' }); // Full-text search

// Create indexes for authors collection
db.authors.createIndex({ name: 1 });
db.authors.createIndex({ name: 'text' }); // Full-text search

// Create indexes for yearly stats
db.yearlyStats.createIndex({ year: 1 }, { unique: true });

print('MongoDB initialization completed successfully!');
