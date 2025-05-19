const mongoose = require('mongoose');
require('dotenv').config();

async function verifyCraftlandSetup() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Define the CraftlandCode schema
    const craftlandCodeSchema = new mongoose.Schema({
      code: {
        type: String,
        required: [true, 'Code is required'],
        unique: true,
        trim: true,
        match: [/^FFCL-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, 'Invalid code format. Use FFCL-XXXX-XXXX']
      },
      title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minLength: [3, 'Title must be at least 3 characters long'],
        maxLength: [100, 'Title cannot exceed 100 characters']
      },
      description: String,
      category: String,
      region: String,
      isVerified: {
        type: Boolean,
        default: false
      },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    });

    // Add all required indexes
    craftlandCodeSchema.index({ region: 1 });
    craftlandCodeSchema.index({ isVerified: 1 });
    craftlandCodeSchema.index({ createdAt: -1 });
    craftlandCodeSchema.index({ category: 1 });
    craftlandCodeSchema.index({ creator: 1 });
    craftlandCodeSchema.index({ code: 1 }, { unique: true });

    // Create or get the model
    const CraftlandCode = mongoose.models.CraftlandCode || mongoose.model('CraftlandCode', craftlandCodeSchema);

    // Get collection information
    const collections = await mongoose.connection.db.listCollections().toArray();
    const craftlandCodesExists = collections.some(col => col.name === 'craftlandcodes');

    if (!craftlandCodesExists) {
      console.log('⚠️ CraftlandCode collection does not exist. Creating...');
      await mongoose.connection.createCollection('craftlandcodes');
      console.log('✅ Created CraftlandCode collection!');
    } else {
      console.log('✅ CraftlandCode collection exists!');
    }

    // Verify indexes
    const indexes = await CraftlandCode.collection.indexes();
    console.log('\n📊 Current indexes on CraftlandCode collection:');
    indexes.forEach(index => {
      console.log(`- ${Object.keys(index.key).join(', ')} (${index.name})`);
    });

    // Create any missing indexes
    await CraftlandCode.syncIndexes();
    console.log('\n✅ Indexes synchronized successfully!');

    // Get document count
    const count = await CraftlandCode.countDocuments();
    console.log(`\n📝 Total documents in collection: ${count}`);

    console.log('\n✅ Setup verification completed successfully!');
  } catch (error) {
    console.error('❌ Error during setup verification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

verifyCraftlandSetup(); 