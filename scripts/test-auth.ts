import { connectDB } from '../app/lib/db';
import User from '../app/models/User';
import bcrypt from 'bcryptjs';

async function testAuth() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    // Test user credentials
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test123456'
    };

    // Delete existing test user if exists
    await User.deleteOne({ email: testUser.email });
    console.log('Cleaned up existing test user');

    // Create test user
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    const user = await User.create({
      ...testUser,
      password: hashedPassword,
      emailVerified: true
    });
    console.log('Created test user:', user.email);

    // Test login by finding user and comparing password
    const foundUser = await User.findOne({ email: testUser.email }).select('+password');
    if (!foundUser) {
      throw new Error('User not found');
    }

    const isPasswordValid = await foundUser.comparePassword(testUser.password);
    console.log('Password validation:', isPasswordValid ? 'SUCCESS' : 'FAILED');

    // Clean up
    await User.deleteOne({ email: testUser.email });
    console.log('Cleaned up test user');

    console.log('\nTest credentials for manual testing:');
    console.log('Email:', testUser.email);
    console.log('Password:', testUser.password);
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testAuth(); 