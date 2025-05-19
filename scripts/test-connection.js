/**
 * MongoDB Connection Test Script
 * 
 * This script tests the connection to MongoDB using the connection string
 * from environment variables. Use it to verify your database connection
 * before deployment.
 * 
 * Usage: node scripts/test-connection.js
 */

require('dotenv').config({ path: '.env.local' });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: '.env' });
}

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('📡 Testing MongoDB connection...');
    console.log(`🔄 Attempting to connect to: ${uri.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3')}`);
    
    // Connect the client to the server
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
    // List available databases
    const databases = await client.db().admin().listDatabases();
    console.log('\n📊 Available databases:');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name}`);
    });
    
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

run().catch((error) => {
  console.error('\n❌ Failed to connect to MongoDB:');
  console.error(error);
  
  console.log('\n🔍 Troubleshooting tips:');
  console.log('   1. Check if your MongoDB password is correct');
  console.log('   2. Verify your connection string format');
  console.log('   3. Ensure network connectivity to MongoDB Atlas');
  console.log('   4. Check if IP whitelist is configured properly on MongoDB Atlas');
  
  process.exit(1);
}); 