/**
 * Database initialization script for TheFreeFireIndia
 * Run this script once after deploying to Hostinger to set up the database
 * This will:
 * 1. Create the admin user
 * 2. Initialize sample data for each collection if they are empty
 * 
 * Usage: node scripts/init-db.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { Schema } = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Connect to MongoDB
async function connectDB() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log('Connected to MongoDB Atlas successfully!');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// User Schema
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    isAdmin: Boolean,
  },
  { timestamps: true }
);

// Hash the password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

// Blog Schema
const BlogSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    content: String,
    excerpt: String,
    coverImage: String,
    author: String,
    isPublished: Boolean,
    tags: [String],
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

// Wallpaper Schema
const WallpaperSchema = new mongoose.Schema(
  {
    title: String,
    imageUrl: String,
    thumbnailUrl: String,
    category: String,
    tags: [String],
    resolution: String,
    downloadCount: Number,
    isPublished: Boolean,
  },
  { timestamps: true }
);

// RedeemCode Schema
const RedeemCodeSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    description: String,
    expiresAt: Date,
    isActive: Boolean,
    reward: String,
  },
  { timestamps: true }
);

// CraftlandCode Schema
const CraftlandCodeSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    title: String,
    description: String,
    category: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    downloadCount: { type: Number, default: 0 },
    coverImage: String,
    videoUrl: String,
    features: [String],
    upvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    isVerified: { type: Boolean, default: false },
    region: {
      type: String,
      required: true,
      enum: ['IN', 'ID', 'BR', 'MENA', 'US', 'EU']
    }
  },
  { timestamps: true }
);

// Page Schema
const PageSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true },
    title: String,
    content: String,
    metaTitle: String,
    metaDescription: String,
    isPublished: Boolean,
  },
  { timestamps: true }
);

// Setup models
const models = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Blog: mongoose.models.Blog || mongoose.model('Blog', BlogSchema),
  Wallpaper: mongoose.models.Wallpaper || mongoose.model('Wallpaper', WallpaperSchema),
  RedeemCode: mongoose.models.RedeemCode || mongoose.model('RedeemCode', RedeemCodeSchema),
  CraftlandCode: mongoose.models.CraftlandCode || mongoose.model('CraftlandCode', CraftlandCodeSchema),
  Page: mongoose.models.Page || mongoose.model('Page', PageSchema)
};

// Sample blog post
const sampleBlog = {
  title: 'Welcome to TheFreeFireIndia',
  slug: 'welcome-to-thefreefireindia',
  content: '<p>Welcome to the official TheFreeFireIndia website! Here you will find the latest news, guides, and resources for Free Fire players in India.</p>',
  excerpt: 'Welcome to the official TheFreeFireIndia website!',
  coverImage: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  author: 'Admin',
  isPublished: true,
  tags: ['Welcome', 'News'],
  metaTitle: 'Welcome to TheFreeFireIndia - Your Ultimate Resource',
  metaDescription: 'The official TheFreeFireIndia website with the latest news, guides, and resources for Free Fire players in India.'
};

// Sample wallpaper
const sampleWallpaper = {
  title: 'Free Fire Character Wallpaper',
  imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
  thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Character',
  tags: ['Character', 'HD'],
  resolution: '1920x1080',
  downloadCount: 0,
  isPublished: true
};

// Sample redeem code
const sampleRedeemCode = {
  code: 'FFTESTCODE2023',
  description: 'Test redeem code for TheFreeFireIndia',
  expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  isActive: true,
  reward: 'Test Reward'
};

// Sample craftland code
const sampleCraftlandCode = {
  code: 'FFCL-TEST-1234',
  title: 'Test Craftland Map',
  description: 'A test craftland map for TheFreeFireIndia',
  category: 'Battle Arena',
  imageUrl: 'https://images.unsplash.com/photo-1603852452515-2dc92619acc4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
  thumbnailUrl: 'https://images.unsplash.com/photo-1603852452515-2dc92619acc4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  difficulty: 'Medium',
  creator: 'Admin',
  rating: 5.0,
  isActive: true
};

// Sample page
const samplePage = {
  slug: 'about-us',
  title: 'About Us',
  content: '<h1>About TheFreeFireIndia</h1><p>We are a community dedicated to providing the best resources for Free Fire players in India.</p>',
  metaTitle: 'About TheFreeFireIndia',
  metaDescription: 'Learn about TheFreeFireIndia, the premier resource for Free Fire players in India.',
  isPublished: true
};

// Initialize database
async function initializeDatabase() {
  try {
    // --- Admin User Creation - COMMENTED OUT ---
    // Create admin user if it doesn't exist
    // const existingUser = await models.User.findOne({ email: adminUser.email });
    // if (!existingUser) {
    //   console.log('Creating admin user...');
    //   await models.User.create(adminUser);
    //   console.log('Admin user created successfully!');
    // } else {
    //   console.log('Admin user already exists.');
    // }
    // --- END Admin User Creation Comment Out ---
    
    // Check if blog collection is empty
    const blogCount = await models.Blog.countDocuments();
    if (blogCount === 0) {
      console.log('Creating sample blog post...');
      await models.Blog.create(sampleBlog);
      console.log('Sample blog post created successfully!');
    } else {
      console.log('Blog collection already has data.');
    }
    
    // Check if wallpaper collection is empty
    const wallpaperCount = await models.Wallpaper.countDocuments();
    if (wallpaperCount === 0) {
      console.log('Creating sample wallpaper...');
      await models.Wallpaper.create(sampleWallpaper);
      console.log('Sample wallpaper created successfully!');
    } else {
      console.log('Wallpaper collection already has data.');
    }
    
    // Check if redeem code collection is empty
    const redeemCodeCount = await models.RedeemCode.countDocuments();
    if (redeemCodeCount === 0) {
      console.log('Creating sample redeem code...');
      await models.RedeemCode.create(sampleRedeemCode);
      console.log('Sample redeem code created successfully!');
    } else {
      console.log('Redeem code collection already has data.');
    }
    
    // Check if craftland code collection is empty
    const craftlandCodeCount = await models.CraftlandCode.countDocuments();
    if (craftlandCodeCount === 0) {
      console.log('Creating sample craftland code...');
      await models.CraftlandCode.create(sampleCraftlandCode);
      console.log('Sample craftland code created successfully!');
    } else {
      console.log('Craftland code collection already has data.');
    }
    
    // Check if page collection is empty
    const pageCount = await models.Page.countDocuments();
    if (pageCount === 0) {
      console.log('Creating sample page...');
      await models.Page.create(samplePage);
      console.log('Sample page created successfully!');
    } else {
      console.log('Page collection already has data.');
    }
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Run initialization
async function run() {
  const connected = await connectDB();
  if (connected) {
    await initializeDatabase();
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run(); 