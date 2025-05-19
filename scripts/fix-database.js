const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!\n');

    const db = mongoose.connection.db;

    // 1. Fix CraftlandCodes Collection
    console.log('🔧 Fixing CraftlandCodes Collection...');
    const craftlandCodeSchema = new mongoose.Schema({
      code: {
        type: String,
        required: [true, 'Code is required'],
        unique: true,
        trim: true,
        match: [/^FFCL-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, 'Invalid code format']
      },
      title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minLength: [3, 'Title must be at least 3 characters'],
        maxLength: [100, 'Title cannot exceed 100 characters']
      },
      description: String,
      category: String,
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      },
      region: {
        type: String,
        required: true,
        enum: ['IN', 'ID', 'BR', 'MENA', 'US', 'EU', 'TH', 'VN', 'TW', 'RU', 'SA', 'NA', 'BD', 'PK', 'SG', 'MY', 'GLOBAL']
      },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      downloadCount: {
        type: Number,
        default: 0
      },
      imageUrl: String,
      imageId: String,
      videoUrl: String,
      features: [String],
      tags: [String],
      createdAt: {
        type: Date,
        default: Date.now
      }
    });

    // Add indexes for CraftlandCodes
    craftlandCodeSchema.index({ region: 1 });
    craftlandCodeSchema.index({ isVerified: 1 });
    craftlandCodeSchema.index({ createdAt: -1 });
    craftlandCodeSchema.index({ category: 1 });
    craftlandCodeSchema.index({ creator: 1 });
    craftlandCodeSchema.index({ code: 1 }, { unique: true });
    craftlandCodeSchema.index({ downloadCount: -1 });
    craftlandCodeSchema.index({ status: 1 });

    // Create or update CraftlandCodes collection
    const CraftlandCode = mongoose.models.CraftlandCode || mongoose.model('CraftlandCode', craftlandCodeSchema);
    await CraftlandCode.syncIndexes();
    console.log('✅ CraftlandCodes collection fixed\n');

    // 2. Fix Users Collection
    console.log('🔧 Fixing Users Collection...');
    const userSchema = new mongoose.Schema({
      name: String,
      email: {
        type: String,
        unique: true
      },
      password: String,
      role: {
        type: String,
        default: 'user'
      },
      isAdmin: {
        type: Boolean,
        default: false
      },
      coins: {
        type: Number,
        default: 0
      },
      avatar: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    });

    // Add indexes for Users
    userSchema.index({ email: 1 }, { unique: true });
    userSchema.index({ role: 1 });
    userSchema.index({ coins: -1 });
    userSchema.index({ createdAt: -1 });

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    await User.syncIndexes();
    console.log('✅ Users collection fixed\n');

    // 3. Fix Media Collections
    console.log('🔧 Fixing Media Collections...');
    // Ensure GridFS buckets exist
    const buckets = ['uploads', 'wallpapers'];
    for (const bucket of buckets) {
      const exists = await db.listCollections({ name: `${bucket}.files` }).hasNext();
      if (!exists) {
        console.log(`Creating ${bucket} GridFS bucket...`);
        new mongoose.mongo.GridFSBucket(db, { bucketName: bucket });
      }
    }
    console.log('✅ Media collections fixed\n');

    // 4. Fix empty but required collections
    console.log('🔧 Creating/Fixing empty collections...');
    const requiredCollections = [
      'notifications',
      'activities',
      'comments',
      'blogs',
      'orders',
      'settings'
    ];

    for (const collName of requiredCollections) {
      const exists = await db.listCollections({ name: collName }).hasNext();
      if (!exists) {
        console.log(`Creating ${collName} collection...`);
        await db.createCollection(collName);
      }
    }
    console.log('✅ Empty collections fixed\n');

    // 5. Verify all collections
    console.log('🔍 Verifying all collections...');
    const collections = await db.listCollections().toArray();
    console.log(`Total collections: ${collections.length}`);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} documents`);
    }

    console.log('\n✅ Database fix completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your application');
    console.log('2. Try creating a new craftland code');
    console.log('3. Check MongoDB Compass to verify the changes');

  } catch (error) {
    console.error('❌ Error during database fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

fixDatabase(); 