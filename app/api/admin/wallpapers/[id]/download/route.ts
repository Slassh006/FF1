import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '../../../../../lib/db';
import Wallpaper from '../../../../../models/Wallpaper';
import { getFile } from '../../../../../lib/gridfs';

// ... existing code ... 