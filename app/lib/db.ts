import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global as any;
cached.mongoose = cached.mongoose || { conn: null, promise: null };
cached.mongodb = cached.mongodb || { client: null, promise: null };

function setupConnectionHandlers(connection: mongoose.Connection) {
  connection.on('connected', () => {
    console.log('MongoDB connected successfully');
  });

  connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    // Reset the connection cache on error
    cached.mongoose.conn = null;
    cached.mongoose.promise = null;
  });

  connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    cached.mongoose.conn = null;
    cached.mongoose.promise = null;
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    try {
      await connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });
}

export async function connectDB() {
  try {
    if (cached.mongoose.conn) {
      return cached.mongoose.conn;
    }

    if (!cached.mongoose.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      cached.mongoose.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        setupConnectionHandlers(mongoose.connection);
        return mongoose;
      });
    }

    cached.mongoose.conn = await cached.mongoose.promise;
    return cached.mongoose.conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    cached.mongoose.promise = null;
    throw error;
  }
}

export async function getMongoClient() {
  try {
    if (cached.mongodb.client) {
      return cached.mongodb.client;
    }

    if (!cached.mongodb.promise) {
      const opts = {
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      };

      cached.mongodb.promise = MongoClient.connect(MONGODB_URI, opts).then((client) => {
        console.log('MongoDB native client connected successfully');
        return client;
      });
    }

    cached.mongodb.client = await cached.mongodb.promise;
    return cached.mongodb.client;
  } catch (error) {
    console.error('Error connecting to MongoDB native client:', error);
    cached.mongodb.promise = null;
    throw error;
  }
} 