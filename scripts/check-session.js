#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Define the User Schema
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'subscriber'],
      default: 'subscriber',
    },
    permissions: [{
      type: String,
      enum: [
        'read:blogs',
        'write:blogs',
        'read:wallpapers',
        'write:wallpapers',
        'read:users',
        'write:users',
        'read:orders',
        'write:orders',
        'manage:settings'
      ]
    }],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

async function checkSession() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Find admin user
    const user = await User.findOne({ email: 'akash@gmail.com' });

    if (user) {
      console.log('User found:');
      console.log({
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        permissions: user.permissions,
        isActive: user.isActive,
        emailVerified: user.emailVerified
      });
    } else {
      console.log('User not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error checking session:', error);
    process.exit(1);
  }
}

checkSession(); 