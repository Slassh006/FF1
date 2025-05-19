const { connectDB } = require('../app/lib/db');
const User = require('../app/models/User').default;
const bcrypt = require('bcryptjs');

async function testAuthFlow() {
  try {
    console.log('1. Testing database connection...');
    await connectDB();
    console.log('✓ Database connected successfully\n');

    // Test user credentials
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test123456'
    };

    console.log('2. Cleaning up any existing test user...');
    await User.deleteOne({ email: testUser.email });
    console.log('✓ Cleanup completed\n');

    console.log('3. Testing user registration...');
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    const user = await User.create({
      ...testUser,
      password: hashedPassword,
      emailVerified: true
    });
    console.log('✓ User registered successfully:', user.email);
    console.log('✓ User ID:', user._id, '\n');

    console.log('4. Testing user login...');
    const foundUser = await User.findOne({ email: testUser.email }).select('+password');
    if (!foundUser) {
      throw new Error('User not found in database');
    }
    console.log('✓ User found in database');

    const isPasswordValid = await foundUser.comparePassword(testUser.password);
    if (!isPasswordValid) {
      throw new Error('Password validation failed');
    }
    console.log('✓ Password validated successfully\n');

    console.log('5. Testing user data retrieval...');
    const userWithoutPassword = await User.findById(user._id).select('-password');
    console.log('✓ User data retrieved:', {
      id: userWithoutPassword._id,
      name: userWithoutPassword.name,
      email: userWithoutPassword.email,
      emailVerified: userWithoutPassword.emailVerified
    }, '\n');

    console.log('6. Cleaning up test data...');
    await User.deleteOne({ email: testUser.email });
    console.log('✓ Test user removed from database\n');

    console.log('✅ All tests passed successfully!\n');
    console.log('Test credentials for manual testing:');
    console.log('Email:', testUser.email);
    console.log('Password:', testUser.password);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
console.log('Starting authentication flow tests...\n');
testAuthFlow(); 