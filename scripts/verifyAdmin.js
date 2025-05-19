// scripts/verifyAdmin.js
require('dotenv').config({ path: '../.env' }); // Load .env file from parent directory
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Adjust the path if your User model is located elsewhere

const ADMIN_EMAIL = 'akash@gmail.com';
const PASSWORD_TO_VERIFY = '9955003131'; // The password to check

const verifyAdmin = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully.');

    // Find the user by email
    console.log(`Looking for user: ${ADMIN_EMAIL}`);
    const user = await User.findOne({ email: ADMIN_EMAIL });

    if (!user) {
      console.error(`Verification Failed: User with email ${ADMIN_EMAIL} not found.`);
      process.exitCode = 1; // Set exit code to indicate failure
    } else {
      console.log(`User ${ADMIN_EMAIL} found. Verifying password...`);
      // Compare the provided password with the stored hash
      const isMatch = await bcrypt.compare(PASSWORD_TO_VERIFY, user.password);

      if (isMatch) {
        console.log('Verification Successful: Password matches.');
        // Optionally, check if the role is admin
        if (user.role === 'admin') {
            console.log('Role Check: User is an admin.');
        } else {
            console.warn(`Role Check: User exists and password matches, but role is '${user.role}', not 'admin'.`);
        }
      } else {
        console.error('Verification Failed: Password does not match.');
         process.exitCode = 1; // Set exit code to indicate failure
      }
    }
  } catch (error) {
    console.error('Error verifying admin user:', error);
    process.exitCode = 1; // Set exit code to indicate failure
  } finally {
    // Ensure database connection is closed
    try {
      await mongoose.disconnect();
      console.log('Database connection closed.');
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
};

// Execute the function
verifyAdmin(); 