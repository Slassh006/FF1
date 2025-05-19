const mongoose = require('mongoose');
require('dotenv').config();

async function verifyAllDatabases() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!\n');

    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    console.log('📊 Database Information:');
    console.log('------------------------');
    console.log(`Database Name: ${db.databaseName}`);
    console.log(`Total Collections: ${collections.length}\n`);

    console.log('📑 Collections Overview:');
    console.log('------------------------');
    
    // Check each collection
    for (const collection of collections) {
      const documentCount = await db.collection(collection.name).countDocuments();
      const indexes = await db.collection(collection.name).indexes();
      
      console.log(`\n📁 Collection: ${collection.name}`);
      console.log(`   Documents: ${documentCount}`);
      console.log(`   Indexes: ${indexes.length}`);
      
      if (indexes.length > 0) {
        console.log('   Index List:');
        indexes.forEach(index => {
          console.log(`   - ${Object.keys(index.key).join(', ')} (${index.name})`);
        });
      }
    }
    
    console.log('\n✅ Database verification completed successfully!');
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

verifyAllDatabases(); 