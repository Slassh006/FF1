import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import Withdrawal from '@/models/Withdrawal';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
// ... existing code ... 