import { connectDB } from '../app/lib/db';
import User from '../app/models/User';
import bcrypt from 'bcryptjs';

async function initializeAdmin() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'akash@gmail.com' });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('9955003131', 12);

    // Create admin user
    await User.create({
      name: 'Akash Singh',
      email: 'akash@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isAdmin: true,
      emailVerified: true
    });

    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing admin:', error);
    process.exit(1);
  }
}

initializeAdmin(); 