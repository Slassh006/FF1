import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
// Remove Prisma import
// import { prisma } from '@/lib/prisma'; 
// Import Mongoose tools
import dbConnect from '@/app/lib/dbConnect';
import { User as UserModel, IUser } from '@/app/models/User'; // Assuming this path is correct despite linter issues
// Import bcryptjs
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose'; // Import mongoose for potential error handling

// Define a type for the lean user document
type LeanUser = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: 'admin' | 'subscriber';
  isAdmin: boolean;
  createdAt: Date;
  lastLogin?: Date;
};

// Get users with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Use role check consistent with User model
    if (!session || session.user?.role !== 'admin') { 
      return NextResponse.json(
        { error: 'You do not have permission to view users' },
        { status: 403 }
      );
    }

    // --- Pagination & Filtering Logic ---
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    // --- End Pagination & Filtering Logic ---

    await dbConnect(); // Connect using Mongoose helper

    // --- Build Filter Query ---
    const filterQuery: mongoose.FilterQuery<IUser> = {}; // Use IUser type for filter query

    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive regex
      filterQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    if (role && role !== 'all') {
        // Ensure valid roles if needed, or trust frontend for now
        filterQuery.role = role;
    }
    // --- End Build Filter Query ---

    // --- Fetch users with filter ---
    const users = await UserModel.find(filterQuery) // Apply the filter
      .select('_id name email role isAdmin createdAt lastLogin') // Select relevant fields (_id instead of id)
      .sort({ createdAt: 'desc' })
      .skip(skip) 
      .limit(limit)
      .lean(); // Use lean for performance
    // --- End Fetch users ---

    // --- Get total count with filter ---
    const totalCount = await UserModel.countDocuments(filterQuery); // Apply filter to count
    // --- End Get total count ---

    // --- Return paginated data --- 
    // Map _id to id for frontend consistency if needed
    const formattedUsers = users.map(user => {
      const typedUser = user as unknown as LeanUser;
      return {
        id: typedUser._id.toString(),
        name: typedUser.name,
        email: typedUser.email,
        role: typedUser.role,
        isAdmin: typedUser.isAdmin,
        createdAt: typedUser.createdAt,
        lastLogin: typedUser.lastLogin?.toISOString() || null
      };
    });
    
    return NextResponse.json({
      users: formattedUsers, 
      totalCount,  
      page,        
      limit,       
      totalPages: Math.ceil(totalCount / limit) 
    });
    // --- End Return data ---

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching users' },
      { status: 500 }
    );
  }
}

// Create a new user (Refactored for Mongoose)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to create users' },
        { status: 403 }
      );
    }

    await dbConnect(); // Ensure connection before checking/creating

    const body = await req.json();
    const { name, email, password, role, isAdmin, coins, permissions } = body;

    // Validate required fields
    if (!name || !email || !password) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists (using Mongoose)
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 } // Use 409 Conflict? 400 is also okay
      );
    }

    // Hash password (using bcryptjs)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (using Mongoose)
    const newUser = new UserModel({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      // Use role from body, default to subscriber if not provided or invalid
      role: ['admin', 'subscriber'].includes(role) ? role : 'subscriber',
      // Ensure isAdmin syncs with role
      isAdmin: (role === 'admin') ? true : (isAdmin || false),
      coins: coins || 0,
      permissions: permissions || [],
      emailVerified: true // Assume admin-created users are verified
      // Add other default fields from your UserSchema if necessary
    });
    
    const savedUser = await newUser.save();
    
    // Don't send back the hashed password
    const userResponse = { ...savedUser.toObject() };
    delete userResponse.password; 

    return NextResponse.json({
      message: 'User created successfully',
      user: userResponse,
    }, { status: 201 }); // Use 201 Created status

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle Mongoose duplicate key error for email (code 11000)
    if (error.code === 11000 && error.keyPattern?.email) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }
    // Handle other Mongoose validation errors
     if (error instanceof mongoose.Error.ValidationError) {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
     }

    return NextResponse.json(
      { error: 'An unexpected error occurred while creating the user' },
      { status: 500 }
    );
  }
} 