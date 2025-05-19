#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function clearSession() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Clear the sessions collection
    const result = await mongoose.connection.collection('sessions').deleteMany({});
    console.log(`Cleared ${result.deletedCount} sessions`);

    // Clear the users collection
    const userResult = await mongoose.connection.collection('users').deleteMany({});
    console.log(`Cleared ${userResult.deletedCount} users`);

    // Clear the accounts collection
    const accountResult = await mongoose.connection.collection('accounts').deleteMany({});
    console.log(`Cleared ${accountResult.deletedCount} accounts`);

    // Clear the verificationtokens collection
    const tokenResult = await mongoose.connection.collection('verificationtokens').deleteMany({});
    console.log(`Cleared ${tokenResult.deletedCount} verification tokens`);

    await mongoose.disconnect();
    console.log('Session cleared successfully!');
  } catch (error) {
    console.error('Error clearing session:', error);
    process.exit(1);
  }
}

clearSession(); 