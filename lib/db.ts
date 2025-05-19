import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let isConnecting = false;
let connectionPromise: Promise<typeof mongoose> | null = null;
let mongoClient: MongoClient | null = null;

export async function connectDB() {
  try {
    // If already connected, return
    if (mongoose.connection.readyState === 1) {
      return;
    }

    // If connection is in progress, wait for it
    if (isConnecting && connectionPromise) {
      return await connectionPromise;
    }

    // Start new connection
    isConnecting = true;
    connectionPromise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: true, // Enable command buffering
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await connectionPromise;
    console.log('Connected to MongoDB');
    
    // Reset connection state
    isConnecting = false;
    connectionPromise = null;

    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Reset connection state on error
    isConnecting = false;
    connectionPromise = null;
    throw error;
  }
}

export async function getMongoClient() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI as string, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await mongoClient.connect();
  }
  return mongoClient;
} 