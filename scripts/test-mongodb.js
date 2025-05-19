const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Using URI:', process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@')); // Hide password in logs
    
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_CONNECTION_TIMEOUT) || 120000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 180000,
    });

    console.log('Successfully connected to MongoDB!');
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

  } catch (error) {
    console.error('\nFailed to connect to MongoDB');
    console.error('Error details:', error);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check if your MongoDB password is correct');
    console.error('2. Verify that your IP address is whitelisted in MongoDB Atlas');
    console.error('3. Ensure the cluster is running and accessible');
    console.error('4. Check if the database name in the connection string is correct');
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nConnection closed.');
    }
    process.exit(0);
  }
}

testConnection(); 