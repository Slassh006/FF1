import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

function setupConnectionHandlers(connection: mongoose.Connection) {
  connection.on('connected', () => {
    console.log('MongoDB connected successfully');
  });

  connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
  });

  connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
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

async function dbConnect(): Promise<typeof mongoose> {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
        setupConnectionHandlers(mongooseInstance.connection);
        return mongooseInstance;
      });
    }

    const mongooseInstance = await cached.promise;
    cached.conn = mongooseInstance;
    return mongooseInstance;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    cached.promise = null;
    throw error;
  }
}

export default dbConnect; 