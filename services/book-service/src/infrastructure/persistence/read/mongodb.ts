import { MongoClient, Db, Collection, Document } from 'mongodb';
import { config } from '../../config/index.js';

/**
 * MongoDB client singleton
 */
let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect to MongoDB
 */
export async function connectMongo(): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(config.mongodb.url);
  
  try {
    await client.connect();
    db = client.db();
    console.log('📗 MongoDB: Connected successfully');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Get the MongoDB database instance
 */
export function getDb(): Db {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongo() first.');
  }
  return db;
}

/**
 * Get a typed collection
 */
export function getCollection<T extends Document>(name: string): Collection<T> {
  return getDb().collection<T>(name);
}

/**
 * Close MongoDB connection
 */
export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('📗 MongoDB: Connection closed');
  }
}

/**
 * Health check for MongoDB
 */
export async function healthCheck(): Promise<boolean> {
  try {
    if (!db) {
      return false;
    }
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Collection names
 */
export const Collections = {
  BOOKS: 'books',
  AUTHORS: 'authors',
  YEARLY_STATS: 'yearlyStats',
} as const;
